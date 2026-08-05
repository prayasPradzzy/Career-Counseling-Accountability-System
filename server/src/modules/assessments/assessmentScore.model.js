const mongoose = require("mongoose");
const { defaultSchemaOptions } = require("../../shared/utils/schema.utils");

// ============================================================
// AssessmentScore — Calculated Results ONLY
// ============================================================
// Stores computed scores derived from raw AssessmentResponse
// data. Supports domain-level and facet-level breakdowns.
//
// scoringStrategy records which algorithm produced these scores.
// version enables re-scoring: if the strategy is updated,
// a new AssessmentScore with version+1 can be created while
// preserving the original.
//
// metadata allows storing assessment-specific computed data
// (e.g., confidence intervals, norm group comparisons).
// ============================================================

const facetScoreSchema = new mongoose.Schema(
  {
    // Facet name (e.g., "Friendliness", "Assertiveness")
    facetName: {
      type: String,
      required: true,
    },

    // Raw summed score for this facet
    rawScore: {
      type: Number,
      required: true,
    },

    // Normalized score (0–100)
    normalizedScore: {
      type: Number,
      required: true,
    },

    // Percentile rank
    percentile: {
      type: Number,
      default: 0,
    },

    // Qualitative interpretation (e.g., "High", "Medium", "Low")
    qualitativeLevel: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const dimensionScoreSchema = new mongoose.Schema(
  {
    // Domain/dimension name (e.g., "Extraversion", "Realistic")
    dimensionName: {
      type: String,
      required: true,
    },

    // Raw summed score for this dimension
    rawScore: {
      type: Number,
      required: true,
    },

    // Normalized score (0–100)
    normalizedScore: {
      type: Number,
      required: true,
    },

    // Percentile rank
    percentile: {
      type: Number,
      default: 0,
    },

    // Qualitative interpretation
    qualitativeLevel: {
      type: String,
      default: "",
    },

    // Sub-dimension facet breakdowns
    facetScores: [facetScoreSchema],
  },
  { _id: false }
);

const assessmentScoreSchema = new mongoose.Schema(
  {
    // Which session produced these scores
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentSession",
      required: true,
      index: true,
    },

    // Student these scores belong to
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Which assessment definition
    assessmentDefinitionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentDefinition",
      required: true,
      index: true,
    },

    // Assessment category
    category: {
      type: String,
      enum: ["personality", "interest", "values", "intelligence", "aptitude"],
      required: true,
      index: true,
    },

    // Which scoring algorithm was used
    scoringStrategy: {
      type: String,
      default: "likert_sum",
      trim: true,
    },

    // Domain-level dimension scores with nested facet breakdowns
    dimensionScores: [dimensionScoreSchema],

    // Summary code (e.g., "RIA" for Holland, "OCEAN" profile code)
    overallCode: {
      type: String,
      trim: true,
      default: "",
    },

    // Aggregate overall score if applicable
    overallScore: {
      type: Number,
      default: null,
    },

    // Score version (enables re-scoring without losing history)
    version: {
      type: Number,
      default: 1,
    },

    // When scores were calculated
    calculatedAt: {
      type: Date,
      default: Date.now,
    },

    // Extensible metadata (norm group comparisons, confidence
    // intervals, algorithm parameters, etc.)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  defaultSchemaOptions
);

// Index for retrieving client scores by category
assessmentScoreSchema.index({ clientId: 1, category: 1 });

// Index for versioned scores per session
assessmentScoreSchema.index({ sessionId: 1, version: 1 });

const AssessmentScore = mongoose.model(
  "AssessmentScore",
  assessmentScoreSchema
);

module.exports = AssessmentScore;
