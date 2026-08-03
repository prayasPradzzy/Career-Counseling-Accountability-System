const mongoose = require("mongoose");
const { defaultSchemaOptions } = require("../../shared/utils/schema.utils");

const ASSIGNMENT_STATUS = Object.freeze({
  ASSIGNED: "ASSIGNED",
  SCHEDULED: "SCHEDULED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
});

const assessmentAssignmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    counselorId: {
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
    status: {
      type: String,
      enum: Object.values(ASSIGNMENT_STATUS),
      default: ASSIGNMENT_STATUS.ASSIGNED,
      index: true,
    },
    scheduledFor: { type: Date },
    dueDate: { type: Date },
    assignedAt: { type: Date, default: Date.now },
    startedAt: { type: Date },
    completedAt: { type: Date },
    reviewedAt: { type: Date },
    approvedAt: { type: Date },
    counselorNotes: { type: String, trim: true, default: "" },
    unlocksNextAssessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentDefinition",
    },
    prerequisiteAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentAssignment",
    },
  },
  defaultSchemaOptions
);

// Compound Index to query student active/pending assignments fast
assessmentAssignmentSchema.index({ studentId: 1, status: 1, category: 1 });
assessmentAssignmentSchema.index({ counselorId: 1, status: 1 });

const AssessmentAssignment = mongoose.model(
  "AssessmentAssignment",
  assessmentAssignmentSchema
);

module.exports = {
  AssessmentAssignment,
  ASSIGNMENT_STATUS,
};
