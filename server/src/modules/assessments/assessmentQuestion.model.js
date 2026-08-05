const mongoose = require("mongoose");
const { defaultSchemaOptions } = require("../../shared/utils/schema.utils");

// ============================================================
// AssessmentQuestion — Individual Assessment Items
// ============================================================
// Each question belongs to an assessment and optionally to a
// section. Domain/facet fields enable scoring engines to group
// responses by dimension without hardcoding.
//
// reverseScored flag tells the scoring engine to invert the
// response value (e.g., for negatively-keyed IPIP items).
//
// weight allows differential scoring (default 1 = equal weight).
// ============================================================

const QUESTION_TYPE = Object.freeze({
  LIKERT: "likert",
  MULTIPLE_CHOICE: "multiple-choice",
  RANKING: "ranking",
  OPEN_ENDED: "open-ended",
  TRUE_FALSE: "true-false",
  SLIDER: "slider",
});

const assessmentQuestionSchema = new mongoose.Schema(
  {
    // Parent assessment
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentDefinition",
      required: true,
      index: true,
    },

    // Optional parent section
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentSection",
      default: null,
      index: true,
    },

    // Sequential question number within the assessment (1-indexed)
    questionNumber: {
      type: Number,
      required: true,
    },

    // Question text displayed to the student
    text: {
      type: String,
      required: true,
    },

    // Scoring domain (e.g., "Extraversion", "Realistic", "Theoretical")
    domain: {
      type: String,
      default: "",
      trim: true,
    },

    // Sub-domain facet (e.g., "Friendliness", "Assertiveness")
    facet: {
      type: String,
      default: "",
      trim: true,
    },

    // Whether this item's response value should be reversed
    // before scoring (for negatively-keyed items)
    reverseScored: {
      type: Boolean,
      default: false,
    },

    // Question response type
    questionType: {
      type: String,
      enum: Object.values(QUESTION_TYPE),
      required: true,
    },

    // Whether the student must answer this question
    required: {
      type: Boolean,
      default: true,
    },

    // Scoring weight multiplier (default = equal weight)
    weight: {
      type: Number,
      default: 1,
    },
  },
  defaultSchemaOptions
);

// Unique compound index: one question number per assessment
assessmentQuestionSchema.index(
  { assessmentId: 1, questionNumber: 1 },
  { unique: true }
);

// Fast lookup: all questions in a section
assessmentQuestionSchema.index({ assessmentId: 1, sectionId: 1 });

const AssessmentQuestion = mongoose.model(
  "AssessmentQuestion",
  assessmentQuestionSchema
);

module.exports = AssessmentQuestion;
module.exports.QUESTION_TYPE = QUESTION_TYPE;
