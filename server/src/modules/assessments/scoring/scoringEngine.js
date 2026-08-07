const AssessmentSession = require("../assessmentSession.model");
const AssessmentDefinition = require("../assessmentDefinition.model");
const AssessmentQuestion = require("../assessmentQuestion.model");
const AssessmentResponse = require("../assessmentResponse.model");
const AssessmentScore = require("../assessmentScore.model");
const scoringRegistry = require("./scoringRegistry");
const ApiError = require("../../../shared/utils/ApiError");

/**
 * ScoringEngine — Main Orchestrator for Assessment Score Calculation
 * Executes data retrieval, resolves scoring strategy via Registry,
 * runs the strategy pipeline, and persists the AssessmentScore document.
 */
class ScoringEngine {
  /**
   * Calculate and persist scores for an assessment session
   * @param {String|ObjectId} sessionId
   * @returns {Object} Saved AssessmentScore document
   */
  async calculateAndSaveScore(sessionId) {
    // 1. Fetch Session
    const session = await AssessmentSession.findById(sessionId);
    if (!session) {
      throw new ApiError(404, "Assessment session not found.");
    }

    // 2. Fetch Definition with Fallback for Stale References
    let definition = await AssessmentDefinition.findById(session.assessmentDefinitionId);
    if (!definition) {
      definition = await AssessmentDefinition.findOne({ code: "IPIP_NEO_120" }) ||
                   await AssessmentDefinition.findOne({}).sort({ createdAt: -1 });
    }
    if (!definition) {
      throw new ApiError(404, "Assessment definition not found.");
    }

    // 3. Fetch Questions with Fallback
    let questions = await AssessmentQuestion.find({
      assessmentId: definition._id,
    }).sort({ questionNumber: 1 });

    if (!questions || questions.length === 0) {
      questions = await AssessmentQuestion.find({}).sort({ questionNumber: 1 });
    }

    if (!questions || questions.length === 0) {
      throw new ApiError(400, "No questions found for this assessment definition.");
    }

    // 4. Fetch Raw Responses
    const responseDoc = await AssessmentResponse.findOne({ sessionId: session._id });
    if (!responseDoc || !responseDoc.responses || responseDoc.responses.length === 0) {
      throw new ApiError(400, "No responses found for this assessment session.");
    }

    // 5. Resolve Scoring Strategy via Registry
    const strategyName = definition.scoringStrategy || (definition.code === "IPIP_NEO_120" ? "ipip_neo_120" : "likert_sum");
    const strategy = scoringRegistry.getStrategy(strategyName);

    // 6. Execute Strategy Pipeline
    const scorePayload = await strategy.calculateScore({
      session,
      definition,
      questions,
      responseDoc,
    });

    // 7. Check for existing score to handle versioning / re-scoring
    let existingScore = await AssessmentScore.findOne({ sessionId: session._id }).sort({ version: -1 });

    let version = 1;
    if (existingScore) {
      version = existingScore.version + 1;
    }

    // 8. Create or Update AssessmentScore document
    const scoreDoc = await AssessmentScore.create({
      sessionId: session._id,
      studentId: session.clientId,
      clientId: session.clientId,
      assessmentDefinitionId: definition._id,
      category: definition.category,
      assessmentKey: scorePayload.assessmentKey || definition.metadata?.assessmentKey || "ipip-neo-120",
      scoringStrategy: scorePayload.scoringStrategy,
      facetScores: scorePayload.facetScores || [],
      domainScores: scorePayload.domainScores || scorePayload.dimensionScores || [],
      dimensionScores: scorePayload.dimensionScores || scorePayload.domainScores || [],
      categoryScores: scorePayload.categoryScores || [],
      hollandCode: scorePayload.hollandCode || "",
      overallCode: scorePayload.overallCode,
      overallScore: scorePayload.overallScore,
      version,
      previousScoreId: existingScore ? existingScore._id : null,
      calculatedAt: new Date(),
      computedAt: new Date(),
      metadata: scorePayload.metadata || {},
    });

    return scoreDoc;
  }
}

module.exports = new ScoringEngine();
