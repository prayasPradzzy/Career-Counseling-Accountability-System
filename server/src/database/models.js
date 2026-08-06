const User = require("../modules/users/user.model");
const StudentProfile = require("../modules/profiles/studentProfile.model");
const AssessmentDefinition = require("../modules/assessments/assessmentDefinition.model");
const AssessmentSession = require("../modules/assessments/assessmentSession.model");
const AssessmentResponse = require("../modules/assessments/assessmentResponse.model");
const AssessmentScore = require("../modules/assessments/assessmentScore.model");
const Interview = require("../modules/interviews/interview.model");
const InterviewInsight = require("../modules/interviews/interviewInsight.model");
const CareerReference = require("../modules/careers/careerReference.model");
const Recommendation = require("../modules/recommendations/recommendation.model");
const Report = require("../modules/reports/report.model");

module.exports = {
  User,
  StudentProfile,
  AssessmentDefinition,
  AssessmentSession,
  AssessmentResponse,
  AssessmentScore,
  Interview,
  InterviewInsight,
  CareerReference,
  Recommendation,
  Report,
};
