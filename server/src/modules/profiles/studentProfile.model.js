const mongoose = require("mongoose");
const { defaultSchemaOptions } = require("../../shared/utils/schema.utils");
const { STUDENT_STATUS } = require("../../shared/constants/studentStatus.constants");

const educationSchema = new mongoose.Schema(
  {
    institution: { type: String, required: true, trim: true },
    degree: { type: String, required: true, trim: true },
    fieldOfStudy: { type: String, required: true, trim: true },
    startYear: { type: Number, min: 1950, max: 2100 },
    endYear: { type: Number, min: 1950, max: 2100 },
    gradeGpa: { type: String, trim: true },
  },
  { _id: true }
);

const academicDocumentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true, trim: true },
    parsedText: { type: String, default: "" },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
      sparse: true,
    },
    invitedFirstName: { type: String, trim: true },
    invitedLastName: { type: String, trim: true },
    invitedEmail: { type: String, trim: true, lowercase: true },

    onboardingSource: {
      type: String,
      enum: ["self-signup", "counselor-invite", "admin-invite"],
      default: "self-signup",
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    invitationToken: {
      type: String,
      index: true,
    },
    invitationExpiresAt: {
      type: Date,
    },

    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: ["male", "female", "non-binary", "prefer-not-to-say"],
      default: "prefer-not-to-say",
    },
    phone: { type: String, trim: true },
    education: [educationSchema],
    careerGoals: [{ type: String, trim: true }],
    targetIndustries: [{ type: String, trim: true }],
    skills: [{ type: String, trim: true }],
    languages: [{ type: String, trim: true }],
    academicDocuments: [academicDocumentSchema],
    assignedCounselorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    guardianInfo: {
      name: { type: String, trim: true },
      relationship: { type: String, trim: true },
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
    consentStatus: {
      isGiven: { type: Boolean, default: false },
      givenAt: { type: Date },
      consentFormUrl: { type: String, default: "" },
      // Separate, explicit consent for recording audio during interview
      // sessions — required before any recording/upload can happen.
      audioRecording: {
        isGiven: { type: Boolean, default: false },
        givenAt: { type: Date },
      },
    },
    status: {
      type: String,
      enum: Object.values(STUDENT_STATUS),
      default: STUDENT_STATUS.REGISTERED,
      index: true,
    },
  },
  { ...defaultSchemaOptions, collection: "studentprofiles" }
);

const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);

module.exports = StudentProfile;
