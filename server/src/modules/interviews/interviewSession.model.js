const mongoose = require("mongoose");
const { defaultSchemaOptions } = require("../../shared/utils/schema.utils");

// ============================================================
// InterviewSession — One Interview Within an Engagement
// ============================================================
// A session is one concrete interview to run: with the candidate or the
// professional. 'parent' remains in the enum ONLY so legacy documents stay
// valid — creating parent sessions is blocked at the API level (Parent
// sessions are not currently available). targetDuration is fixed by session
// type (45 min candidate/professional).
// ============================================================

const SESSION_TYPE = Object.freeze({
  PARENT: "parent",
  CANDIDATE: "candidate",
  PROFESSIONAL_SELF: "professional_self",
});

const SESSION_STATUS = Object.freeze({
  NOT_STARTED: "not_started",
  QUESTIONS_GENERATED: "questions_generated",
  APPROVED: "approved",
  IN_PROGRESS: "in_progress",
  RECORDED: "recorded",
  COMPLETED: "completed",
});

const interviewSessionSchema = new mongoose.Schema(
  {
    engagementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewEngagement",
      required: true,
      index: true,
    },
    sessionType: {
      type: String,
      enum: Object.values(SESSION_TYPE),
      required: true,
      index: true,
    },
    targetDuration: {
      type: Number,
      default: 45, // minutes — 30 for parent, 45 for candidate/professional
    },
    status: {
      type: String,
      enum: Object.values(SESSION_STATUS),
      default: SESSION_STATUS.NOT_STARTED,
      index: true,
    },
    // When the counselor actually started conducting the session
    conductedAt: {
      type: Date,
      default: null,
    },
    // Reference to the AudioAsset holding the recorded session audio
    audioAssetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AudioAsset",
      default: null,
    },
    // Real duration in seconds, derived from the audio file metadata
    actualDuration: {
      type: Number,
      default: null,
    },
  },
  defaultSchemaOptions
);

const InterviewSession = mongoose.model("InterviewSession", interviewSessionSchema);

module.exports = InterviewSession;
module.exports.SESSION_TYPE = SESSION_TYPE;
module.exports.SESSION_STATUS = SESSION_STATUS;
