const assessmentAssignmentService = require("./assessmentAssignment.service");
const ApiResponse = require("../../shared/utils/ApiResponse");
const catchAsync = require("../../shared/utils/catchAsync");

const assignAssessment = catchAsync(async (req, res) => {
  const result = await assessmentAssignmentService.assignAssessment(req.body, req.user);
  res.status(201).json(new ApiResponse(201, { assignment: result }, "Assessment assigned successfully."));
});

const getStudentAssignments = catchAsync(async (req, res) => {
  const { studentId } = req.params;
  const assignments = await assessmentAssignmentService.getStudentAssignments(studentId, req.user);
  res.status(200).json(new ApiResponse(200, { assignments }, "Student assignments retrieved successfully."));
});

const getMyAssignments = catchAsync(async (req, res) => {
  const assignments = await assessmentAssignmentService.getMyAssignments(req.user);
  res.status(200).json(new ApiResponse(200, { assignments }, "My assignments retrieved successfully."));
});

const startAssignment = catchAsync(async (req, res) => {
  const { assignmentId } = req.params;
  const assignment = await assessmentAssignmentService.startAssignment(assignmentId, req.user);
  res.status(200).json(new ApiResponse(200, { assignment }, "Assessment started successfully."));
});

const completeAssignment = catchAsync(async (req, res) => {
  const { assignmentId } = req.params;
  const assignment = await assessmentAssignmentService.completeAssignment(assignmentId, req.user);
  res.status(200).json(new ApiResponse(200, { assignment }, "Assessment completed successfully."));
});

const reviewAssignment = catchAsync(async (req, res) => {
  const { assignmentId } = req.params;
  const { counselorNotes } = req.body;
  const assignment = await assessmentAssignmentService.reviewAssignment(assignmentId, counselorNotes, req.user);
  res.status(200).json(new ApiResponse(200, { assignment }, "Assessment marked under review."));
});

const approveAssignment = catchAsync(async (req, res) => {
  const { assignmentId } = req.params;
  const { counselorNotes } = req.body;
  const assignment = await assessmentAssignmentService.approveAssignment(assignmentId, counselorNotes, req.user);
  res.status(200).json(new ApiResponse(200, { assignment }, "Assessment approved successfully."));
});

const deleteAssignment = catchAsync(async (req, res) => {
  const { assignmentId } = req.params;
  const result = await assessmentAssignmentService.deleteAssignment(assignmentId, req.user);
  res.status(200).json(new ApiResponse(200, result, "Assessment assignment revoked."));
});

module.exports = {
  assignAssessment,
  getStudentAssignments,
  getMyAssignments,
  startAssignment,
  completeAssignment,
  reviewAssignment,
  approveAssignment,
  deleteAssignment,
};
