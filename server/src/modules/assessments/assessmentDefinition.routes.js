const express = require("express");
const router = express.Router();
const AssessmentDefinition = require("./assessmentDefinition.model");
const AssessmentQuestion = require("./assessmentQuestion.model");
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
      .select("title code category description estimatedDuration version responseType")
      .sort({ category: 1, title: 1 })
      .lean();

    // Attach real question counts so the UI can display item counts per assessment
    const definitionIds = definitions.map((d) => d._id);
    const questionCounts = await AssessmentQuestion.aggregate([
      { $match: { assessmentId: { $in: definitionIds } } },
      { $group: { _id: "$assessmentId", count: { $sum: 1 } } },
    ]);
    const countByDefinitionId = new Map(
      questionCounts.map((c) => [c._id.toString(), c.count])
    );

    const result = definitions.map((d) => ({
      ...d,
      questionCount: countByDefinitionId.get(d._id.toString()) || 0,
    }));

    res.status(200).json(
      new ApiResponse(200, { definitions: result }, "Active assessment definitions retrieved.")
    );
  })
);

module.exports = router;
