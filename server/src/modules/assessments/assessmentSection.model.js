const mongoose = require("mongoose");
const { defaultSchemaOptions } = require("../../shared/utils/schema.utils");

// ============================================================
// AssessmentSection — Ordered Question Groups
// ============================================================
// Sections divide an assessment into logical groups.
// For IPIP-120: could be 5 domain sections (one per Big Five).
// For RIASEC: 6 sections (one per Holland type).
// For single-section assessments: one section covering all Qs.
//
// questionStart/questionEnd define the question number range
// belonging to this section, enabling section-based navigation
// and progress tracking.
// ============================================================

const assessmentSectionSchema = new mongoose.Schema(
  {
    // Parent assessment
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentDefinition",
      required: true,
      index: true,
    },

    // Section title (e.g., "Extraversion", "Realistic")
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Optional section-level instructions or description
    description: {
      type: String,
      default: "",
    },

    // Display order (1-indexed)
    order: {
      type: Number,
      required: true,
    },

    // First question number in this section
    questionStart: {
      type: Number,
    },

    // Last question number in this section
    questionEnd: {
      type: Number,
    },
  },
  defaultSchemaOptions
);

// Unique compound index: one order per assessment
assessmentSectionSchema.index({ assessmentId: 1, order: 1 }, { unique: true });

const AssessmentSection = mongoose.model(
  "AssessmentSection",
  assessmentSectionSchema
);

module.exports = AssessmentSection;
