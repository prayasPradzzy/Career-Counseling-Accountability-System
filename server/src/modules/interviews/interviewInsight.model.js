const mongoose = require("mongoose");
const { defaultSchemaOptions } = require("../../shared/utils/schema.utils");

const ocrNoteSchema = new mongoose.Schema(
  {
    documentUrl: { type: String, required: true },
    extractedText: { type: String, required: true },
    confidenceScore: { type: Number, default: 0 },
    extractedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const transcriptSchema = new mongoose.Schema(
  {
    fullText: { type: String, required: true }, // Speech-to-Text full transcript
    confidenceScore: { type: Number, default: 0 },
    wordCount: { type: Number, default: 0 },
    generatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const interviewInsightSchema = new mongoose.Schema(
  {
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
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
    transcript: transcriptSchema,
    ocrNotes: [ocrNoteSchema], // Handwritten / scanned notes parsed via OCR
    keyTopicsExtracted: [{ type: String, trim: true }],
    sentimentScore: { type: Number, min: -1, max: 1, default: 0 }, // -1 (negative) to +1 (positive)
    aiSummary: { type: String, required: true },
    aiGeneratedAt: { type: Date, default: Date.now },
  },
  defaultSchemaOptions
);

const InterviewInsight = mongoose.model(
  "InterviewInsight",
  interviewInsightSchema
);

module.exports = InterviewInsight;
