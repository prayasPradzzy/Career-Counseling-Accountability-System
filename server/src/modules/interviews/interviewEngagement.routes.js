const express = require("express");
const multer = require("multer");
const router = express.Router();
const { requireAuth, restrictTo } = require("../../shared/middleware/auth.middleware");
const ApiError = require("../../shared/utils/ApiError");
const controller = require("./interviewEngagement.controller");
const catchAsync = require("../../shared/utils/catchAsync");
const InterviewEngagement = require("./interviewEngagement.model");
const interviewAudioService = require("./interviewAudio.service");

const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB

// ── Everything below is counselor/admin only ─────────────────────────────
// (The public signed playback stream lives in `publicRouter` below — it is
// mounted at its own /interview-audio namespace in app.js so it is never
// shadowed by the counselor router's requireAuth.)
router.use(requireAuth, restrictTo("counselor", "admin"));

// Engagement lifecycle
router.get("/students/:studentId/interview-engagement", controller.getStudentEngagement);
router.post("/students/:studentId/interview-engagement", controller.startEngagement);

// Sessions
router.post("/interview-engagements/:engagementId/sessions", controller.createSession);

// Question sets
router.post("/interview-sessions/:sessionId/generate-questions", controller.generateQuestions);
router.get("/interview-sessions/:sessionId/questions", controller.getQuestions);
router.patch("/interview-sessions/:sessionId/questions", controller.updateQuestions);

// ── Phase 2: conduct + record ─────────────────────────────────────────────

// Start conducting an approved session
router.post("/interview-sessions/:sessionId/start", controller.startSession);

// Multipart upload with multer (memory storage, 200MB cap, format filter).
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    try {
      interviewAudioService.validateAudioFile({
        filename: file.originalname,
        size: undefined,
      });
      cb(null, true);
    } catch (err) {
      cb(err); // ApiError(400) → flows to the error handler
    }
  },
}).single("audio");

/**
 * Consent gate runs BEFORE multer parses the body, so a session with
 * no audio-recording consent on file is rejected without accepting
 * the upload at all. Also resolves the session + engagement once.
 */
const assertSessionAudioConsent = catchAsync(async (req, res, next) => {
  const session = await controller.findOwnedSession(req.params.sessionId, req.user);
  const engagement = await InterviewEngagement.findById(session.engagementId);
  if (!engagement) {
    throw new ApiError(404, "Interview engagement not found.");
  }
  await interviewAudioService.assertAudioConsent(engagement.studentId);
  req.session = session;
  next();
});

router.post(
  "/interview-sessions/:sessionId/audio",
  assertSessionAudioConsent,
  (req, res, next) => {
    audioUpload(req, res, (err) => {
      if (err) {
        // Multer errors → clear 400 messages
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(
            new ApiError(400, `Audio file too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`)
          );
        }
        return next(err);
      }
      next();
    });
  },
  controller.uploadAudio
);

// Playback URL (protected — mints the signed stream link)
router.get("/interview-sessions/:sessionId/audio", controller.getSessionAudio);

// Complete a recorded session
router.post("/interview-sessions/:sessionId/complete", controller.completeSession);

// ── Public signed-playback stream router ──────────────────────────────────
// NO auth middleware here on purpose: the HTML5 <audio> element can't
// attach the auth cookie cross-origin, so the signed, expiring token in
// the URL IS the access control (bound to session + expiry, HMAC-verified).
const publicRouter = express.Router();
publicRouter.get("/sessions/:sessionId/stream", controller.streamAudio);

module.exports = router;
module.exports.publicRouter = publicRouter;
