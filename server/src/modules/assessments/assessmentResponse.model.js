const mongoose = require("mongoose");
const { defaultSchemaOptions } = require("../../shared/utils/schema.utils");

const singleResponseSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    dimension: { type: String, required: true },
    selectedValue: { type: mongoose.Schema.Types.Mixed, required: true },
    numericScore: { type: Number, default: 0 },
    responseTimeMs: { type: Number, default: 0 },
    answeredAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const assessmentResponseSchema = new mongoose.Schema(
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
    responses: [singleResponseSchema],
  },
  defaultSchemaOptions
);

const AssessmentResponse = mongoose.model(
  "AssessmentResponse",
  assessmentResponseSchema
);

module.exports = AssessmentResponse;
