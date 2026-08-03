const mongoose = require("mongoose");
const { defaultSchemaOptions } = require("../../shared/utils/schema.utils");

const interviewSchema = new mongoose.Schema(
  {
    clientId: {
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
    scheduledAt: { type: Date, required: true, index: true },
    completedAt: { type: Date },
    durationMinutes: { type: Number, default: 45 },
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed", "cancelled", "no-show"],
      default: "scheduled",
      index: true,
    },
    counselorNotes: { type: String, default: "" }, // Human Counselor Notes
    clientGoalsStated: [{ type: String, trim: true }],
    recordingUrl: { type: String, default: "" }, // Audio recording URL for Speech-to-Text
    meetingLink: { type: String, default: "" },
  },
  defaultSchemaOptions
);

// Compound index for client and counselor schedule views
interviewSchema.index({ counselorId: 1, scheduledAt: 1 });
interviewSchema.index({ clientId: 1, scheduledAt: 1 });

const Interview = mongoose.model("Interview", interviewSchema);

module.exports = Interview;
