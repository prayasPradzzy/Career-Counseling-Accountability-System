const express = require("express");
const router = express.Router();
const controller = require("./assessmentSession.controller");
const { requireAuth } = require("../../shared/middleware/auth.middleware");

// Protect all assessment session routes with JWT authentication
router.use(requireAuth);

// Get student's current active session if any
router.get("/active", controller.getActiveSession);

// Start or Resume a session using a valid assignment ID (Enforces Guard Rule)
router.post("/start", controller.startOrResumeSession);

// Get current session state and progress
router.get("/:sessionId", controller.getSessionState);

// Fetch structured sections, questions, options, and saved answers for a session
router.get("/:sessionId/questions", controller.getQuestions);

// Autosave progress & responses (Locks if session is completed/submitted)
router.patch("/:sessionId/autosave", controller.autosaveProgress);

// Finalize, submit, and lock session
router.post("/:sessionId/submit", controller.submitSession);

// Counselor requests retake for session
router.post("/:sessionId/retake", controller.requestRetakeBySessionId);

// Fetch non-clinical student assessment analysis results by key
router.get("/my-results/:key", controller.getStudentResults);

module.exports = router;
