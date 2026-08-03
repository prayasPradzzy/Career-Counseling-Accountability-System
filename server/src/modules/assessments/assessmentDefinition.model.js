const mongoose = require("mongoose");
const { defaultSchemaOptions } = require("../../shared/utils/schema.utils");

const questionOptionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    numericWeight: { type: Number, default: 0 },
  },
  { _id: true }
);

const questionSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    text: { type: String, required: true },
    type: {
      type: String,
      enum: ["likert", "multiple-choice", "ranking", "open-ended"],
      required: true,
    },
    dimension: { type: String, required: true, trim: true }, // e.g., Realistic, Extraversion
    options: [questionOptionSchema],
  },
  { _id: true }
);

const assessmentDefinitionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    }, // e.g., HOLLAND_RIASEC, BIG_FIVE_OCEAN, DISC, APTITUDE_MATH
    category: {
      type: String,
      enum: ["personality", "interest", "values", "intelligence", "aptitude"],
      required: true,
      index: true,
    },
    description: { type: String, required: true },
    estimatedTimeMinutes: { type: Number, default: 15 },
    questions: [questionSchema],
    version: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true, index: true },
  },
  defaultSchemaOptions
);

const AssessmentDefinition = mongoose.model(
  "AssessmentDefinition",
  assessmentDefinitionSchema
);

module.exports = AssessmentDefinition;
