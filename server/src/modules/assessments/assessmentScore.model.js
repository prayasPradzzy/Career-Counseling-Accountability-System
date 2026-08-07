const mongoose = require("mongoose");
const { defaultSchemaOptions } = require("../../shared/utils/schema.utils");

// ============================================================
// AssessmentScore — Calculated Results ONLY
// ============================================================
// Stores computed scores derived from raw AssessmentResponse
// data. Supports domain-level and facet-level breakdowns.
// ============================================================

const facetScoreSchema = new mongoose.Schema(
  {
    // Facet code identifier (e.g., "N1", "E3")
    facet: {
      type: String,
      default: "",
    },

    // Facet display name (e.g., "Anxiety", "Assertiveness")
    facetName: {
      type: String,
      required: true,
    },

    // Domain code identifier (e.g., "N", "E", "O", "A", "C")
    domain: {
      type: String,
      default: "",
    },

    // Raw/Average calculated score for this facet (1.0 - 5.0 scale or weighted sum)
    rawScore: {
      type: Number,
      required: true,
    },

    // Descriptive band ("Low" | "Moderate" | "High")
    band: {
      type: String,
      enum: ["Low", "Moderate", "High", ""],
      default: "",
    },

    // Normalized score (0–100 scale)
    normalizedScore: {
      type: Number,
      default: 0,
    },

    // Percentile rank
    percentile: {
      type: Number,
      default: 0,
    },

    // Qualitative interpretation level
    qualitativeLevel: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const dimensionScoreSchema = new mongoose.Schema(
  {
    // Domain code identifier (e.g., "O", "C", "E", "A", "N")
    domain: {
      type: String,
      default: "",
    },

    // Domain/dimension name (e.g., "Openness", "Extraversion")
    dimensionName: {
      type: String,
      required: true,
    },

    // Alias for dimensionName for direct schema alignment
    domainName: {
      type: String,
      default: "",
    },

    // Calculated average score for this domain (1.0 - 5.0 scale)
    score: {
      type: Number,
      default: 0,
    },

    // Raw score
    rawScore: {
      type: Number,
      required: true,
    },

    // Descriptive band ("Low" | "Moderate" | "High")
    band: {
      type: String,
      enum: ["Low", "Moderate", "High", ""],
      default: "",
    },

    // Short plain-language counselor interpretation derived from static config
    interpretation: {
      type: String,
      default: "",
    },

    // Normalized score (0–100)
    normalizedScore: {
      type: Number,
      default: 0,
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
    },

    // Student these scores belong to (primary alias)
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Student these scores belong to (backwards-compatible alias)
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Unique key identifying the assessment instrument (e.g. "ipip-neo-120")
    assessmentKey: {
      type: String,
      default: "ipip-neo-120",
      trim: true,
    },

    // Which assessment definition
    assessmentDefinitionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentDefinition",
      required: true,
    },

    // Assessment category
    category: {
      type: String,
      enum: ["personality", "interest", "values", "intelligence", "aptitude"],
      required: true,
    },

    // Which scoring algorithm was used
    scoringStrategy: {
      type: String,
      default: "ipip_neo_120",
      trim: true,
    },

    // Flat list of all 30 facet scores
    facetScores: [facetScoreSchema],

    // Top-level domain scores list
    domainScores: [dimensionScoreSchema],

    // Domain-level dimension scores with nested facet breakdowns (backwards compatible)
    dimensionScores: [dimensionScoreSchema],

    // Summary code (e.g., "O:HIGH | C:HIGH | E:MED | A:HIGH | N:LOW")
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

    // Reference to previous score document if this is a retake/rescore
    previousScoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentScore",
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

    // Explicit alias for calculatedAt
    computedAt: {
      type: Date,
      default: Date.now,
    },

    // Extensible metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  defaultSchemaOptions
);

// Indexes
assessmentScoreSchema.index({ clientId: 1, category: 1 });
assessmentScoreSchema.index({ studentId: 1, category: 1 });
assessmentScoreSchema.index({ sessionId: 1, version: 1 });

const AssessmentScore = mongoose.model(
  "AssessmentScore",
  assessmentScoreSchema
);

module.exports = AssessmentScore;
