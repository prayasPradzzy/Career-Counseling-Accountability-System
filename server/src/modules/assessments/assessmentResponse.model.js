const mongoose = require("mongoose");
const { defaultSchemaOptions } = require("../../shared/utils/schema.utils");

// ============================================================
// AssessmentResponse — Raw Student Responses ONLY
// ============================================================
// This model stores ONLY what the student selected.
// No calculated scores, no dimension inference, no weights.
//
// Scoring is computed separately and stored in AssessmentScore.
// This separation ensures:
//   1. Raw data integrity (responses never mutated by scoring)
//   2. Re-scoring capability (scoring strategy changes don't
//      require re-collecting responses)
//   3. Audit trail (raw vs computed data cleanly separated)
// ============================================================

const singleResponseSchema = new mongoose.Schema(
  {
    // Reference to the question answered
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentQuestion",
      required: true,
    },

    // Denormalized question number for fast ordering and display
    questionNumber: {
      type: Number,
      required: true,
    },

    // The raw value the student selected (number, string, array, etc.)
    selectedValue: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // Time taken to answer this question in milliseconds
    responseTimeMs: {
      type: Number,
      default: 0,
    },

    // When the student answered
    answeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const assessmentResponseSchema = new mongoose.Schema(
  {
    // Which session these responses belong to
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentSession",
      required: true,
      unique: true,
      index: true,
    },

    // Student who responded
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

    // Array of individual raw responses
    responses: [singleResponseSchema],
  },
  defaultSchemaOptions
);

const AssessmentResponse = mongoose.model(
  "AssessmentResponse",
  assessmentResponseSchema
);

module.exports = AssessmentResponse;
