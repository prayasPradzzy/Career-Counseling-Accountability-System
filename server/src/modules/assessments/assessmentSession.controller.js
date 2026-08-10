const assessmentSessionService = require("./assessmentSession.service");
const ApiResponse = require("../../shared/utils/ApiResponse");
const catchAsync = require("../../shared/utils/catchAsync");

const startOrResumeSession = catchAsync(async (req, res) => {
  const { assignmentId } = req.body;
  const result = await assessmentSessionService.startOrResumeSession(assignmentId, req.user);
  res.status(200).json(new ApiResponse(200, result, "Assessment session started/resumed successfully."));
});

const getSessionState = catchAsync(async (req, res) => {
  const { sessionId } = req.params;
  const result = await assessmentSessionService.getSessionState(sessionId, req.user);
  res.status(200).json(new ApiResponse(200, result, "Session state retrieved successfully."));
});

const getQuestions = catchAsync(async (req, res) => {
  const { sessionId } = req.params;
  const result = await assessmentSessionService.getQuestions(sessionId, req.user);
  res.status(200).json(new ApiResponse(200, result, "Assessment questions retrieved successfully."));
});

const autosaveProgress = catchAsync(async (req, res) => {
  const { sessionId } = req.params;
  const result = await assessmentSessionService.autosaveProgress(sessionId, req.body, req.user);
  res.status(200).json(new ApiResponse(200, result, "Session progress autosaved successfully."));
});

const submitSession = catchAsync(async (req, res) => {
  const { sessionId } = req.params;
  const result = await assessmentSessionService.submitSession(sessionId, req.user);
  res.status(200).json(new ApiResponse(200, result, "Assessment session submitted and locked."));
});

const getActiveSession = catchAsync(async (req, res) => {
  const result = await assessmentSessionService.getActiveSession(req.user);
  res.status(200).json(new ApiResponse(200, { activeSession: result }, "Active session checked successfully."));
});

const getStudentResults = catchAsync(async (req, res) => {
  const { key } = req.params;
  const result = await assessmentSessionService.getStudentResults(key, req.user);
  res.status(200).json(new ApiResponse(200, result, "Student assessment analysis retrieved successfully."));
});

const requestRetakeBySessionId = catchAsync(async (req, res) => {
  const { sessionId } = req.params;
  const { reason, counselorNotes } = req.body;
  const assessmentAssignmentService = require("./assessmentAssignment.service");

  const result = await assessmentAssignmentService.requestRetake(
    { sessionId, reason: reason || counselorNotes },
    req.user
  );
  res.status(200).json(new ApiResponse(200, result, "Assessment retake requested successfully."));
});

module.exports = {
  startOrResumeSession,
  getSessionState,
  getQuestions,
  autosaveProgress,
  submitSession,
  getActiveSession,
  getStudentResults,
  requestRetakeBySessionId,
};
