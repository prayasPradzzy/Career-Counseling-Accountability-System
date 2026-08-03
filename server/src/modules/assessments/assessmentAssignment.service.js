const { AssessmentAssignment, ASSIGNMENT_STATUS } = require("./assessmentAssignment.model");
const AssessmentDefinition = require("./assessmentDefinition.model");
const User = require("../users/user.model");
const ClientProfile = require("../profiles/clientProfile.model");
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

    // Verify Assessment Definition exists and is active
    const definition = await AssessmentDefinition.findById(assessmentDefinitionId);
    if (!definition || !definition.isActive) {
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
    const profile = await ClientProfile.findOne({ userId: studentId });
    if (profile) {
      profile.status = deriveStudentLifecycleStatus(profile, { assessmentState: "pending" });
      await profile.save();
    }

    return await AssessmentAssignment.findById(assignment._id)
      .populate("studentId", "firstName lastName email")
      .populate("counselorId", "firstName lastName email")
      .populate("assessmentDefinitionId", "title code category estimatedTimeMinutes description");
  }

  /**
   * 2. Get all assessment assignments for a specific student
   */
  async getStudentAssignments(studentId, requestingUser) {
    // RBAC Check: Student can only view their own assignments
    if (requestingUser.role === "student" && requestingUser._id.toString() !== studentId.toString()) {
      throw new ApiError(403, "Access denied. You can only view your own assessment assignments.");
    }

    const assignments = await AssessmentAssignment.find({ studentId })
      .populate("counselorId", "firstName lastName email")
      .populate("assessmentDefinitionId", "title code category estimatedTimeMinutes description")
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
      .populate("assessmentDefinitionId", "title code category estimatedTimeMinutes description")
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
    const profile = await ClientProfile.findOne({ userId: studentUser._id });
    if (profile) {
      profile.status = deriveStudentLifecycleStatus(profile, { assessmentState: "in-progress" });
      await profile.save();
    }

    return await AssessmentAssignment.findById(assignment._id)
      .populate("counselorId", "firstName lastName email")
      .populate("assessmentDefinitionId", "title code category estimatedTimeMinutes description");
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
    const profile = await ClientProfile.findOne({ userId: studentUser._id });
    if (profile) {
      profile.status = deriveStudentLifecycleStatus(profile, { assessmentState: "completed" });
      await profile.save();
    }

    return await AssessmentAssignment.findById(assignment._id)
      .populate("counselorId", "firstName lastName email")
      .populate("assessmentDefinitionId", "title code category estimatedTimeMinutes description");
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
    const profile = await ClientProfile.findOne({ userId: assignment.studentId });
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
   * 8. Revoke / Delete Assignment
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
