const mongoose = require("mongoose");
const { defaultSchemaOptions } = require("../../shared/utils/schema.utils");

// ============================================================
// AIRequestLog — Audit Trail for Every AI Service Call
// ============================================================
// Written by aiService.generate() on every invocation so usage,
// latency, and failure modes of AI features are observable
// without instrumenting each feature individually.
// ============================================================

const aiRequestLogSchema = new mongoose.Schema(
  {
    // What kind of feature made the call, e.g. "interview-questions"
    requestType: {
      type: String,
      default: "generic",
      trim: true,
      index: true,
    },

    // Which prompt template was used
    promptKey: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // The interpolated variables sent in (helps reproduce/debug)
    variables: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Final interpolated prompt text
    prompt: {
      type: String,
      default: "",
    },

    // Raw LLM / fallback response text
    response: {
      type: String,
      default: "",
    },

    // Where the response came from: the LLM provider or the
    // deterministic local fallback (no API key configured)
    source: {
      type: String,
      enum: ["llm", "fallback"],
      default: "llm",
    },

    // Model identifier when source is "llm", e.g. "gpt-4o-mini"
    model: {
      type: String,
      default: "",
    },

    // Wall-clock time of the call in ms
    latencyMs: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["success", "error", "fallback_after_error"],
      default: "success",
      index: true,
    },

    // Error message when status !== "success"
    error: {
      type: String,
      default: "",
    },
  },
  defaultSchemaOptions
);

const AIRequestLog = mongoose.model("AIRequestLog", aiRequestLogSchema);

module.exports = AIRequestLog;
