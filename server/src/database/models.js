const User = require("../modules/users/user.model");
const StudentProfile = require("../modules/profiles/studentProfile.model");
const AssessmentDefinition = require("../modules/assessments/assessmentDefinition.model");
const AssessmentSession = require("../modules/assessments/assessmentSession.model");
const AssessmentResponse = require("../modules/assessments/assessmentResponse.model");
const AssessmentScore = require("../modules/assessments/assessmentScore.model");
const Interview = require("../modules/interviews/interview.model");
const InterviewInsight = require("../modules/interviews/interviewInsight.model");
const InterviewEngagement = require("../modules/interviews/interviewEngagement.model");
const InterviewSession = require("../modules/interviews/interviewSession.model");
const InterviewQuestionSet = require("../modules/interviews/interviewQuestionSet.model");
const AudioAsset = require("../modules/interviews/audioAsset.model");
const PromptTemplate = require("../modules/ai/promptTemplate.model");
const AIRequestLog = require("../modules/ai/aiRequestLog.model");
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
  InterviewEngagement,
  InterviewSession,
  InterviewQuestionSet,
  AudioAsset,
  PromptTemplate,
  AIRequestLog,
  CareerReference,
  Recommendation,
  Report,
};
