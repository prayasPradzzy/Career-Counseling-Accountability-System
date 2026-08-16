const mongoose = require("mongoose");
const { defaultSchemaOptions } = require("../../shared/utils/schema.utils");

// ============================================================
// AudioAsset — Reference to a Recorded Session's Audio File
// ============================================================
// Deliberately stores NO binary audio. Only a reference (the
// storage key: GridFS file id or Cloudinary public_id) lives in
// this collection. The file itself is kept in the configured
// object/media storage (currently GridFS; swappable to Cloudinary
// by changing storageProvider without touching this model).
// ============================================================

const audioAssetSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewSession",
      required: true,
      index: true,
    },
    storageProvider: {
      type: String,
      enum: ["cloudinary", "gridfs"],
      default: "gridfs",
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
    },
    fileFormat: {
      type: String,
      enum: ["mp3", "wav", "m4a", "aac"],
      required: true,
    },
    fileSizeBytes: {
      type: Number,
      required: true,
    },
    durationSeconds: {
      type: Number,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  defaultSchemaOptions
);

audioAssetSchema.index({ sessionId: 1, uploadedAt: -1 });

const AudioAsset = mongoose.model("AudioAsset", audioAssetSchema);

module.exports = AudioAsset;
