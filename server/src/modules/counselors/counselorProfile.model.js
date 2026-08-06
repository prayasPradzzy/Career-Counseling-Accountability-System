const mongoose = require("mongoose");
const { defaultSchemaOptions } = require("../../shared/utils/schema.utils");

const credentialsSchema = new mongoose.Schema(
  {
    highestQualification: { type: String, trim: true, default: "" },
    institution: { type: String, trim: true, default: "" },
    certifications: [{ type: String, trim: true }],
    licenseNumber: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const practiceSchema = new mongoose.Schema(
  {
    specializations: [{ type: String, trim: true }],
    yearsExperience: { type: Number, min: 0, default: 0 },
    languagesSpoken: [{ type: String, trim: true }],
    bio: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { _id: false }
);

const counselorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    phone: { type: String, trim: true, default: "" },
    gender: {
      type: String,
      enum: ["male", "female", "non-binary", "prefer-not-to-say"],
      default: "prefer-not-to-say",
    },
    credentials: { type: credentialsSchema, default: () => ({}) },
    practice: { type: practiceSchema, default: () => ({}) },
  },
  defaultSchemaOptions
);

const CounselorProfile = mongoose.model("CounselorProfile", counselorProfileSchema);

module.exports = CounselorProfile;
