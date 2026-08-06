const mongoose = require("mongoose");
const { defaultSchemaOptions } = require("../../shared/utils/schema.utils");

// ============================================================
// AssessmentSession — Assessment Execution Lifecycle
// ============================================================
// Tracks a single student's attempt at an assessment.
// Supports the full lifecycle: Not Started → In Progress →
// Completed → Submitted → Reviewed → Approved / Expired.
//
// Auto-save: currentQuestionIndex + progress snapshot + lastActiveAt
// allow seamless resume from any interruption point.
//
// Linked to AssessmentAssignment via assignmentId to maintain
// the counselor-driven guard rule.
// ============================================================

const SESSION_STATUS = Object.freeze({
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  SUBMITTED: "submitted",
  REVIEWED: "reviewed",
  APPROVED: "approved",
  EXPIRED: "expired",
});

const assessmentSessionSchema = new mongoose.Schema(
  {
    // Student taking the assessment
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

    // Links this session to the counselor-driven assignment
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentAssignment",
      default: null,
      index: true,
    },

    // Session lifecycle status
    status: {
      type: String,
      enum: Object.values(SESSION_STATUS),
      default: SESSION_STATUS.NOT_STARTED,
      index: true,
    },

    // Timestamps
    startedAt: { type: Date },
    completedAt: { type: Date },
    submittedAt: { type: Date },

    // Optional expiration deadline
    expiresAt: { type: Date },

    // Total time spent in seconds (accumulated across resumes)
    timeSpentSeconds: {
      type: Number,
      default: 0,
    },

    // Last activity timestamp for auto-save tracking
    lastActiveAt: {
      type: Date,
    },

    // Current question index for resume (0-indexed)
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },

    // Auto-save progress snapshot
    // { answeredCount: Number, totalQuestions: Number, percentage: Number }
    progress: {
      type: mongoose.Schema.Types.Mixed,
      default: { answeredCount: 0, totalQuestions: 0, percentage: 0 },
    },

    // Extensible metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Quick-completion flag — set server-side at submission if duration is
    // suspiciously short relative to the number of questions.
    flagged: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Machine-readable reason string (e.g. "quick_completion")
    flagReason: {
      type: String,
      default: null,
    },
  },
  defaultSchemaOptions
);

// Compound index for quick active session lookups
assessmentSessionSchema.index({
  clientId: 1,
  assessmentDefinitionId: 1,
  status: 1,
});

const AssessmentSession = mongoose.model(
  "AssessmentSession",
  assessmentSessionSchema
);

module.exports = AssessmentSession;
module.exports.SESSION_STATUS = SESSION_STATUS;
