const mongoose = require("mongoose");
const { defaultSchemaOptions } = require("../../shared/utils/schema.utils");

// ============================================================
// AssessmentDefinition — Top-Level Assessment Catalog Entry
// ============================================================
// This is the master definition for any assessment instrument.
// Questions, sections, and options are stored in their own
// collections and linked via assessmentId.
//
// Everything is data-driven: scoringStrategy, scale, and
// metadata allow any future assessment type (IPIP-120, RIASEC,
// Intelligence, Values, custom) to be defined without code
// changes.
// ============================================================

const ASSESSMENT_STATUS = Object.freeze({
  DRAFT: "draft",
  ACTIVE: "active",
  ARCHIVED: "archived",
  DEPRECATED: "deprecated",
});

const ASSESSMENT_CATEGORY = Object.freeze({
  PERSONALITY: "personality",
  INTEREST: "interest",
  VALUES: "values",
  INTELLIGENCE: "intelligence",
  APTITUDE: "aptitude",
});

const assessmentDefinitionSchema = new mongoose.Schema(
  {
    // Display name (e.g., "IPIP-NEO 120", "Holland RIASEC")
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Machine-readable unique code (e.g., IPIP_120, RIASEC_60)
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    // Question response type (e.g., "likert", "checkbox", "ranking")
    responseType: {
      type: String,
      default: "likert",
      trim: true,
    },

    // Assessment category
    category: {
      type: String,
      enum: Object.values(ASSESSMENT_CATEGORY),
      required: true,
      index: true,
    },

    // Public description of the assessment
    description: {
      type: String,
      required: true,
    },

    // Instructions shown to the student before starting
    instructions: {
      type: String,
      default: "",
    },

    // Estimated completion time in minutes
    estimatedDuration: {
      type: Number,
      default: 15,
    },

    // Schema/instrument version
    version: {
      type: Number,
      default: 1,
    },

    // Lifecycle status (replaces boolean isActive)
    status: {
      type: String,
      enum: Object.values(ASSESSMENT_STATUS),
      default: ASSESSMENT_STATUS.DRAFT,
      index: true,
    },

    // Scoring strategy identifier — tells the scoring engine
    // how to compute results from raw responses.
    // Examples: "likert_sum", "weighted_sum", "irt", "custom"
    scoringStrategy: {
      type: String,
      default: "likert_sum",
      trim: true,
    },

    // Data-driven scale configuration.
    // Example for a 5-point Likert:
    //   { min: 1, max: 5, labels: ["Very Inaccurate", ..., "Very Accurate"] }
    // Example for RIASEC ranking:
    //   { type: "ranking", options: 6 }
    scale: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Extensible metadata for any assessment-specific config
    // that doesn't warrant a dedicated schema field.
    // Examples: normative data references, source citations,
    // question pool size, randomization settings.
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  defaultSchemaOptions
);

const AssessmentDefinition = mongoose.model(
  "AssessmentDefinition",
  assessmentDefinitionSchema
);

module.exports = AssessmentDefinition;
module.exports.ASSESSMENT_STATUS = ASSESSMENT_STATUS;
module.exports.ASSESSMENT_CATEGORY = ASSESSMENT_CATEGORY;
