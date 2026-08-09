const express = require("express");
const router = express.Router();
const controller = require("./assessmentAssignment.controller");
const { requireAuth, restrictTo } = require("../../shared/middleware/auth.middleware");

// Protect all assessment assignment routes with JWT auth
router.use(requireAuth);

// Student fetches their own assignments
router.get("/my-assignments", controller.getMyAssignments);

// Get assignments for a specific student (Student own, or Counselor/Admin)
router.get("/student/:studentId", controller.getStudentAssignments);

// Counselor/Admin fetches all assignments for review
router.get(
  "/counselor-assignments",
  restrictTo("counselor", "admin"),
  controller.getCounselorAssignments
);

// Counselor/Admin fetches full review details for a specific assignment
router.get(
  "/assignments/:assignmentId/review-detail",
  restrictTo("counselor", "admin"),
  controller.getAssignmentReviewDetail
);

// Counselor/Admin assigns an assessment to a student
router.post(
  "/assignments",
  restrictTo("counselor", "admin"),
  controller.assignAssessment
);

// Student starts an assigned assessment (Enforces Guard Rule & Prerequisite Lock Check)
router.patch("/assignments/:assignmentId/start", controller.startAssignment);

// Student completes an assigned assessment
router.patch("/assignments/:assignmentId/complete", controller.completeAssignment);

// Counselor reviews completed assessment
router.patch(
  "/assignments/:assignmentId/review",
  restrictTo("counselor", "admin"),
  controller.reviewAssignment
);

// Counselor approves assessment (And unlocks next assessment if configured)
router.patch(
  "/assignments/:assignmentId/approve",
  restrictTo("counselor", "admin"),
  controller.approveAssignment
);

// Counselor requests retake / rejects assessment
router.patch(
  "/assignments/:assignmentId/reject",
  restrictTo("counselor", "admin"),
  controller.rejectAssignment
);
router.post(
  "/assignments/:assignmentId/retake",
  restrictTo("counselor", "admin"),
  controller.rejectAssignment
);

// Counselor/Admin recomputes assessment score
router.post(
  "/assignments/:assignmentId/rescore",
  restrictTo("counselor", "admin"),
  controller.rescoreAssignment
);

// Counselor/Admin revokes assignment
router.delete(
  "/assignments/:assignmentId",
  restrictTo("counselor", "admin"),
  controller.deleteAssignment
);

module.exports = router;
