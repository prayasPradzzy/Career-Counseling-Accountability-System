const catchAsync = require("../../shared/utils/catchAsync");
const ApiError = require("../../shared/utils/ApiError");
const StudentProfile = require("../profiles/studentProfile.model");
const InterviewEngagement = require("./interviewEngagement.model");
const InterviewSession = require("./interviewSession.model");
const { SESSION_TYPE, SESSION_STATUS } = require("./interviewSession.model");
const interviewQuestionService = require("./interviewQuestion.service");
const interviewAudioService = require("./interviewAudio.service");
const audioStorage = require("./audioStorage.service");
const clusterPriorityService = require("./clusterPriorityService");

const DURATION_BY_TYPE = {
  [SESSION_TYPE.PARENT]: 30,
  [SESSION_TYPE.CANDIDATE]: 45,
  [SESSION_TYPE.PROFESSIONAL_SELF]: 45,
};

// Parent sessions are not currently available — the enum value is kept
// so legacy documents stay valid, but creation is blocked.
const CREATABLE_SESSION_TYPES = Object.values(SESSION_TYPE).filter(
  (t) => t !== SESSION_TYPE.PARENT
);

/** Verify the student belongs to this counselor's caseload (admins bypass). */
async function assertStudentOwned(studentId, user) {
  if (user.role === "admin") return;
  const profile = await StudentProfile.findOne({
    userId: studentId,
    assignedCounselorId: user._id,
  });
  if (!profile) {
    throw new ApiError(403, "This student is not in your caseload.");
  }
}

/** Verify the engagement belongs to this counselor (admins bypass). */
async function findOwnedEngagement(engagementId, user) {
  const filter =
    user.role === "admin"
      ? { _id: engagementId }
      : { _id: engagementId, counselorId: user._id };
  const engagement = await InterviewEngagement.findOne(filter);
  if (!engagement) {
    throw new ApiError(404, "Interview engagement not found.");
  }
  return engagement;
}

/** Verify the session's engagement belongs to this counselor (admins bypass). */
async function findOwnedSession(sessionId, user) {
  const session = await InterviewSession.findById(sessionId);
  if (!session) {
    throw new ApiError(404, "Interview session not found.");
  }
  await findOwnedEngagement(session.engagementId, user);
  return session;
}

// ── GET /api/counselor/interviews/overview ────────────────────────────────
// Cross-student aggregate for the Interviews section (Library + Roster).
// Counselor-scoped: only the counselor's own active engagements are counted.
const getInterviewsOverview = catchAsync(async (req, res) => {
  const isAdmin = req.user.role === "admin";

  // Engagements: counselors see their own; admins see all active ones.
  const engagementQuery = isAdmin
    ? { status: "active" }
    : { counselorId: req.user._id, status: "active" };
  const engagements = await InterviewEngagement.find(engagementQuery)
    .populate("studentId", "firstName lastName email")
    .populate("counselorId", "firstName lastName email")
    .sort({ updatedAt: -1 });

  const engagementIds = engagements.map((e) => e._id);
  const sessions = engagementIds.length
    ? await InterviewSession.find({ engagementId: { $in: engagementIds } }).sort({
        createdAt: -1,
      })
    : [];

  const sessionsByEngagement = new Map();
  for (const s of sessions) {
    const key = s.engagementId.toString();
    if (!sessionsByEngagement.has(key)) {
      sessionsByEngagement.set(key, []);
    }
    sessionsByEngagement.get(key).push(s);
  }

  // Library-level aggregates across the whole caseload
  let sessionsAwaitingApproval = 0;
  let sessionsRecorded = 0;
  let sessionsCompleted = 0;
  for (const s of sessions) {
    if (s.status === SESSION_STATUS.QUESTIONS_GENERATED) sessionsAwaitingApproval++;
    if (s.status === SESSION_STATUS.RECORDED) sessionsRecorded++;
    if (s.status === SESSION_STATUS.COMPLETED) sessionsCompleted++;
  }

  const roster = engagements.map((engagement) => {
    const student = engagement.studentId || {};
    const engSessions = sessionsByEngagement.get(engagement._id.toString()) || [];

    const counts = {
      total: engSessions.length,
      notStarted: 0,
      awaitingApproval: 0,
      approved: 0,
      inProgress: 0,
      recorded: 0,
      completed: 0,
    };
    for (const s of engSessions) {
      if (s.status === SESSION_STATUS.NOT_STARTED) counts.notStarted++;
      if (s.status === SESSION_STATUS.QUESTIONS_GENERATED) counts.awaitingApproval++;
      if (s.status === SESSION_STATUS.APPROVED) counts.approved++;
      if (s.status === SESSION_STATUS.IN_PROGRESS) counts.inProgress++;
      if (s.status === SESSION_STATUS.RECORDED) counts.recorded++;
      if (s.status === SESSION_STATUS.COMPLETED) counts.completed++;
    }

    return {
      studentId: student._id || engagement.studentId,
      studentName: `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Unnamed Student",
      studentEmail: student.email || "",
      engagementId: engagement._id,
      engagementStatus: engagement.status,
      updatedAt: engagement.updatedAt,
      sessionCounts: counts,
      latestSession: engSessions[0] || null,
    };
  });

  res.status(200).json({
    status: "success",
    data: {
      stats: {
        engagementsStarted: engagements.length,
        sessionsAwaitingApproval,
        sessionsRecorded,
        sessionsCompleted,
      },
      roster,
    },
  });
});

// ── GET /api/counselor/students/:studentId/interview-engagement ───────────
// Returns the active engagement (or null) plus how many completed
// assessments the student has, so the UI can gate generation.
const getStudentEngagement = catchAsync(async (req, res) => {
  const { studentId } = req.params;
  await assertStudentOwned(studentId, req.user);

  const engagement = await InterviewEngagement.findOne({
    studentId,
    counselorId: req.user._id,
    status: "active",
  });

  // Include this engagement's sessions (newest first) so the UI can
  // restore the in-progress workflow on reload without client storage.
  const sessions = engagement
    ? await InterviewSession.find({ engagementId: engagement._id }).sort({
        createdAt: -1,
      })
    : [];

  const { completedAssessmentCount } =
    await clusterPriorityService.computeClusterPriorities(studentId);
  const audioConsent = await interviewAudioService.getAudioConsentStatus(studentId);

  res.status(200).json({
    status: "success",
    data: { engagement, completedAssessmentCount, sessions, audioConsent },
  });
});

// ── POST /api/counselor/students/:studentId/interview-engagement ──────────
// Creates an engagement if none is active, otherwise returns the existing one.
const startEngagement = catchAsync(async (req, res) => {
  const { studentId } = req.params;
  await assertStudentOwned(studentId, req.user);

  let engagement = await InterviewEngagement.findOne({
    studentId,
    counselorId: req.user._id,
    status: "active",
  });

  if (!engagement) {
    engagement = await InterviewEngagement.create({
      studentId,
      counselorId: req.user._id,
      status: "active",
    });
  }

  const sessions = await InterviewSession.find({ engagementId: engagement._id }).sort({
    createdAt: -1,
  });
  const { completedAssessmentCount } =
    await clusterPriorityService.computeClusterPriorities(studentId);
  const audioConsent = await interviewAudioService.getAudioConsentStatus(studentId);

  res.status(201).json({
    status: "success",
    data: { engagement, completedAssessmentCount, sessions, audioConsent },
    message: engagement ? "Active interview engagement retrieved." : "Interview engagement started.",
  });
});

// ── POST /api/counselor/interview-engagements/:engagementId/sessions ──────
const createSession = catchAsync(async (req, res) => {
  const { engagementId } = req.params;
  const { sessionType } = req.body || {};

  if (sessionType === SESSION_TYPE.PARENT) {
    throw new ApiError(400, "Parent sessions are not currently available.");
  }
  if (!CREATABLE_SESSION_TYPES.includes(sessionType)) {
    throw new ApiError(
      400,
      `sessionType must be one of: ${CREATABLE_SESSION_TYPES.join(", ")}`
    );
  }

  const engagement = await findOwnedEngagement(engagementId, req.user);

  const session = await InterviewSession.create({
    engagementId: engagement._id,
    sessionType,
    targetDuration: DURATION_BY_TYPE[sessionType],
    status: SESSION_STATUS.NOT_STARTED,
  });

  res.status(201).json({
    status: "success",
    data: { session },
    message: "Interview session created.",
  });
});

// ── POST /api/counselor/interview-sessions/:sessionId/generate-questions ──
const generateQuestions = catchAsync(async (req, res) => {
  const session = await findOwnedSession(req.params.sessionId, req.user);
  const engagement = await findOwnedEngagement(session.engagementId, req.user);

  const { questionSet, source } = await interviewQuestionService.generateQuestionSet({
    session,
    studentId: engagement.studentId,
  });

  res.status(201).json({
    status: "success",
    data: { questionSet, source },
    message: "Interview questions generated.",
  });
});

// ── GET /api/counselor/interview-sessions/:sessionId/questions ────────────
const getQuestions = catchAsync(async (req, res) => {
  const session = await findOwnedSession(req.params.sessionId, req.user);
  const questionSet = await interviewQuestionService.getLatestQuestionSet(session._id);

  res.status(200).json({
    status: "success",
    data: { questionSet },
  });
});

// ── PATCH /api/counselor/interview-sessions/:sessionId/questions ──────────
// Counselor edits question text and/or approves the set (locks it in).
const updateQuestions = catchAsync(async (req, res) => {
  const session = await findOwnedSession(req.params.sessionId, req.user);
  const { questionsByCluster, reviewedByCounselor } = req.body || {};

  if (!Array.isArray(questionsByCluster) && reviewedByCounselor !== true) {
    throw new ApiError(
      400,
      "Provide questionsByCluster to edit, or reviewedByCounselor: true to approve."
    );
  }

  const questionSet = await interviewQuestionService.saveQuestionSetEdits({
    session,
    questionsByCluster,
    reviewedByCounselor,
  });

  res.status(200).json({
    status: "success",
    data: { questionSet },
    message: reviewedByCounselor ? "Question set approved." : "Question set updated.",
  });
});

// ── POST /api/counselor/interview-sessions/:sessionId/start ───────────────
// Starts conducting an approved session: status → in_progress, records
// conductedAt so the frontend can show an elapsed-time indicator.
const startSession = catchAsync(async (req, res) => {
  const session = await findOwnedSession(req.params.sessionId, req.user);

  if (session.status === SESSION_STATUS.IN_PROGRESS) {
    // Idempotent: already started (e.g. double-click or reload) — return as-is.
    return res.status(200).json({
      status: "success",
      data: { session },
      message: "Session is already in progress.",
    });
  }

  if (session.status !== SESSION_STATUS.APPROVED) {
    throw new ApiError(
      400,
      `Session must be approved before it can be started (current status: ${session.status}).`
    );
  }

  session.status = SESSION_STATUS.IN_PROGRESS;
  session.conductedAt = new Date();
  await session.save();

  res.status(200).json({
    status: "success",
    data: { session },
    message: "Session started. Recording can begin when ready.",
  });
});

// ── POST /api/counselor/interview-sessions/:sessionId/audio ───────────────
// Multipart upload. Consent is enforced in the route middleware BEFORE
// multer parses the body, so a missing-consent request never even
// accepts the file. (req.session was set by that middleware.)
const uploadAudio = catchAsync(async (req, res) => {
  const session = req.session;

  if (!req.file || !req.file.buffer || req.file.buffer.length === 0) {
    throw new ApiError(400, "No audio file received. Send the recording as multipart field 'audio'.");
  }

  // Only allow uploads for a session that is being (or has been) conducted
  if (![SESSION_STATUS.IN_PROGRESS, SESSION_STATUS.RECORDED].includes(session.status)) {
    throw new ApiError(
      400,
      `Cannot upload audio for a session in status '${session.status}'. Start the session first.`
    );
  }

  const { asset, session: updatedSession } = await interviewAudioService.uploadSessionAudio({
    session,
    buffer: req.file.buffer,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    uploadedBy: req.user._id,
  });

  // Notify the engagement's counselor that a session recording is complete
  // (recorded = ready to be finished out / reviewed).
  try {
    const Notification = require("../notifications/notification.model");
    const engagement = await InterviewEngagement.findById(session.engagementId);
    if (engagement && engagement.counselorId) {
      const User = require("../users/user.model");
      const studentUser = await User.findById(engagement.studentId).select("firstName lastName");
      const studentName = studentUser
        ? `${studentUser.firstName || ""} ${studentUser.lastName || ""}`.trim()
        : "The student";
      await Notification.create({
        userId: engagement.counselorId,
        title: "Interview Recording Complete",
        message: `${studentName}'s ${session.sessionType} session recording is ready. Complete the session when reviewed.`,
        type: "interview_recorded",
        link: `/students/${engagement.studentId}`,
      });
    }
  } catch (notifErr) {
    console.error("[Interview Recording Notification Error]", notifErr.message);
  }

  res.status(201).json({
    status: "success",
    data: { asset, session: updatedSession },
    message: "Recording uploaded successfully.",
  });
});

// ── GET /api/counselor/interview-sessions/:sessionId/audio ────────────────
// Returns a signed, time-limited playback URL — never a permanent URL.
const getSessionAudio = catchAsync(async (req, res) => {
  const session = await findOwnedSession(req.params.sessionId, req.user);
  const result = await interviewAudioService.getSessionAudio(session);

  res.status(200).json({
    status: "success",
    data: result,
  });
});

// ── GET /api/counselor/interview-sessions/:sessionId/audio/stream ─────────
// PUBLIC by design: the HTML5 <audio> element cannot attach the auth
// cookie cross-origin, so the signed token in the URL is the access
// control. The signature is bound to the session id + expiry and cannot
// be forged without the server secret.
const streamAudio = catchAsync(async (req, res) => {
  const { sessionId } = req.params;
  const { expires, sig } = req.query;

  if (!interviewAudioService.verifyPlaybackSignature({ sessionId, expires, sig })) {
    throw new ApiError(403, "Invalid or expired playback link.");
  }

  const session = await InterviewSession.findById(sessionId);
  if (!session || !session.audioAssetId) {
    throw new ApiError(404, "Recording not found.");
  }

  const AudioAsset = require("./audioAsset.model");
  const asset = await AudioAsset.findById(session.audioAssetId);
  if (!asset) {
    throw new ApiError(404, "Recording asset not found.");
  }

  const fileInfo = await audioStorage.getFileInfo(asset.storageKey);
  if (!fileInfo) {
    throw new ApiError(404, "Stored audio file not found.");
  }

  const length = fileInfo.length;
  const contentType = fileInfo.contentType || "audio/mpeg";
  res.set({
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
    // helmet() defaults this to same-origin, which would make Chrome block
    // cross-origin playback (API on Render, client on Vercel). The signed,
    // expiring token is the access control, so allowing cross-origin here
    // does not weaken security.
    "Cross-Origin-Resource-Policy": "cross-origin",
  });

  // Range support so <audio> seeking works (Chrome sends Range: bytes=0-)
  const range = req.headers.range;
  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    if (match) {
      const start = match[1] !== "" ? parseInt(match[1], 10) : 0;
      const end = match[2] !== "" ? parseInt(match[2], 10) : length - 1;
      if (Number.isFinite(start) && Number.isFinite(end) && start <= end && start < length) {
        const clampedEnd = Math.min(end, length - 1);
        res.status(206);
        res.set({
          "Content-Range": `bytes ${start}-${clampedEnd}/${length}`,
          "Content-Length": clampedEnd - start + 1,
        });
        const stream = audioStorage.openReadStream(asset.storageKey, {
          start,
          // GridFS `end` is EXCLUSIVE — +1 so the range is byte-accurate
          end: clampedEnd + 1,
        });
        stream.once("error", () => res.destroy());
        stream.pipe(res);
        return;
      }
    }
    // Unparseable/unsatisfiable range → serve full file (200)
  }

  res.set("Content-Length", length);
  const stream = audioStorage.openReadStream(asset.storageKey);
  stream.once("error", () => res.destroy());
  stream.pipe(res);
});

// ── POST /api/counselor/interview-sessions/:sessionId/complete ────────────
// Completes a recorded session: status → completed.
const completeSession = catchAsync(async (req, res) => {
  const session = await findOwnedSession(req.params.sessionId, req.user);

  if (session.status === SESSION_STATUS.COMPLETED) {
    return res.status(200).json({
      status: "success",
      data: { session },
      message: "Session already completed.",
    });
  }

  if (session.status !== SESSION_STATUS.RECORDED) {
    throw new ApiError(
      400,
      `Session must have a recording before it can be completed (current status: ${session.status}).`
    );
  }

  session.status = SESSION_STATUS.COMPLETED;
  await session.save();

  res.status(200).json({
    status: "success",
    data: { session },
    message: "Session completed.",
  });
});

module.exports = {
  getInterviewsOverview,
  getStudentEngagement,
  startEngagement,
  createSession,
  generateQuestions,
  getQuestions,
  updateQuestions,
  startSession,
  uploadAudio,
  getSessionAudio,
  streamAudio,
  completeSession,
  findOwnedSession,
};
