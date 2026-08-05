const express = require("express");
const router = express.Router();
const AssessmentDefinition = require("./assessmentDefinition.model");
const ApiResponse = require("../../shared/utils/ApiResponse");
const catchAsync = require("../../shared/utils/catchAsync");
const { requireAuth, restrictTo } = require("../../shared/middleware/auth.middleware");

// Protect all definition routes with JWT auth
router.use(requireAuth);

/**
 * GET /api/v1/assessment-definitions
 * Returns all active assessment definitions for the assignment dialog.
 * Accessible by counselors and admins only.
 */
router.get(
  "/",
  restrictTo("counselor", "admin"),
  catchAsync(async (req, res) => {
    const definitions = await AssessmentDefinition.find({ status: "active" })
      .select("title code category description estimatedDuration version")
      .sort({ category: 1, title: 1 })
      .lean();

    res.status(200).json(
      new ApiResponse(200, { definitions }, "Active assessment definitions retrieved.")
    );
  })
);

module.exports = router;
