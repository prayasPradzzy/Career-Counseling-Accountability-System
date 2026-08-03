const mongoose = require("mongoose");
const { defaultSchemaOptions } = require("../../shared/utils/schema.utils");

const dimensionScoreSchema = new mongoose.Schema(
  {
    dimensionName: { type: String, required: true }, // e.g., Realistic, Extraversion
    rawScore: { type: Number, required: true },
    normalizedScore: { type: Number, required: true }, // 0 - 100
    percentile: { type: Number, default: 0 },
    qualitativeLevel: { type: String }, // High, Medium, Low
  },
  { _id: false }
);

const assessmentScoreSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentSession",
      required: true,
      unique: true,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    assessmentDefinitionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentDefinition",
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["personality", "interest", "values", "intelligence", "aptitude"],
      required: true,
      index: true,
    },
    dimensionScores: [dimensionScoreSchema],
    overallCode: { type: String, trim: true }, // e.g., "RIA", "INTJ"
    calculatedAt: { type: Date, default: Date.now },
  },
  defaultSchemaOptions
);

// Index for retrieving client scores by category
assessmentScoreSchema.index({ clientId: 1, category: 1 });

const AssessmentScore = mongoose.model("AssessmentScore", assessmentScoreSchema);

module.exports = AssessmentScore;
