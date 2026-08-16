const mongoose = require("mongoose");
const { defaultSchemaOptions } = require("../../shared/utils/schema.utils");

// ============================================================
// InterviewEngagement — Top-Level Interview Engagement
// ============================================================
// One active engagement per (student, counselor) pair. An
// engagement holds the interview sessions built from the
// student's assessment profile. Distinct from the legacy
// `Interview` scheduling model — this is the AI-assisted
// question-set generation workflow.
// ============================================================

const interviewEngagementSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
      index: true,
    },
  },
  defaultSchemaOptions
);

// One active engagement per student+counselor pair
interviewEngagementSchema.index({ studentId: 1, counselorId: 1, status: 1 });

const InterviewEngagement = mongoose.model(
  "InterviewEngagement",
  interviewEngagementSchema
);

module.exports = InterviewEngagement;
