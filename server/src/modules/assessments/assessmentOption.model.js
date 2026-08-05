const mongoose = require("mongoose");
const { defaultSchemaOptions } = require("../../shared/utils/schema.utils");

// ============================================================
// AssessmentOption — Answer Choices for Questions
// ============================================================
// Each option belongs to a specific question. This allows
// maximum flexibility: different questions can have different
// option sets (e.g., Likert-5, Likert-7, Yes/No, custom).
//
// For assessments where all questions share the same scale
// (e.g., IPIP-120 with 5 Likert options), the shared scale
// is also stored in AssessmentDefinition.scale for convenience.
// Options here serve as the canonical per-question source of
// truth for rendering and validation.
// ============================================================

const assessmentOptionSchema = new mongoose.Schema(
  {
    // Parent question
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentQuestion",
      required: true,
      index: true,
    },

    // Display label (e.g., "Very Inaccurate", "Strongly Agree")
    label: {
      type: String,
      required: true,
      trim: true,
    },

    // Stored value (numeric or string, used in scoring)
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // Display order (1-indexed)
    order: {
      type: Number,
      required: true,
    },
  },
  defaultSchemaOptions
);

// Unique compound index: one order per question
assessmentOptionSchema.index({ questionId: 1, order: 1 }, { unique: true });

const AssessmentOption = mongoose.model(
  "AssessmentOption",
  assessmentOptionSchema
);

module.exports = AssessmentOption;
