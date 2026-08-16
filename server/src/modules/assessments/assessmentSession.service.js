const AssessmentSession = require("./assessmentSession.model");
const { SESSION_STATUS } = require("./assessmentSession.model");
const AssessmentResponse = require("./assessmentResponse.model");
const AssessmentDefinition = require("./assessmentDefinition.model");
const AssessmentSection = require("./assessmentSection.model");
const AssessmentQuestion = require("./assessmentQuestion.model");
const AssessmentScore = require("./assessmentScore.model");
const { AssessmentAssignment, ASSIGNMENT_STATUS } = require("./assessmentAssignment.model");
const StudentProfile = require("../profiles/studentProfile.model");
const scoringEngine = require("./scoring/scoringEngine");
const studentInterpretationsConfig = require("../../config/studentInterpretations.json");
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

    // Check for existing active/non-superseded session for THIS assignment
    let session = await AssessmentSession.findOne({
      assignmentId: assignment._id,
      clientId: assignment.studentId,
      status: { $ne: SESSION_STATUS.SUPERSEDED },
    }).sort({ createdAt: -1 });

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

      // If in progress or not_started (fresh retake), update status to IN_PROGRESS and return session (Resume/Start)
      if (
        session.status === SESSION_STATUS.IN_PROGRESS ||
        session.status === SESSION_STATUS.NOT_STARTED
      ) {
        if (session.status === SESSION_STATUS.NOT_STARTED) {
          session.status = SESSION_STATUS.IN_PROGRESS;
          session.startedAt = session.startedAt || new Date();
        }
        session.lastActiveAt = new Date();
        await session.save();

        // Ensure raw AssessmentResponse document exists for session
        let responseDoc = await AssessmentResponse.findOne({ sessionId: session._id });
        if (!responseDoc) {
          await AssessmentResponse.create({
            sessionId: session._id,
            clientId: assignment.studentId,
            assessmentDefinitionId: assignment.assessmentDefinitionId,
            responses: [],
          });
        }

        // Update assignment status to IN_PROGRESS
        if (assignment.status !== ASSIGNMENT_STATUS.IN_PROGRESS) {
          assignment.status = ASSIGNMENT_STATUS.IN_PROGRESS;
          if (!assignment.startedAt) {
            assignment.startedAt = new Date();
          }
          await assignment.save();
        }

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
      .populate(
        "assessmentDefinitionId",
        "title code category responseType instructions estimatedDuration scale metadata"
      )
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
    const isCheckbox =
      session.assessmentDefinitionId?.responseType === "checkbox" ||
      scaleConfig.type === "boolean";

    const scaleLabels = scaleConfig.labels || {
      "1": "Disagree Strongly",
      "2": "Disagree a little",
      "3": "Neither agree nor disagree",
      "4": "Agree a little",
      "5": "Agree Strongly",
    };

    const sharedOptions = isCheckbox
      ? [
          { id: "opt-true", label: "I would like to do this", value: 1, order: 1 },
          { id: "opt-false", label: "Not selected", value: 0, order: 2 },
        ]
      : Object.entries(scaleLabels).map(([valueStr, label], idx) => ({
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
        questionType: q.questionType || session.assessmentDefinitionId?.responseType || "likert",
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
          const existingItem = responseDoc.responses[existingIndex];
          const valueChanged = existingItem.selectedValue !== item.selectedValue;
          existingItem.selectedValue = item.selectedValue;
          if (item.responseTimeMs) {
            existingItem.responseTimeMs = item.responseTimeMs;
          }
          if (valueChanged || !existingItem.answeredAt) {
            existingItem.answeredAt = new Date();
          }
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

    // Fetch Definition to check responseType strategy
    const definition = await AssessmentDefinition.findById(session.assessmentDefinitionId);
    const isCheckboxAssessment = definition?.responseType === "checkbox";

    const responseDoc = await AssessmentResponse.findOne({ sessionId: session._id });
    const answeredQuestionIds = new Set(
      responseDoc
        ? responseDoc.responses
            .filter((r) => r.selectedValue !== null && r.selectedValue !== undefined && r.selectedValue !== "")
            .map((r) => r.questionId.toString())
        : []
    );

    // Completion validation: Ensure all required questions are answered for Likert assessments
    if (!isCheckboxAssessment) {
      const requiredQuestions = await AssessmentQuestion.find({
        assessmentId: session.assessmentDefinitionId,
        required: true,
      });

      const missingRequired = requiredQuestions.filter((q) => !answeredQuestionIds.has(q._id.toString()));

      if (missingRequired.length > 0) {
        throw new ApiError(
          400,
          `Cannot submit. ${missingRequired.length} required question(s) remain unanswered.`
        );
      }
    }

    // Forced-rank-sort (O*NET Work Importance Locator): the distribution must be
    // genuinely enforced server-side, not just visually suggested in the UI — a
    // direct API call must not be able to submit an unbalanced sort.
    if (definition?.responseType === "forced-rank-sort") {
      const columnCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      for (const r of responseDoc?.responses || []) {
        const v = Number(r.selectedValue);
        if (v >= 1 && v <= 5) columnCounts[v] += 1;
      }
      if (Object.values(columnCounts).some((c) => c !== 4)) {
        throw new ApiError(
          400,
          "Cannot submit. Each importance level must contain exactly 4 cards. Adjust any over- or under-filled level."
        );
      }
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
      answeredCount: isCheckboxAssessment ? totalQuestions : answeredQuestionIds.size,
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
    // (Timed — scoring-feel-slow diagnosis: submission→score latency is logged
    // so a regression in query patterns shows up in the API log.)
    const scoringStartMs = Date.now();
    let scoreDoc = null;
    try {
      scoreDoc = await scoringEngine.calculateAndSaveScore(session._id);
      console.log(
        `[ScoringTiming] submitSession -> AssessmentScore ready for session ${session._id} in ${Date.now() - scoringStartMs}ms (def ${session.assessmentDefinitionId}, status ${session.status})`
      );
    } catch (err) {
      console.error("SCORING ENGINE FAILURE:", err.message, err.stack);
      session.metadata = { ...(session.metadata || {}), scoringError: err.message, scoringFailedAt: new Date() };
      await session.save().catch(() => {});
      throw new ApiError(500, `Assessment submitted, but automatic scoring engine failed: ${err.message}`);
    }

    // Update linked AssessmentAssignment to COMPLETED
    let completedAssignment = null;
    if (session.assignmentId) {
      const assignment = await AssessmentAssignment.findById(session.assignmentId);
      if (assignment) {
        assignment.status = ASSIGNMENT_STATUS.COMPLETED;
        assignment.completedAt = now;
        await assignment.save();
        completedAssignment = assignment;
      }
    }

    // Notify the student's counselor that an assessment was completed
    try {
      const Notification = require("./../notifications/notification.model");
      const User = require("./../users/user.model");
      let counselorId =
        completedAssignment?.counselorId ||
        (await StudentProfile.findOne({ userId: session.clientId }).select("assignedCounselorId"))?.assignedCounselorId;
      if (counselorId) {
        const studentUser = await User.findById(session.clientId).select("firstName lastName");
        const studentName =
          studentUser
            ? `${studentUser.firstName || ""} ${studentUser.lastName || ""}`.trim()
            : "A student";
        const defTitle = definition?.title || "Assessment";
        await Notification.create({
          userId: counselorId,
          title: "Assessment Completed",
          message: `${studentName} completed ${defTitle}. Review the results when ready.`,
          type: "assessment_completed",
          link: completedAssignment ? `/assessments/review/${completedAssignment._id}` : `/assessments`,
        });
      }
    } catch (notifErr) {
      console.error("[Completion Notification Error]", notifErr.message);
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

  /**
   * 7. Get Non-Clinical Student Analysis Results
   * Returns domain interpretation paragraphs without raw numeric scores, bands, or facet data.
   */
  async getStudentResults(assessmentKey, studentUser) {
    const key = (assessmentKey || "ipip-neo-120").toLowerCase().trim();

    // Query AssessmentScore for this student and assessment key
    const score = await AssessmentScore.findOne({
      $or: [{ studentId: studentUser._id }, { clientId: studentUser._id }],
      assessmentKey: { $regex: new RegExp(`^${key}$`, "i") },
    })
      .sort({ version: -1 })
      .populate("assessmentDefinitionId", "title code category");

    if (!score) {
      throw new ApiError(404, "No completed assessment results found for this student.");
    }

    const session = await AssessmentSession.findById(score.sessionId);

    // O*NET Work Importance Locator branch
    if (
      key.includes("wil") ||
      key.includes("work-importance") ||
      key.includes("work_importance") ||
      score.scoringStrategy === "onet_wil"
    ) {
      const wilConfig = require("../../config/onetWilStudentInterpretations.json");
      const topCodes = score.topWorkValues || [];

      const insights = [];
      for (const code of topCodes) {
        const valueInfo = wilConfig.workValues[code];
        if (valueInfo) {
          insights.push({
            code,
            label: valueInfo.label,
            text: valueInfo.text,
          });
        }
      }

      return {
        assessmentName: score.assessmentDefinitionId?.title || "O*NET Work Importance Locator",
        assessmentCategory: "values",
        completedAt: session?.submittedAt || session?.completedAt || score.calculatedAt || score.computedAt,
        topWorkValues: topCodes,
        insights,
      };
    }

    // O*NET Interest Profiler / RIASEC Holland branch
    if (
      key.includes("onet") ||
      key.includes("interest") ||
      score.scoringStrategy === "riasec_holland"
    ) {
      const onetConfig = require("../../config/onetStudentInterpretations.json");
      const hollandCode = score.hollandCode || score.metadata?.hollandCode || "SEC";
      const top3Codes = hollandCode.split("").slice(0, 3);

      const insights = [];
      for (const code of top3Codes) {
        const catInfo = onetConfig.categories[code];
        if (catInfo) {
          insights.push({
            code,
            label: catInfo.label,
            text: catInfo.text,
          });
        }
      }

      return {
        assessmentName: score.assessmentDefinitionId?.title || "O*NET Interest Profiler",
        completedAt: session?.submittedAt || session?.completedAt || score.calculatedAt || score.computedAt,
        hollandCode,
        insights,
      };
    }

    // Default IPIP-NEO-120 Five Factor Personality branch
    const domainScores = score.domainScores || score.dimensionScores || [];

    const domainConfig = studentInterpretationsConfig.domains || {};
    const domainOrder = ["O", "C", "E", "A", "N"];
    const insights = [];

    for (const code of domainOrder) {
      const domScore = domainScores.find((d) => d.domain === code || d.code === code);
      const domInfo = domainConfig[code];
      if (domScore && domInfo) {
        const band = domScore.band || "Moderate";
        const text = domInfo.bands[band] || domInfo.bands["Moderate"];
        insights.push({
          code,
          label: domInfo.label,
          text,
        });
      }
    }

    // Return ONLY non-clinical data structure (strictly no numeric scores, bands, or facets)
    return {
      assessmentName: score.assessmentDefinitionId?.title || "Career Assessment",
      completedAt: session?.submittedAt || session?.completedAt || score.calculatedAt || score.computedAt,
      insights,
    };
  }
}

module.exports = new AssessmentSessionService();
