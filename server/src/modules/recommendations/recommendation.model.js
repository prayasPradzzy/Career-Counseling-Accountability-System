const mongoose = require("mongoose");
const { defaultSchemaOptions } = require("../../shared/utils/schema.utils");

const gapAnalysisSchema = new mongoose.Schema(
  {
    missingSkills: [{ type: String, trim: true }],
    recommendedCourses: [{ type: String, trim: true }],
    actionSteps: [{ type: String, trim: true }],
  },
  { _id: false }
);

const counselorApprovalSchema = new mongoose.Schema(
  {
    isApproved: { type: Boolean, default: false },
    counselorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    counselorNotes: { type: String, default: "" },
    approvedAt: { type: Date },
  },
  { _id: false }
);

const recommendationSchema = new mongoose.Schema(
  {
    // ARCHITECTURE RULE: Recommendations belong to Reports, not directly to Student
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    careerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CareerReference",
      required: true,
      index: true,
    },
    matchScore: { type: Number, required: true, min: 0, max: 100, index: true },
    fitReasons: [{ type: String, trim: true }],
    gapAnalysis: gapAnalysisSchema,
    generatedBy: {
      type: String,
      enum: ["ai-engine", "counselor-override"],
      default: "ai-engine",
    },
    counselorApproval: counselorApprovalSchema,
  },
  defaultSchemaOptions
);

// Compound index for report recommendation rankings
recommendationSchema.index({ reportId: 1, matchScore: -1 });

const Recommendation = mongoose.model("Recommendation", recommendationSchema);

module.exports = Recommendation;
