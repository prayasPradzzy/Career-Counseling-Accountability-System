const mongoose = require("mongoose");
const { defaultSchemaOptions } = require("../../shared/utils/schema.utils");

const assessmentSessionSchema = new mongoose.Schema(
  {
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
    status: {
      type: String,
      enum: ["not-started", "in-progress", "completed", "abandoned"],
      default: "not-started",
      index: true,
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
    timeSpentSeconds: { type: Number, default: 0 },
    currentQuestionIndex: { type: Number, default: 0 },
  },
  defaultSchemaOptions
);

// Compound Index for quick user active session lookups
assessmentSessionSchema.index({ clientId: 1, assessmentDefinitionId: 1, status: 1 });

const AssessmentSession = mongoose.model(
  "AssessmentSession",
  assessmentSessionSchema
);

module.exports = AssessmentSession;
