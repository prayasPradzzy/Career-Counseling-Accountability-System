const mongoose = require("mongoose");
const { defaultSchemaOptions } = require("../../shared/utils/schema.utils");

const salaryRangeSchema = new mongoose.Schema(
  {
    entryLevel: { type: Number, default: 0 },
    median: { type: Number, default: 0 },
    senior: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
  },
  { _id: false }
);

const careerReferenceSchema = new mongoose.Schema(
  {
    onetCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    }, // O*NET standardized code
    title: { type: String, required: true, trim: true, index: true },
    industry: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true },
    requiredEducation: { type: String, required: true },
    averageSalary: salaryRangeSchema,
    projectedGrowthRate: { type: Number, default: 0 }, // Percentage growth rate
    keySkills: [{ type: String, trim: true, index: true }],
    matchingRiasecCodes: [{ type: String, uppercase: true, trim: true }], // e.g., ["I", "A", "R"]
    matchingPersonalityTypes: [{ type: String, uppercase: true, trim: true }], // e.g., ["INTJ", "ENTP"]
    isActive: { type: Boolean, default: true, index: true },
  },
  defaultSchemaOptions
);

// Text Index for career database keyword search
careerReferenceSchema.index({ title: "text", description: "text", keySkills: "text" });

const CareerReference = mongoose.model(
  "CareerReference",
  careerReferenceSchema
);

module.exports = CareerReference;
