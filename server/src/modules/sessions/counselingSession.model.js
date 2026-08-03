const mongoose = require("mongoose");
const { defaultSchemaOptions } = require("../../shared/utils/schema.utils");

const SESSION_STATUS = Object.freeze({
  SCHEDULED: "SCHEDULED",
  CONFIRMED: "CONFIRMED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
  // Legacy compatibility
  in_progress: "in-progress",
});

const attachmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true, trim: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const counselingSessionSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true,
      trim: true,
      default: "Counseling Strategy Session",
    },
    scheduledAt: { type: Date, required: true, index: true },
    completedAt: { type: Date },
    durationMinutes: { type: Number, default: 45 },
    status: {
      type: String,
      enum: [
        ...Object.values(SESSION_STATUS),
        "scheduled",
        "confirmed",
        "completed",
        "cancelled",
        "no-show",
      ],
      default: SESSION_STATUS.SCHEDULED,
      index: true,
    },
    counselorNotes: { type: String, default: "" },
    clientGoalsStated: [{ type: String, trim: true }],
    meetingLink: { type: String, default: "" },
    attachments: [attachmentSchema],

    // Architecture Placeholders for Pipeline
    interview: {
      notes: { type: String, default: "" },
      conductedAt: { type: Date },
    },
    futureOcr: {
      scannedDocUrls: [{ type: String }],
      extractedText: { type: String, default: "" },
    },
    futureAudio: {
      recordingUrl: { type: String, default: "" },
      audioDurationSeconds: { type: Number, default: 0 },
    },
    futureTranscript: {
      fullText: { type: String, default: "" },
      confidenceScore: { type: Number, default: 0 },
    },
    futureAiSummary: {
      keyTakeaways: [{ type: String }],
      sentimentScore: { type: Number, default: 0 },
    },
  },
  defaultSchemaOptions
);

// Compound Index for client and counselor schedule lookups
counselingSessionSchema.index({ counselorId: 1, scheduledAt: 1 });
counselingSessionSchema.index({ studentId: 1, scheduledAt: 1 });

const CounselingSession = mongoose.model(
  "CounselingSession",
  counselingSessionSchema
);

module.exports = {
  CounselingSession,
  SESSION_STATUS,
};
