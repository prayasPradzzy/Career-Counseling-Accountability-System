const mongoose = require("mongoose");
const { AssessmentAssignment, ASSIGNMENT_STATUS } = require("./assessmentAssignment.model");
const AssessmentDefinition = require("./assessmentDefinition.model");
const User = require("../users/user.model");
const StudentProfile = require("../profiles/studentProfile.model");
const ApiError = require("../../shared/utils/ApiError");
const { deriveStudentLifecycleStatus, STUDENT_STATUS } = require("../../shared/constants/studentStatus.constants");

class AssessmentAssignmentService {
  /**
   * 1. Counselor assigns an assessment to a student
   */
  async assignAssessment(data, requestingUser) {
    const { studentId, assessmentDefinitionId, dueDate, scheduledFor, counselorNotes, unlocksNextAssessmentId } = data;

    // RBAC: Only Counselors and Admins can assign assessments
    if (requestingUser.role !== "counselor" && requestingUser.role !== "admin") {
      throw new ApiError(403, "Only counselors and administrators can assign assessments.");
    }

    // Verify Student User exists
    const studentUser = await User.findOne({ _id: studentId, role: "student" });
    if (!studentUser) {
      throw new ApiError(404, "Student user account not found.");
    }

    // HARD BOUNDARY: Counselor can ONLY assign assessments to their own students!
    if (requestingUser.role === "counselor") {
      const counselorIdStr = requestingUser._id.toString();
      const userCounselorIdStr = studentUser.counselorId ? studentUser.counselorId.toString() : null;

      const profile = await StudentProfile.findOne({ userId: studentId });
      const assignedIdStr = profile && profile.assignedCounselorId ? profile.assignedCounselorId.toString() : null;
      const invitedByIdStr = profile && profile.invitedBy ? profile.invitedBy.toString() : null;

      if (userCounselorIdStr !== counselorIdStr && assignedIdStr !== counselorIdStr && invitedByIdStr !== counselorIdStr) {
        throw new ApiError(403, "Access denied: You can only assign work to your own assigned students.");
      }
    }

    // Verify Assessment Definition exists and is active
    const definition = await AssessmentDefinition.findById(assessmentDefinitionId);
    if (!definition || definition.status !== "active") {
      throw new ApiError(404, "Assessment definition not found or inactive.");
    }

    // Check if future scheduled date
    const now = new Date();
    const isFutureScheduled = scheduledFor && new Date(scheduledFor) > now;
    const initialStatus = isFutureScheduled ? ASSIGNMENT_STATUS.SCHEDULED : ASSIGNMENT_STATUS.ASSIGNED;

    const assignment = await AssessmentAssignment.create({
      studentId,
      counselorId: requestingUser._id,
      assessmentDefinitionId,
      category: definition.category,
      status: initialStatus,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      counselorNotes: counselorNotes || "",
      unlocksNextAssessmentId: unlocksNextAssessmentId || undefined,
      assignedAt: now,
    });

    // Update Student Profile Lifecycle Status to ASSESSMENT_PENDING
    const profile = await StudentProfile.findOne({ userId: studentId });
    if (profile) {
      profile.status = deriveStudentLifecycleStatus(profile, { assessmentState: "pending" });
      await profile.save();
    }

    return await AssessmentAssignment.findById(assignment._id)
      .populate("studentId", "firstName lastName email")
      .populate("counselorId", "firstName lastName email")
      .populate("assessmentDefinitionId", "title code category estimatedDuration description");
  }

  /**
   * 2. Get all assessment assignments for a specific student
   */
  async getStudentAssignments(studentId, requestingUser) {
    // RBAC Check: Student can only view their own assignments
    if (requestingUser.role === "student" && requestingUser._id.toString() !== studentId.toString()) {
      throw new ApiError(403, "Access denied. You can only view your own assessment assignments.");
    }

    // RBAC Check: Counselor can ONLY view assignments for their own students
    if (requestingUser.role === "counselor") {
      const counselorIdStr = requestingUser._id.toString();
      const studentUser = await User.findById(studentId);
      const userCounselorIdStr = studentUser && studentUser.counselorId ? studentUser.counselorId.toString() : null;

      const profile = await StudentProfile.findOne({ $or: [{ _id: studentId }, { userId: studentId }] });
      const assignedIdStr = profile && profile.assignedCounselorId ? profile.assignedCounselorId.toString() : null;
      const invitedByIdStr = profile && profile.invitedBy ? profile.invitedBy.toString() : null;

      if (userCounselorIdStr !== counselorIdStr && assignedIdStr !== counselorIdStr && invitedByIdStr !== counselorIdStr) {
        throw new ApiError(403, "Access denied: You can only view assessment assignments for your own assigned students.");
      }
    }

    const assignments = await AssessmentAssignment.find({ studentId })
      .populate("counselorId", "firstName lastName email")
      .populate("assessmentDefinitionId", "title code category estimatedDuration description")
      .populate("unlocksNextAssessmentId", "title code category")
      .sort({ assignedAt: -1 });

    return assignments;
  }

  /**
   * 3. Student fetches their own assigned/unlocked assessments
   */
  async getMyAssignments(studentUser) {
    const assignments = await AssessmentAssignment.find({ studentId: studentUser._id })
      .populate("counselorId", "firstName lastName email")
      .populate("assessmentDefinitionId", "title code category estimatedDuration description")
      .sort({ assignedAt: -1 });

    return assignments;
  }

  /**
   * 4. Student starts an assigned assessment
   * Guard Rule: Students can NEVER freely start tests without an active assignment!
   */
  async startAssignment(assignmentId, studentUser) {
    const assignment = await AssessmentAssignment.findById(assignmentId);

    if (!assignment) {
      throw new ApiError(404, "Assessment assignment not found.");
    }

    // Verify ownership
    if (assignment.studentId.toString() !== studentUser._id.toString()) {
      throw new ApiError(403, "Access denied. This assignment belongs to another student.");
    }

    // Check status: Must be ASSIGNED or SCHEDULED (with scheduled date passed)
    if (
      assignment.status !== ASSIGNMENT_STATUS.ASSIGNED &&
      assignment.status !== ASSIGNMENT_STATUS.SCHEDULED &&
      assignment.status !== ASSIGNMENT_STATUS.IN_PROGRESS
    ) {
      throw new ApiError(400, `Cannot start assessment. Current status is '${assignment.status}'.`);
    }

    // Future scheduled check
    if (assignment.status === ASSIGNMENT_STATUS.SCHEDULED && assignment.scheduledFor > new Date()) {
      throw new ApiError(403, `Assessment is scheduled for ${assignment.scheduledFor.toISOString()} and is not unlocked yet.`);
    }

    // Prerequisite Lock Check
    if (assignment.prerequisiteAssignmentId) {
      const prereq = await AssessmentAssignment.findById(assignment.prerequisiteAssignmentId);
      if (!prereq || prereq.status !== ASSIGNMENT_STATUS.APPROVED) {
        throw new ApiError(
          403,
          "Prerequisite assessment must be completed and approved by your counselor before starting this test."
        );
      }
    }

    // Transition status to IN_PROGRESS
    assignment.status = ASSIGNMENT_STATUS.IN_PROGRESS;
    if (!assignment.startedAt) {
      assignment.startedAt = new Date();
    }
    await assignment.save();

    // Update Lifecycle Status
    const profile = await StudentProfile.findOne({ userId: studentUser._id });
    if (profile) {
      profile.status = deriveStudentLifecycleStatus(profile, { assessmentState: "in-progress" });
      await profile.save();
    }

    return await AssessmentAssignment.findById(assignment._id)
      .populate("counselorId", "firstName lastName email")
      .populate("assessmentDefinitionId", "title code category estimatedDuration description");
  }

  /**
   * 5. Student completes an assigned assessment
   */
  async completeAssignment(assignmentId, studentUser) {
    const assignment = await AssessmentAssignment.findById(assignmentId);

    if (!assignment) {
      throw new ApiError(404, "Assessment assignment not found.");
    }

    if (assignment.studentId.toString() !== studentUser._id.toString()) {
      throw new ApiError(403, "Access denied.");
    }

    if (assignment.status !== ASSIGNMENT_STATUS.IN_PROGRESS) {
      throw new ApiError(400, `Cannot complete assessment. Current status is '${assignment.status}'.`);
    }

    assignment.status = ASSIGNMENT_STATUS.COMPLETED;
    assignment.completedAt = new Date();
    await assignment.save();

    // Update Lifecycle Status
    const profile = await StudentProfile.findOne({ userId: studentUser._id });
    if (profile) {
      profile.status = deriveStudentLifecycleStatus(profile, { assessmentState: "completed" });
      await profile.save();
    }

    return await AssessmentAssignment.findById(assignment._id)
      .populate("counselorId", "firstName lastName email")
      .populate("assessmentDefinitionId", "title code category estimatedDuration description");
  }

  /**
   * 6. Counselor reviews completed assessment
   */
  async reviewAssignment(assignmentId, counselorNotes, counselorUser) {
    if (counselorUser.role !== "counselor" && counselorUser.role !== "admin") {
      throw new ApiError(403, "Only counselors can review assessments.");
    }

    const assignment = await AssessmentAssignment.findById(assignmentId);
    if (!assignment) {
      throw new ApiError(404, "Assessment assignment not found.");
    }

    if (assignment.status !== ASSIGNMENT_STATUS.COMPLETED && assignment.status !== ASSIGNMENT_STATUS.UNDER_REVIEW) {
      throw new ApiError(400, `Cannot review assignment with status '${assignment.status}'. Must be COMPLETED.`);
    }

    assignment.status = ASSIGNMENT_STATUS.UNDER_REVIEW;
    assignment.reviewedAt = new Date();
    if (counselorNotes) {
      assignment.counselorNotes = counselorNotes;
    }
    await assignment.save();

    return await AssessmentAssignment.findById(assignment._id)
      .populate("studentId", "firstName lastName email")
      .populate("counselorId", "firstName lastName email")
      .populate("assessmentDefinitionId", "title code category");
  }

  /**
   * 7. Counselor approves assessment & unlocks next in sequence if configured
   */
  async approveAssignment(assignmentId, counselorNotes, counselorUser) {
    if (counselorUser.role !== "counselor" && counselorUser.role !== "admin") {
      throw new ApiError(403, "Only counselors can approve assessments.");
    }

    const assignment = await AssessmentAssignment.findById(assignmentId);
    if (!assignment) {
      throw new ApiError(404, "Assessment assignment not found.");
    }

    assignment.status = ASSIGNMENT_STATUS.APPROVED;
    assignment.approvedAt = new Date();
    if (counselorNotes) {
      assignment.counselorNotes = counselorNotes;
    }
    await assignment.save();

    // Automatic Unlocking: If next assessment is linked, auto-create assignment
    if (assignment.unlocksNextAssessmentId) {
      const nextDefinition = await AssessmentDefinition.findById(assignment.unlocksNextAssessmentId);
      if (nextDefinition) {
        await AssessmentAssignment.create({
          studentId: assignment.studentId,
          counselorId: counselorUser._id,
          assessmentDefinitionId: nextDefinition._id,
          category: nextDefinition.category,
          status: ASSIGNMENT_STATUS.ASSIGNED,
          assignedAt: new Date(),
          prerequisiteAssignmentId: assignment._id,
        });
      }
    }

    // Update Lifecycle Status to INTERVIEW_PENDING
    const profile = await StudentProfile.findOne({ userId: assignment.studentId });
    if (profile) {
      profile.status = deriveStudentLifecycleStatus(profile, { assessmentState: "completed", interviewState: "pending" });
      await profile.save();
    }

    return await AssessmentAssignment.findById(assignment._id)
      .populate("studentId", "firstName lastName email")
      .populate("counselorId", "firstName lastName email")
      .populate("assessmentDefinitionId", "title code category");
  }

  /**
   * 8. Counselor/Admin fetches list of all assignments with status & category filtering
   */
  async getCounselorAssignments(requestingUser, filters = {}) {
    if (requestingUser.role !== "counselor" && requestingUser.role !== "admin") {
      throw new ApiError(403, "Only counselors and administrators can access counselor assignment lists.");
    }

    const query = {};

    // Counselor scope: include assignments created by counselor OR for counselor's assigned students
    if (requestingUser.role === "counselor") {
      const profiles = await StudentProfile.find({
        $or: [
          { assignedCounselorId: requestingUser._id },
          { invitedBy: requestingUser._id },
        ],
      }).select("userId");
      const profileUserIds = profiles.map((p) => p.userId);

      const users = await User.find({ counselorId: requestingUser._id }).select("_id");
      const userIds = users.map((u) => u._id);

      const studentIds = Array.from(
        new Set([...profileUserIds, ...userIds].map((id) => id.toString()))
      );

      query.$or = [
        { counselorId: requestingUser._id },
        { studentId: { $in: studentIds } },
      ];
    }

    // Specific student filter
    if (filters.studentId) {
      query.studentId = filters.studentId;
    }

    // Category filter
    if (filters.category) {
      query.category = filters.category;
    }

    // Status filter / Status Grouping filter
    if (filters.status) {
      query.status = filters.status;
    } else if (filters.statusGroup) {
      switch (filters.statusGroup.toLowerCase()) {
        case "pending":
        case "not_started":
          query.status = { $in: [ASSIGNMENT_STATUS.ASSIGNED, ASSIGNMENT_STATUS.SCHEDULED] };
          break;
        case "in_progress":
          query.status = ASSIGNMENT_STATUS.IN_PROGRESS;
          break;
        case "submitted":
        case "completed":
          // Include legacy UNDER_REVIEW and APPROVED states in "completed" filter
          query.status = {
            $in: [
              ASSIGNMENT_STATUS.COMPLETED,
              ASSIGNMENT_STATUS.UNDER_REVIEW,
              ASSIGNMENT_STATUS.APPROVED,
            ],
          };
          break;
        case "rejected":
        case "retake":
          query.status = ASSIGNMENT_STATUS.REJECTED;
          break;
        default:
          break;
      }
    }

    const assignments = await AssessmentAssignment.find(query)
      .populate("studentId", "firstName lastName email")
      .populate("counselorId", "firstName lastName email")
      .populate("assessmentDefinitionId", "title code category estimatedDuration description")
      .sort({ assignedAt: -1 });

    // Attach active/completed session progress summary to each assignment
    const assignmentIds = assignments.map((a) => a._id);
    const AssessmentSession = require("./assessmentSession.model");
    const sessions = await AssessmentSession.find({ assignmentId: { $in: assignmentIds } });

    const sessionMap = new Map();
    for (const s of sessions) {
      sessionMap.set(s.assignmentId.toString(), s);
    }

    return assignments.map((a) => {
      const aObj = a.toObject();
      const s = sessionMap.get(a._id.toString());
      aObj.sessionSummary = s
        ? {
            sessionId: s._id,
            status: s.status,
            progress: s.progress,
            timeSpentSeconds: s.timeSpentSeconds,
            startedAt: s.startedAt,
            submittedAt: s.submittedAt,
            flagged: s.flagged || false,
            flagReason: s.flagReason || null,
          }
        : null;
      return aObj;
    });
  }

  /**
   * 9. Counselor requests retake / rejects assignment
   */
  async rejectAssignment(assignmentId, counselorNotes, requestingUser) {
    if (requestingUser.role !== "counselor" && requestingUser.role !== "admin") {
      throw new ApiError(403, "Only counselors can reject or request retakes.");
    }

    const assignment = await AssessmentAssignment.findById(assignmentId);
    if (!assignment) {
      throw new ApiError(404, "Assessment assignment not found.");
    }

    assignment.status = ASSIGNMENT_STATUS.REJECTED;
    if (counselorNotes) {
      assignment.counselorNotes = counselorNotes;
    }
    await assignment.save();

    // Reset session for retake
    const AssessmentSession = require("./assessmentSession.model");
    await AssessmentSession.deleteMany({ assignmentId: assignment._id });

    return await AssessmentAssignment.findById(assignment._id)
      .populate("studentId", "firstName lastName email")
      .populate("counselorId", "firstName lastName email")
      .populate("assessmentDefinitionId", "title code category");
  }

  /**
   * 10. Get Full Assignment Review Details (Metadata, Session, Score, Raw Responses)
   */
  async getAssignmentReviewDetail(assignmentId, requestingUser) {
    if (requestingUser.role !== "counselor" && requestingUser.role !== "admin") {
      throw new ApiError(403, "Access denied. Counselor permissions required.");
    }

    if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
      throw new ApiError(400, "Invalid or missing assignment ID format.");
    }

    const assignment = await AssessmentAssignment.findById(assignmentId)
      .populate("studentId", "firstName lastName email")
      .populate("counselorId", "firstName lastName email")
      .populate("assessmentDefinitionId", "title code category estimatedDuration description instructions scale metadata");

    if (!assignment) {
      throw new ApiError(404, "Assessment assignment not found.");
    }

    // RBAC Check: Counselor can ONLY review assignments belonging to their own students
    if (requestingUser.role === "counselor") {
      const counselorIdStr = requestingUser._id.toString();
      const assignmentCounselorIdStr = assignment.counselorId ? (assignment.counselorId._id?.toString() || assignment.counselorId.toString()) : null;

      const targetStudentId = assignment.studentId ? (assignment.studentId._id || assignment.studentId) : null;
      const studentUser = targetStudentId ? await User.findById(targetStudentId) : null;
      const userCounselorIdStr = studentUser && studentUser.counselorId ? studentUser.counselorId.toString() : null;

      const profile = targetStudentId ? await StudentProfile.findOne({ userId: targetStudentId }) : null;
      const assignedIdStr = profile && profile.assignedCounselorId ? profile.assignedCounselorId.toString() : null;
      const invitedByIdStr = profile && profile.invitedBy ? profile.invitedBy.toString() : null;

      if (
        assignmentCounselorIdStr !== counselorIdStr &&
        userCounselorIdStr !== counselorIdStr &&
        assignedIdStr !== counselorIdStr &&
        invitedByIdStr !== counselorIdStr
      ) {
        throw new ApiError(403, "Access denied: You can only review assessment details for your own assigned students.");
      }
    }

    const AssessmentSession = require("./assessmentSession.model");
    const AssessmentScore = require("./assessmentScore.model");
    const AssessmentResponse = require("./assessmentResponse.model");
    const AssessmentQuestion = require("./assessmentQuestion.model");

    const session = await AssessmentSession.findOne({ assignmentId: assignment._id });

    let score = null;
    let responseDoc = null;
    let rawResponsesMapped = [];

    if (session) {
      score = await AssessmentScore.findOne({ sessionId: session._id });
      responseDoc = await AssessmentResponse.findOne({ sessionId: session._id });

      if (responseDoc && responseDoc.responses && responseDoc.responses.length > 0) {
        // Fetch questions to build raw response map
        const questions = await AssessmentQuestion.find({
          assessmentId: assignment.assessmentDefinitionId._id,
        }).sort({ questionNumber: 1 });

        const scaleConfig = assignment.assessmentDefinitionId?.scale || {};
        const scaleLabels = scaleConfig.labels || {
          "1": "Disagree Strongly",
          "2": "Disagree a little",
          "3": "Neither agree nor disagree",
          "4": "Agree a little",
          "5": "Agree Strongly",
        };

        const questionMap = new Map();
        for (const q of questions) {
          questionMap.set(q._id.toString(), q);
        }

        rawResponsesMapped = responseDoc.responses.map((resp) => {
          const qObj = questionMap.get(resp.questionId.toString());
          const optionLabel = scaleLabels[String(resp.selectedValue)] || null;

          return {
            questionId: resp.questionId,
            questionNumber: resp.questionNumber || (qObj ? qObj.questionNumber : 0),
            questionText: qObj ? qObj.text : "Question",
            domain: qObj ? qObj.domain : "",
            facet: qObj ? qObj.facet : "",
            reverseScored: qObj ? qObj.reverseScored : false,
            selectedValue: resp.selectedValue,
            selectedLabel: optionLabel,
            responseTimeMs: resp.responseTimeMs,
            answeredAt: resp.answeredAt,
          };
        });
      }
    }

    return {
      assignment,
      session,
      score,
      rawResponses: rawResponsesMapped,
    };
  }

  /**
   * 11. Revoke / Delete Assignment
   */
  async deleteAssignment(assignmentId, requestingUser) {
    if (requestingUser.role !== "counselor" && requestingUser.role !== "admin") {
      throw new ApiError(403, "Only counselors can revoke assessment assignments.");
    }

    const assignment = await AssessmentAssignment.findByIdAndDelete(assignmentId);
    if (!assignment) {
      throw new ApiError(404, "Assessment assignment not found.");
    }

    return { message: "Assessment assignment revoked successfully." };
  }
}

module.exports = new AssessmentAssignmentService();
