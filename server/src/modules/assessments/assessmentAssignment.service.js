const mongoose = require("mongoose");
const { AssessmentAssignment, ASSIGNMENT_STATUS } = require("./assessmentAssignment.model");
const AssessmentDefinition = require("./assessmentDefinition.model");
const User = require("../users/user.model");
const StudentProfile = require("../profiles/studentProfile.model");
const ApiError = require("../../shared/utils/ApiError");
const { isSameId, canCounselorAccessStudent } = require("../../shared/utils/ownership.utils");
const { deriveStudentLifecycleStatus, STUDENT_STATUS } = require("../../shared/constants/studentStatus.constants");

class AssessmentAssignmentService {
  /**
   * 0. Shared ownership boundary: counselor can only assign to own students.
   */
  async assertCanAssign(studentId, requestingUser) {
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

    return studentUser;
  }

  /**
   * 0b. Create one assignment + notify the student.
   */
  async createAssignment({ studentId, assessmentDefinitionId, requestingUser, dueDate, scheduledFor, counselorNotes }) {
    const definition = await AssessmentDefinition.findById(assessmentDefinitionId);
    if (!definition || definition.status !== "active") {
      throw new ApiError(404, "Assessment definition not found or inactive.");
    }

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
      assignedAt: now,
    });

    // Update Student Profile Lifecycle Status to ASSESSMENT_PENDING
    const profile = await StudentProfile.findOne({ userId: studentId });
    if (profile) {
      profile.status = deriveStudentLifecycleStatus(profile, { assessmentState: "pending" });
      await profile.save();
    }

    // Notify the student that a new assessment is waiting
    try {
      const Notification = require("../notifications/notification.model");
      await Notification.create({
        userId: studentId,
        title: "New Assessment Assigned",
        message: `Your counselor assigned you: ${definition.title}.`,
        type: "assessment_assigned",
        link: `/assessments`,
      });
    } catch (notifErr) {
      console.error("[Assignment Notification Error]", notifErr.message);
    }

    return await AssessmentAssignment.findById(assignment._id)
      .populate("studentId", "firstName lastName email")
      .populate("counselorId", "firstName lastName email")
      .populate("assessmentDefinitionId", "title code category estimatedDuration description");
  }

  /**
   * 1. Counselor assigns an assessment to a student
   */
  async assignAssessment(data, requestingUser) {
    const { studentId, assessmentDefinitionId, dueDate, scheduledFor, counselorNotes, unlocksNextAssessmentId } = data;

    await this.assertCanAssign(studentId, requestingUser);

    const assignment = await this.createAssignment({
      studentId,
      assessmentDefinitionId,
      requestingUser,
      dueDate,
      scheduledFor,
      counselorNotes,
    });

    if (unlocksNextAssessmentId) {
      assignment.unlocksNextAssessmentId = unlocksNextAssessmentId;
      await assignment.save();
    }

    return assignment;
  }

  /**
   * 1b. Assign EVERY active assessment definition in one call (full battery).
   * Skips definitions that already have a live assignment (so it is safe to
   * run repeatedly), creates one Assignment per remaining definition, and
   * returns what was created vs. skipped.
   */
  async assignAllAssessments(data, requestingUser) {
    const { studentId } = data;
    if (!studentId) {
      throw new ApiError(400, "studentId is required.");
    }

    await this.assertCanAssign(studentId, requestingUser);

    const activeDefinitions = await AssessmentDefinition.find({ status: "active" }).sort({
      category: 1,
      code: 1,
    });
    if (activeDefinitions.length === 0) {
      throw new ApiError(404, "No active assessment definitions found in the catalog.");
    }

    // Live assignments this student already has (skip those definitions)
    const existing = await AssessmentAssignment.find({
      studentId,
      status: { $ne: ASSIGNMENT_STATUS.REJECTED },
    }).select("assessmentDefinitionId");
    const alreadyAssigned = new Set(
      existing.map((a) => a.assessmentDefinitionId.toString())
    );

    const created = [];
    const skipped = [];
    for (const def of activeDefinitions) {
      if (alreadyAssigned.has(def._id.toString())) {
        skipped.push({ definitionId: def._id, title: def.title });
        continue;
      }
      const assignment = await this.createAssignment({
        studentId,
        assessmentDefinitionId: def._id,
        requestingUser,
      });
      created.push(assignment);
    }

    return {
      createdCount: created.length,
      skippedCount: skipped.length,
      skipped,
      created,
    };
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

    const query = {
      studentId: { $exists: true, $ne: null },
    };

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
        new Set([...profileUserIds, ...userIds].filter(Boolean).map((id) => id.toString()))
      ).map((idStr) => new mongoose.Types.ObjectId(idStr));

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

    const rawAssignments = await AssessmentAssignment.find(query)
      .populate("studentId", "firstName lastName email")
      .populate("counselorId", "firstName lastName email")
      .populate("assessmentDefinitionId", "title code category estimatedDuration description")
      .sort({ assignedAt: -1, createdAt: -1 });

    const getDocId = (val) => {
      if (!val) return "";
      if (typeof val === "string") return val;
      if (val._id) return val._id.toString();
      if (val.id) return val.id.toString();
      return "";
    };

    // Deduplicate: Keep only the latest assignment per unique (studentId, assessmentDefinitionId)
    const latestAssignmentsMap = new Map();
    for (const a of rawAssignments) {
      const sId = getDocId(a.studentId);
      const defId = getDocId(a.assessmentDefinitionId);

      if (!sId || !defId) continue;
      const compositeKey = `${sId}:${defId}`;

      if (!latestAssignmentsMap.has(compositeKey)) {
        latestAssignmentsMap.set(compositeKey, a);
      }
    }

    const assignments = Array.from(latestAssignmentsMap.values());

    // Attach active/completed non-superseded session progress summary to each unique assignment
    const assignmentIds = assignments.map((a) => a._id);
    const AssessmentSession = require("./assessmentSession.model");
    const { SESSION_STATUS } = require("./assessmentSession.model");
    const AssessmentScore = require("./assessmentScore.model");

    // Fetch non-superseded sessions for these assignments
    const sessions = await AssessmentSession.find({
      assignmentId: { $in: assignmentIds },
      status: { $ne: SESSION_STATUS.SUPERSEDED },
    }).sort({ createdAt: -1 });

    const sessionIds = sessions.map((s) => s._id);
    const scores = await AssessmentScore.find({ sessionId: { $in: sessionIds }, isCurrent: true });

    const sessionMap = new Map();
    for (const s of sessions) {
      const key = s.assignmentId.toString();
      if (!sessionMap.has(key)) {
        sessionMap.set(key, s);
      }
    }

    const scoreSet = new Set(scores.map((sc) => sc.sessionId.toString()));

    let result = assignments.map((a) => {
      const aObj = a.toObject();
      const s = sessionMap.get(a._id.toString());
      const hasScore = s ? scoreSet.has(s._id.toString()) : false;

      // Determine live effective status from current non-superseded session
      let effectiveStatus = a.status;
      if (s) {
        if (s.status === SESSION_STATUS.NOT_STARTED) {
          effectiveStatus = ASSIGNMENT_STATUS.ASSIGNED;
        } else if (s.status === SESSION_STATUS.IN_PROGRESS) {
          effectiveStatus = ASSIGNMENT_STATUS.IN_PROGRESS;
        } else if (
          s.status === SESSION_STATUS.COMPLETED ||
          s.status === SESSION_STATUS.SUBMITTED ||
          s.status === SESSION_STATUS.REVIEWED ||
          s.status === SESSION_STATUS.APPROVED
        ) {
          effectiveStatus = ASSIGNMENT_STATUS.COMPLETED;
        }
      }

      aObj.status = effectiveStatus;
      aObj.effectiveStatus = effectiveStatus;
      aObj.hasScore = hasScore;
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
            hasScore,
          }
        : null;
      return aObj;
    });

    // Apply statusGroup filtering on effectiveStatus if specified
    if (filters.statusGroup) {
      switch (filters.statusGroup.toLowerCase()) {
        case "pending":
        case "not_started":
          result = result.filter(
            (a) => a.status === ASSIGNMENT_STATUS.ASSIGNED || a.status === ASSIGNMENT_STATUS.SCHEDULED
          );
          break;
        case "in_progress":
          result = result.filter((a) => a.status === ASSIGNMENT_STATUS.IN_PROGRESS);
          break;
        case "submitted":
        case "completed":
          result = result.filter(
            (a) =>
              a.status === ASSIGNMENT_STATUS.COMPLETED ||
              a.status === ASSIGNMENT_STATUS.UNDER_REVIEW ||
              a.status === ASSIGNMENT_STATUS.APPROVED
          );
          break;
        case "rejected":
        case "retake":
          result = result.filter((a) => a.status === ASSIGNMENT_STATUS.REJECTED);
          break;
        default:
          break;
      }
    }

    return result;
  }

  /**
   * 9. Counselor requests retake / rejects assignment
   * Generic across all assessments (IPIP-NEO-120, O*NET Interest Profiler, O*NET WIL, etc.)
   * Uses Mongoose query filter for counselor-student ownership check.
   */
  async requestRetake(data, requestingUser) {
    const { sessionId, assignmentId, reason, counselorNotes } = data || {};

    if (requestingUser.role !== "counselor" && requestingUser.role !== "admin") {
      throw new ApiError(403, "Only counselors and administrators can request assessment retakes.");
    }

    const reasonStr = String(reason || counselorNotes || "").trim();
    if (!reasonStr) {
      throw new ApiError(400, "Please provide a reason explaining why a retake is required.");
    }

    // Mongoose query filter for counselor-student ownership check
    let studentIds = [];
    if (requestingUser.role === "counselor") {
      const counselorId = requestingUser._id;
      const [profiles, users] = await Promise.all([
        StudentProfile.find({
          $or: [{ assignedCounselorId: counselorId }, { invitedBy: counselorId }],
        }).select("userId"),
        User.find({ counselorId, role: "student" }).select("_id"),
      ]);

      const profileUserIds = profiles.map((p) => p.userId).filter(Boolean);
      const userIds = users.map((u) => u._id).filter(Boolean);

      studentIds = Array.from(
        new Set([...profileUserIds, ...userIds].map((id) => id.toString()))
      ).map((idStr) => new mongoose.Types.ObjectId(idStr));
    }

    const AssessmentSession = require("./assessmentSession.model");
    const { SESSION_STATUS } = require("./assessmentSession.model");
    const AssessmentScore = require("./assessmentScore.model");
    const RetakeRequest = require("./retakeRequest.model");
    const Notification = require("../notifications/notification.model");

    let originalSession = null;
    let assignment = null;

    if (sessionId) {
      const sessionQuery = { _id: sessionId };
      if (requestingUser.role === "counselor") {
        sessionQuery.clientId = { $in: studentIds };
      }
      originalSession = await AssessmentSession.findOne(sessionQuery).populate("assessmentDefinitionId");
      if (!originalSession && requestingUser.role === "counselor") {
        const candidateSession = await AssessmentSession.findById(sessionId).populate("assessmentDefinitionId");
        if (candidateSession && candidateSession.assignmentId) {
          const candidateAssignment = await AssessmentAssignment.findById(candidateSession.assignmentId);
          if (candidateAssignment && isSameId(candidateAssignment.counselorId, requestingUser._id)) {
            originalSession = candidateSession;
            assignment = candidateAssignment;
          }
        }
      }
      if (!originalSession) {
        throw new ApiError(404, "Assessment session not found or access denied.");
      }
      if (!assignment && originalSession.assignmentId) {
        assignment = await AssessmentAssignment.findById(originalSession.assignmentId);
      }
    } else if (assignmentId) {
      const assignmentQuery = { _id: assignmentId };
      if (requestingUser.role === "counselor") {
        assignmentQuery.$or = [
          { counselorId: requestingUser._id },
          { studentId: { $in: studentIds } },
        ];
      }
      assignment = await AssessmentAssignment.findOne(assignmentQuery).populate("assessmentDefinitionId");
      if (!assignment) {
        throw new ApiError(404, "Assessment assignment not found or access denied.");
      }
      originalSession = await AssessmentSession.findOne({
        assignmentId: assignment._id,
        status: { $ne: SESSION_STATUS.SUPERSEDED },
      }).sort({ createdAt: -1 });
    } else {
      throw new ApiError(400, "Must provide either sessionId or assignmentId.");
    }

    const rawStudentId = originalSession
      ? (originalSession.clientId?._id || originalSession.clientId)
      : (assignment?.studentId?._id || assignment?.studentId);

    if (!rawStudentId) {
      throw new ApiError(400, "Cannot request retake: Student account is missing or no longer exists for this assignment.");
    }
    const studentId = rawStudentId;

    const defId = originalSession
      ? (originalSession.assessmentDefinitionId?._id || originalSession.assessmentDefinitionId)
      : (assignment?.assessmentDefinitionId?._id || assignment?.assessmentDefinitionId);

    const definition = await AssessmentDefinition.findById(defId);
    const assessmentKey =
      definition?.metadata?.assessmentKey ||
      definition?.code?.toLowerCase()?.replace(/_/g, "-") ||
      "assessment";

    // 1. Mark original session as SUPERSEDED (if present)
    if (originalSession) {
      originalSession.status = SESSION_STATUS.SUPERSEDED;
      await originalSession.save();
    }

    // 2. Mark original scores as isCurrent = false
    if (assignment) {
      await AssessmentScore.updateMany(
        { assignmentId: assignment._id },
        { $set: { isCurrent: false } }
      );
    }
    if (originalSession) {
      await AssessmentScore.updateMany(
        { sessionId: originalSession._id },
        { $set: { isCurrent: false } }
      );
    }

    // 3. Create fresh new AssessmentSession with status 'not_started'
    const newSession = await AssessmentSession.create({
      clientId: studentId,
      assessmentDefinitionId: defId,
      assignmentId: assignment ? assignment._id : null,
      status: SESSION_STATUS.NOT_STARTED,
      retakeOf: originalSession ? originalSession._id : null,
      timeSpentSeconds: 0,
      currentQuestionIndex: 0,
      progress: { answeredCount: 0, totalQuestions: 0, percentage: 0 },
    });

    // 4. Link supersededBy on original session
    if (originalSession) {
      originalSession.supersededBy = newSession._id;
      await originalSession.save();
    }

    // 5. Create RetakeRequest audit record
    const retakeRecord = await RetakeRequest.create({
      originalSessionId: originalSession ? originalSession._id : newSession._id,
      newSessionId: newSession._id,
      assignmentId: assignment ? assignment._id : null,
      studentId: studentId,
      assessmentKey: assessmentKey,
      requestedBy: requestingUser._id,
      reason: reasonStr,
      requestedAt: new Date(),
    });

    // 6. Update linked AssessmentAssignment (if present)
    if (assignment) {
      assignment.status = ASSIGNMENT_STATUS.REJECTED;
      assignment.counselorNotes = reasonStr;
      await assignment.save();
    }

    // 7. Update Student Profile Lifecycle Status
    const profile = await StudentProfile.findOne({ userId: studentId });
    if (profile) {
      profile.status = deriveStudentLifecycleStatus(profile, { assessmentState: "pending" });
      await profile.save();
    }

    // 8. Send notification alert to student
    try {
      const defTitle = definition?.title || "Assessment";
      await Notification.create({
        userId: studentId,
        title: "Retake Requested",
        message: `Your counselor requested a retake for ${defTitle}: "${reasonStr}"`,
        type: "assessment_retake",
        link: `/assessments`,
      });
    } catch (notifErr) {
      console.error("[Retake Notification Error]", notifErr.message);
    }

    return await AssessmentAssignment.findById(assignment ? assignment._id : null)
      .populate("studentId", "firstName lastName email")
      .populate("counselorId", "firstName lastName email")
      .populate("assessmentDefinitionId", "title code category") || { newSession, retakeRecord };
  }

  async rejectAssignment(assignmentId, counselorNotes, requestingUser) {
    return await this.requestRetake({ assignmentId, reason: counselorNotes }, requestingUser);
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
      .populate("studentId", "firstName lastName email counselorId")
      .populate("counselorId", "firstName lastName email")
      .populate("assessmentDefinitionId", "title code category estimatedDuration description instructions scale metadata");

    if (!assignment) {
      throw new ApiError(404, "Assessment assignment not found.");
    }

    // RBAC Check: Counselor can ONLY review assignments belonging to their own students
    if (requestingUser.role === "counselor") {
      const targetStudentId = assignment.studentId
        ? assignment.studentId._id || assignment.studentId
        : null;

      // Direct match: assignment.counselorId already points to this counselor
      const assignmentCounselorAuthorized = assignment.counselorId && isSameId(assignment.counselorId, requestingUser._id);

      let isAuthorized = assignmentCounselorAuthorized;

      if (!isAuthorized && targetStudentId) {
        // Fetch User (with counselorId) and StudentProfile for full ownership check
        const [studentUser, studentProfile] = await Promise.all([
          User.findById(targetStudentId).select("counselorId role"),
          StudentProfile.findOne({ userId: targetStudentId }).select("assignedCounselorId invitedBy"),
        ]);
        isAuthorized = canCounselorAccessStudent(requestingUser._id, studentUser, studentProfile);
      }

      if (!isAuthorized) {
        console.error(
          `[ReviewDetail 403] Counselor ${requestingUser._id} denied access to assignment ${assignmentId} (student: ${targetStudentId}).`
        );
        throw new ApiError(403, "Access denied: You can only review assessment details for your own assigned students.");
      }
    }

    const AssessmentSession = require("./assessmentSession.model");
    const AssessmentScore = require("./assessmentScore.model");
    const AssessmentResponse = require("./assessmentResponse.model");
    const AssessmentQuestion = require("./assessmentQuestion.model");

    const RetakeRequest = require("./retakeRequest.model");
    const session =
      (await AssessmentSession.findOne({ assignmentId: assignment._id, status: { $ne: "superseded" } }).sort({ createdAt: -1 })) ||
      (await AssessmentSession.findOne({ assignmentId: assignment._id }).sort({ createdAt: -1 }));

    let score = null;
    let responseDoc = null;
    let rawResponsesMapped = [];

    if (session) {
      score = await AssessmentScore.findOne({ sessionId: session._id }).sort({ version: -1, createdAt: -1 });
      responseDoc = await AssessmentResponse.findOne({ sessionId: session._id });

      if (responseDoc && responseDoc.responses && responseDoc.responses.length > 0) {
        // Resolve assessment definition ID safely even if populate returned null
        const targetAssessmentDefId =
          assignment.assessmentDefinitionId?._id ||
          assignment.assessmentDefinitionId ||
          session.assessmentDefinitionId;

        let questions = targetAssessmentDefId
          ? await AssessmentQuestion.find({ assessmentId: targetAssessmentDefId }).sort({ questionNumber: 1 })
          : [];

        if (!questions || questions.length === 0) {
          questions = await AssessmentQuestion.find({}).sort({ questionNumber: 1 });
        }

        const scaleConfig = assignment.assessmentDefinitionId?.scale || {};
        const scaleLabels = scaleConfig.labels || {
          "1": "Disagree Strongly",
          "2": "Disagree a little",
          "3": "Neither agree nor disagree",
          "4": "Agree a little",
          "5": "Agree Strongly",
        };

        const questionMapById = new Map();
        const questionMapByNum = new Map();
        for (const q of questions) {
          questionMapById.set(q._id.toString(), q);
          questionMapByNum.set(q.questionNumber, q);
        }

        rawResponsesMapped = responseDoc.responses.map((resp) => {
          const qObj =
            questionMapById.get(resp.questionId?.toString()) ||
            questionMapByNum.get(resp.questionNumber);
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
            responseTimeMs: resp.responseTimeMs || 0,
            answeredAt: resp.answeredAt,
          };
        });

        // Bug 3 Fix: Always sort ascending by question number (1 -> 120)
        rawResponsesMapped.sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0));
      }
    }

    // Build historical superseded attempts breakdown
    const supersededSessions = await AssessmentSession.find({
      assignmentId: assignment._id,
      status: "superseded",
    }).sort({ createdAt: -1 });

    const previousAttempts = [];
    for (const supSession of supersededSessions) {
      const supScore = await AssessmentScore.findOne({ sessionId: supSession._id }).sort({ version: -1, createdAt: -1 });
      const retakeReq = await RetakeRequest.findOne({ originalSessionId: supSession._id });
      previousAttempts.push({
        sessionId: supSession._id,
        session: supSession,
        score: supScore,
        reason: retakeReq ? retakeReq.reason : assignment.counselorNotes || "Retake requested",
        requestedAt: retakeReq ? retakeReq.requestedAt : supSession.updatedAt,
      });
    }

    return {
      assignment,
      session,
      score,
      rawResponses: rawResponsesMapped,
      previousAttempts,
    };
  }

  /**
   * 11. Counselor Recomputes Score (Safety Net Action)
   */
  async rescoreAssignment(assignmentId, requestingUser) {
    if (requestingUser.role !== "counselor" && requestingUser.role !== "admin") {
      throw new ApiError(403, "Only counselors and administrators can recompute scores.");
    }

    const assignment = await AssessmentAssignment.findById(assignmentId);
    if (!assignment) {
      throw new ApiError(404, "Assessment assignment not found.");
    }

    const AssessmentSession = require("./assessmentSession.model");
    const session = await AssessmentSession.findOne({ assignmentId: assignment._id });
    if (!session) {
      throw new ApiError(404, "No active or completed assessment session found for this assignment.");
    }

    const scoringEngine = require("./scoring/scoringEngine");
    let scoreDoc = null;
    try {
      scoreDoc = await scoringEngine.calculateAndSaveScore(session._id);
    } catch (err) {
      console.error("SCORING ENGINE FAILURE:", err.message, err.stack);
      throw new ApiError(500, `Failed to recompute assessment score: ${err.message}`);
    }

    return {
      message: "Score recomputed successfully.",
      score: scoreDoc,
    };
  }

  /**
   * 12. Revoke / Delete Assignment
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
