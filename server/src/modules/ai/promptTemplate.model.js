const mongoose = require("mongoose");
const { defaultSchemaOptions } = require("../../shared/utils/schema.utils");

// ============================================================
// PromptTemplate — Central Prompt Registry for AI Features
// ============================================================
// Every AI feature (interview question generation, report
// writing, transcription insight extraction) declares its
// prompts here as versioned, validated templates. Features
// never hardcode prompt strings or call an LLM directly —
// they go through aiService.generate({ promptKey, variables }).
// ============================================================

const promptTemplateSchema = new mongoose.Schema(
  {
    // Machine-readable unique key, e.g. "interview-question-generator-candidate"
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    // The prompt text. Variables use {{doubleBrace}} placeholders.
    template: {
      type: String,
      required: true,
    },

    // The exact set of variable names the template expects.
    // aiService.generate validates incoming variables against this list.
    expectedVariables: {
      type: [String],
      default: [],
    },

    // Soft-disable a template without deleting it
    active: {
      type: Boolean,
      default: true,
    },

    // Human-readable purpose (shown in admin tooling / logs)
    description: {
      type: String,
      default: "",
    },
  },
  defaultSchemaOptions
);

const PromptTemplate = mongoose.model("PromptTemplate", promptTemplateSchema);

module.exports = PromptTemplate;
