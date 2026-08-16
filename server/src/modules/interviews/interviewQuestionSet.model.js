const mongoose = require("mongoose");
const { defaultSchemaOptions } = require("../../shared/utils/schema.utils");

// ============================================================
// InterviewQuestionSet — Generated + Reviewed Question Set
// ============================================================
// Holds the cluster-organized interview guide for one session.
// A session can have several generations (regeneration creates
// a new document); the latest is the current one. The counselor
// must explicitly approve before the set is considered ready.
// ============================================================

const clusterPrioritySchema = new mongoose.Schema(
  {
    cluster: { type: String, required: true },
    priority: { type: String, enum: ["high", "medium", "light"], required: true },
  },
  { _id: false }
);

const clusterQuestionsSchema = new mongoose.Schema(
  {
    cluster: { type: String, required: true },
    priority: { type: String, enum: ["high", "medium", "light"], required: true },
    questions: [{ type: String, trim: true }],
    rationale: { type: String, default: "" },
  },
  { _id: false }
);

const interviewQuestionSetSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewSession",
      required: true,
      index: true,
    },
    clusterPriorities: [clusterPrioritySchema],
    questionsByCluster: [clusterQuestionsSchema],
    reviewedByCounselor: {
      type: Boolean,
      default: false,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  defaultSchemaOptions
);

interviewQuestionSetSchema.index({ sessionId: 1, generatedAt: -1 });

const InterviewQuestionSet = mongoose.model(
  "InterviewQuestionSet",
  interviewQuestionSetSchema
);

module.exports = InterviewQuestionSet;
