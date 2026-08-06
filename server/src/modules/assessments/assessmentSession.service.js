const AssessmentSession = require("./assessmentSession.model");
const { SESSION_STATUS } = require("./assessmentSession.model");
const AssessmentResponse = require("./assessmentResponse.model");
const AssessmentDefinition = require("./assessmentDefinition.model");
const AssessmentSection = require("./assessmentSection.model");
const AssessmentQuestion = require("./assessmentQuestion.model");
const { AssessmentAssignment, ASSIGNMENT_STATUS } = require("./assessmentAssignment.model");
const StudentProfile = require("../profiles/studentProfile.model");
const scoringEngine = require("./scoring/scoringEngine");
const ApiError = require("../../shared/utils/ApiError");
const { deriveStudentLifecycleStatus } = require("../../shared/constants/studentStatus.constants");

class AssessmentSessionService {
  /**
   * 1. Start or Resume an Assessment Session
   * Enforces Guard Rule: Students can ONLY start sessions via an active AssessmentAssignment.
   * Prevents multiple active sessions across tests & prevents duplicate sessions.
   */
  async startOrResumeSession(assignmentId, requestingUser) {
    // Verify assignment exists
    const assignment = await AssessmentAssignment.findById(assignmentId);
    if (!assignment) {
      throw new ApiError(404, "Assessment assignment not found.");
    }

    // RBAC & Ownership: Only the assigned student (or counselor/admin for viewing)
    if (requestingUser.role === "student" && assignment.studentId.toString() !== requestingUser._id.toString()) {
      throw new ApiError(403, "Access denied. This assessment assignment belongs to another student.");
    }

    // Check assignment status
    if (
      assignment.status !== ASSIGNMENT_STATUS.ASSIGNED &&
      assignment.status !== ASSIGNMENT_STATUS.SCHEDULED &&
      assignment.status !== ASSIGNMENT_STATUS.IN_PROGRESS &&
      assignment.status !== ASSIGNMENT_STATUS.REJECTED
    ) {
      throw new ApiError(400, `Cannot start session for assignment with status '${assignment.status}'.`);
    }

    // Future scheduled check
    if (assignment.status === ASSIGNMENT_STATUS.SCHEDULED && assignment.scheduledFor > new Date()) {
      throw new ApiError(403, `Assessment is scheduled for ${assignment.scheduledFor.toISOString()} and is locked until then.`);
    }

    // Prerequisite lock check
    if (assignment.prerequisiteAssignmentId) {
      const prereq = await AssessmentAssignment.findById(assignment.prerequisiteAssignmentId);
      if (!prereq || prereq.status !== ASSIGNMENT_STATUS.APPROVED) {
        throw new ApiError(403, "Prerequisite assessment must be completed and approved before starting this test.");
      }
    }

    // Check for existing session for THIS assignment
    let session = await AssessmentSession.findOne({
      assignmentId: assignment._id,
      clientId: assignment.studentId,
    });

    if (session) {
      // If already completed or submitted, locked!
      if (
        session.status === SESSION_STATUS.COMPLETED ||
        session.status === SESSION_STATUS.SUBMITTED ||
        session.status === SESSION_STATUS.REVIEWED ||
        session.status === SESSION_STATUS.APPROVED
      ) {
        throw new ApiError(400, `Assessment session for this assignment has already been ${session.status}.`);
      }

      // If in progress, update lastActiveAt and return existing session (Resume)
      if (session.status === SESSION_STATUS.IN_PROGRESS) {
        session.lastActiveAt = new Date();
        await session.save();
        return await this.getSessionState(session._id, requestingUser);
      }
    }

    // Check if student has ANY OTHER active session in progress (prevent multiple active sessions)
    const otherActiveSession = await AssessmentSession.findOne({
      clientId: assignment.studentId,
      status: SESSION_STATUS.IN_PROGRESS,
      assignmentId: { $ne: assignment._id },
    });

    if (otherActiveSession) {
      throw new ApiError(
        409,
        "You already have another assessment session in progress. Please complete or submit it before starting a new test."
      );
    }

    // Total questions count for definition
    const totalQuestions = await AssessmentQuestion.countDocuments({
      assessmentId: assignment.assessmentDefinitionId,
    });

    // Create new AssessmentSession
    session = await AssessmentSession.create({
      clientId: assignment.studentId,
      assessmentDefinitionId: assignment.assessmentDefinitionId,
      assignmentId: assignment._id,
      status: SESSION_STATUS.IN_PROGRESS,
      startedAt: new Date(),
      lastActiveAt: new Date(),
      currentQuestionIndex: 0,
      timeSpentSeconds: 0,
      progress: {
        answeredCount: 0,
        totalQuestions,
        percentage: 0,
      },
    });

    // Ensure raw AssessmentResponse document exists for session
    await AssessmentResponse.create({
      sessionId: session._id,
      clientId: assignment.studentId,
      assessmentDefinitionId: assignment.assessmentDefinitionId,
      responses: [],
    });

    // Update assignment status to IN_PROGRESS
    if (assignment.status !== ASSIGNMENT_STATUS.IN_PROGRESS) {
      assignment.status = ASSIGNMENT_STATUS.IN_PROGRESS;
      if (!assignment.startedAt) {
        assignment.startedAt = new Date();
      }
      await assignment.save();
    }

    // Update Student Profile Lifecycle Status
    const profile = await StudentProfile.findOne({ userId: assignment.studentId });
    if (profile) {
      profile.status = deriveStudentLifecycleStatus(profile, { assessmentState: "in-progress" });
      await profile.save();
    }

    return await this.getSessionState(session._id, requestingUser);
  }

  /**
   * 2. Get Full Session State & Progress (Resume Data)
   */
  async getSessionState(sessionId, requestingUser) {
    const session = await AssessmentSession.findById(sessionId)
      .populate("assessmentDefinitionId", "title code category instructions estimatedDuration scale metadata")
      .populate("assignmentId", "status dueDate counselorNotes");

    if (!session) {
      throw new ApiError(404, "Assessment session not found.");
    }

    // Ownership check
    if (requestingUser.role === "student" && session.clientId.toString() !== requestingUser._id.toString()) {
      throw new ApiError(403, "Access denied. This assessment session belongs to another user.");
    }

    const responseDoc = await AssessmentResponse.findOne({ sessionId: session._id });

    // Map saved responses into key-value map by questionId
    const savedResponsesMap = {};
    if (responseDoc && responseDoc.responses) {
      for (const resp of responseDoc.responses) {
        savedResponsesMap[resp.questionId.toString()] = {
          questionId: resp.questionId,
          questionNumber: resp.questionNumber,
          selectedValue: resp.selectedValue,
          responseTimeMs: resp.responseTimeMs,
          answeredAt: resp.answeredAt,
        };
      }
    }

    return {
      session,
      savedResponses: savedResponsesMap,
      answeredCount: responseDoc ? responseDoc.responses.length : 0,
    };
  }

  /**
   * 3. Fetch Questions, Sections & Options for an Active Session
   * Serves fully data-driven sections, questions, and option choices.
   */
  async getQuestions(sessionId, requestingUser) {
    const sessionState = await this.getSessionState(sessionId, requestingUser);
    const { session, savedResponses } = sessionState;

    const assessmentId = session.assessmentDefinitionId._id || session.assessmentDefinitionId;

    // Fetch Sections ordered
    const sections = await AssessmentSection.find({ assessmentId }).sort({ order: 1 });

    // Fetch Questions ordered
    const questions = await AssessmentQuestion.find({ assessmentId }).sort({ questionNumber: 1 });

    // Shared Scale Options derived directly from AssessmentDefinition.scale
    const scaleConfig = session.assessmentDefinitionId?.scale || {};
    const scaleLabels = scaleConfig.labels || {
      "1": "Disagree Strongly",
      "2": "Disagree a little",
      "3": "Neither agree nor disagree",
      "4": "Agree a little",
      "5": "Agree Strongly",
    };

    const sharedOptions = Object.entries(scaleLabels).map(([valueStr, label], idx) => ({
      id: `opt-${valueStr}`,
      label,
      value: Number(valueStr),
      order: idx + 1,
    }));

    // Attach options and saved answer state to questions
    const structuredQuestions = questions.map((q) => {
      const qIdStr = q._id.toString();
      const saved = savedResponses[qIdStr] || null;

      return {
        id: q._id,
        sectionId: q.sectionId,
        questionNumber: q.questionNumber,
        text: q.text,
        domain: q.domain,
        facet: q.facet,
        questionType: q.questionType,
        required: q.required,
        options: sharedOptions,
        savedResponse: saved ? saved.selectedValue : null,
      };
    });

    return {
      session,
      sections: sections.map((s) => ({
        id: s._id,
        title: s.title,
        description: s.description,
        order: s.order,
        questionStart: s.questionStart,
        questionEnd: s.questionEnd,
      })),
      questions: structuredQuestions,
    };
  }

  /**
   * 4. Autosave Progress & Responses
   * Lock rule: If session status is completed, submitted, reviewed, or approved, rejects modification.
   */
  async autosaveProgress(sessionId, payload, requestingUser) {
    const { responses, currentQuestionIndex, timeSpentSeconds } = payload;

    const session = await AssessmentSession.findById(sessionId);
    if (!session) {
      throw new ApiError(404, "Assessment session not found.");
    }

    // Ownership check
    if (requestingUser.role === "student" && session.clientId.toString() !== requestingUser._id.toString()) {
      throw new ApiError(403, "Access denied.");
    }

    // LOCK CHECK: Prevent modification if session is not in_progress
    if (session.status !== SESSION_STATUS.IN_PROGRESS) {
      throw new ApiError(400, `Session is locked (${session.status}). Responses cannot be modified.`);
    }

    // Find or create response document
    let responseDoc = await AssessmentResponse.findOne({ sessionId: session._id });
    if (!responseDoc) {
      responseDoc = new AssessmentResponse({
        sessionId: session._id,
        clientId: session.clientId,
        assessmentDefinitionId: session.assessmentDefinitionId,
        responses: [],
      });
    }

    // Upsert items into responses array
    if (Array.isArray(responses) && responses.length > 0) {
      for (const item of responses) {
        if (!item.questionId || item.selectedValue === undefined) {
          continue;
        }

        const existingIndex = responseDoc.responses.findIndex(
          (r) => r.questionId.toString() === item.questionId.toString()
        );

        if (existingIndex >= 0) {
          responseDoc.responses[existingIndex].selectedValue = item.selectedValue;
          if (item.responseTimeMs) {
            responseDoc.responses[existingIndex].responseTimeMs = item.responseTimeMs;
          }
          responseDoc.responses[existingIndex].answeredAt = new Date();
        } else {
          responseDoc.responses.push({
            questionId: item.questionId,
            questionNumber: item.questionNumber || 0,
            selectedValue: item.selectedValue,
            responseTimeMs: item.responseTimeMs || 0,
            answeredAt: new Date(),
          });
        }
      }
      await responseDoc.save();
    }

    // Calculate progress snapshot
    const totalQuestions = await AssessmentQuestion.countDocuments({
      assessmentId: session.assessmentDefinitionId,
    });

    const answeredCount = responseDoc.responses.filter(
      (r) => r.selectedValue !== null && r.selectedValue !== undefined && r.selectedValue !== ""
    ).length;

    const percentage = totalQuestions > 0 ? Math.min(100, Math.round((answeredCount / totalQuestions) * 100)) : 0;

    session.progress = {
      answeredCount,
      totalQuestions,
      percentage,
    };

    session.lastActiveAt = new Date();

    if (typeof currentQuestionIndex === "number" && currentQuestionIndex >= 0) {
      session.currentQuestionIndex = currentQuestionIndex;
    }

    if (typeof timeSpentSeconds === "number" && timeSpentSeconds >= session.timeSpentSeconds) {
      session.timeSpentSeconds = timeSpentSeconds;
    }

    await session.save();

    return {
      sessionId: session._id,
      status: session.status,
      progress: session.progress,
      currentQuestionIndex: session.currentQuestionIndex,
      timeSpentSeconds: session.timeSpentSeconds,
      lastActiveAt: session.lastActiveAt,
    };
  }

  /**
   * 5. Submit Session & Lock
   * Validates completion of required questions, transitions status to SUBMITTED,
   * locks session from future edits, and completes the assignment.
   */
  async submitSession(sessionId, requestingUser) {
    const session = await AssessmentSession.findById(sessionId);
    if (!session) {
      throw new ApiError(404, "Assessment session not found.");
    }

    // Ownership check
    if (requestingUser.role === "student" && session.clientId.toString() !== requestingUser._id.toString()) {
      throw new ApiError(403, "Access denied.");
    }

    // Check status
    if (
      session.status === SESSION_STATUS.SUBMITTED ||
      session.status === SESSION_STATUS.COMPLETED ||
      session.status === SESSION_STATUS.REVIEWED ||
      session.status === SESSION_STATUS.APPROVED
    ) {
      throw new ApiError(400, "Assessment session has already been submitted.");
    }

    if (session.status !== SESSION_STATUS.IN_PROGRESS) {
      throw new ApiError(400, `Cannot submit session with status '${session.status}'.`);
    }

    // Completion validation: Ensure all required questions are answered
    const requiredQuestions = await AssessmentQuestion.find({
      assessmentId: session.assessmentDefinitionId,
      required: true,
    });

    const responseDoc = await AssessmentResponse.findOne({ sessionId: session._id });
    const answeredQuestionIds = new Set(
      responseDoc
        ? responseDoc.responses
            .filter((r) => r.selectedValue !== null && r.selectedValue !== undefined && r.selectedValue !== "")
            .map((r) => r.questionId.toString())
        : []
    );

    const missingRequired = requiredQuestions.filter((q) => !answeredQuestionIds.has(q._id.toString()));

    if (missingRequired.length > 0) {
      throw new ApiError(
        400,
        `Cannot submit. ${missingRequired.length} required question(s) remain unanswered.`
      );
    }

    // Transition & Lock Session
    const now = new Date();
    session.status = SESSION_STATUS.SUBMITTED;
    session.completedAt = session.completedAt || now;
    session.submittedAt = now;
    session.lastActiveAt = now;

    // Recalculate final progress
    const totalQuestions = await AssessmentQuestion.countDocuments({
      assessmentId: session.assessmentDefinitionId,
    });
    session.progress = {
      answeredCount: answeredQuestionIds.size,
      totalQuestions,
      percentage: 100,
    };

    // Quick-completion guard: flag submissions that finish a long assessment
    // (≥ 60 questions) in under 5 minutes — a signal worth counselor attention.
    const QUICK_COMPLETION_THRESHOLD_SECONDS = 300; // 5 minutes
    const QUICK_COMPLETION_MIN_QUESTIONS = 60;
    if (
      totalQuestions >= QUICK_COMPLETION_MIN_QUESTIONS &&
      session.timeSpentSeconds < QUICK_COMPLETION_THRESHOLD_SECONDS
    ) {
      session.flagged = true;
      session.flagReason = "quick_completion";
    }

    await session.save();

    // Trigger Strategy-Based Scoring Engine
    const scoreDoc = await scoringEngine.calculateAndSaveScore(session._id);

    // Update linked AssessmentAssignment to COMPLETED
    if (session.assignmentId) {
      const assignment = await AssessmentAssignment.findById(session.assignmentId);
      if (assignment) {
        assignment.status = ASSIGNMENT_STATUS.COMPLETED;
        assignment.completedAt = now;
        await assignment.save();
      }
    }

    // Update Student Profile Lifecycle Status
    const profile = await StudentProfile.findOne({ userId: session.clientId });
    if (profile) {
      profile.status = deriveStudentLifecycleStatus(profile, { assessmentState: "completed" });
      await profile.save();
    }

    return {
      message: "Assessment session submitted and locked successfully.",
      sessionId: session._id,
      status: session.status,
      submittedAt: session.submittedAt,
      progress: session.progress,
    };
  }

  /**
   * 6. Get Current Active Session for Student
   */
  async getActiveSession(studentUser) {
    const session = await AssessmentSession.findOne({
      clientId: studentUser._id,
      status: SESSION_STATUS.IN_PROGRESS,
    })
      .populate("assessmentDefinitionId", "title code category estimatedDuration description")
      .populate("assignmentId", "dueDate status counselorNotes");

    if (!session) {
      return null;
    }

    return await this.getSessionState(session._id, studentUser);
  }
}

module.exports = new AssessmentSessionService();
