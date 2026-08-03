const mongoose = require("mongoose");
const { defaultSchemaOptions } = require("../../shared/utils/schema.utils");

const editHistorySchema = new mongoose.Schema(
  {
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    editedAt: { type: Date, default: Date.now },
    changeSummary: { type: String, required: true },
    previousStateSnapshot: { type: String, default: "" }, // JSON snapshot string
  },
  { _id: true }
);

const actionPlanMilestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    targetDate: { type: Date },
    isCompleted: { type: Boolean, default: false },
  },
  { _id: true }
);

const actionPlanSchema = new mongoose.Schema(
  {
    shortTermGoals: [{ type: String, trim: true }],
    longTermGoals: [{ type: String, trim: true }],
    milestones: [actionPlanMilestoneSchema],
  },
  { _id: false }
);

const careerMatchSchema = new mongoose.Schema(
  {
    careerTitle: { type: String, required: true, trim: true },
    industry: { type: String, trim: true },
    matchScore: { type: Number, min: 0, max: 100 },
    rationale: { type: String, trim: true },
  },
  { _id: true }
);

const reportSchema = new mongoose.Schema(
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
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CounselingSession",
      index: true,
    },
    title: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    summary: { type: String, required: true },

    // 1. Assessment Results
    includedAssessmentScoreIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "AssessmentScore" },
    ],

    // 2. Interview Insights
    includedInterviewInsightIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "InterviewInsight" },
    ],

    // 3. Recommendations (belonging to this Report)
    includedRecommendationIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Recommendation" },
    ],

    // 4. Career Matches
    careerMatches: [careerMatchSchema],

    // 5. Action Plan
    actionPlan: actionPlanSchema,

    // Immutability & Finalization Controls
    isFinalized: { type: Boolean, default: false, index: true },
    finalizedAt: { type: Date },

    // Versioning Architecture (For future report versions)
    version: { type: Number, default: 1, index: true },
    parentReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
    },

    // Edit History Tracking
    editHistory: [editHistorySchema],

    pdfUrl: { type: String, default: "" },
    publishedAt: { type: Date },
  },
  defaultSchemaOptions
);

// Compound index for student reports lookup
reportSchema.index({ studentId: 1, status: 1 });
reportSchema.index({ parentReportId: 1, version: 1 });

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;
