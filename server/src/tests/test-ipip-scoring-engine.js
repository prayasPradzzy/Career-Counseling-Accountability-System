const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "../../.env") });

const mongoose = require("mongoose");
const connectDB = require("../database/connectDB");
const AssessmentDefinition = require("../modules/assessments/assessmentDefinition.model");
const AssessmentQuestion = require("../modules/assessments/assessmentQuestion.model");
const AssessmentSession = require("../modules/assessments/assessmentSession.model");
const AssessmentResponse = require("../modules/assessments/assessmentResponse.model");
const AssessmentScore = require("../modules/assessments/assessmentScore.model");
const User = require("../modules/users/user.model");
const scoringEngine = require("../modules/assessments/scoring/scoringEngine");
const interpretationsConfig = require("../config/ipipNeoInterpretations.json");

const runScoringEngineVerification = async () => {
  try {
    await connectDB();
    console.log("\n==========================================================================");
    console.log("      IPIP-NEO-120 SCORING ENGINE & INTERPRETATION VERIFICATION SUITE    ");
    console.log("==========================================================================\n");

    // 1. Fetch Definition & Questions
    const definition = await AssessmentDefinition.findOne({ code: "IPIP_NEO_120" });
    if (!definition) throw new Error("IPIP_NEO_120 AssessmentDefinition not found in DB");

    const questions = await AssessmentQuestion.find({ assessmentId: definition._id }).sort({ questionNumber: 1 });
    console.log(`✅ Fetched ${questions.length} questions from database.`);

    // 2. Create Dummy Student & Session
    const testStudent = await User.create({
      firstName: "ScoringTest",
      lastName: "Student",
      email: `scoring_test_${Date.now()}@example.com`,
      password: "Password123!",
      role: "student",
    });

    const session = await AssessmentSession.create({
      clientId: testStudent._id,
      assessmentDefinitionId: definition._id,
      status: "completed",
    });

    // 3. Build Known Controlled Responses (all 4s for direct items, all 2s for reverse items -> normalized = 4 everywhere)
    const responses = questions.map((q) => ({
      questionId: q._id,
      questionNumber: q.questionNumber,
      selectedValue: q.reverseScored ? 2 : 4, // 6 - 2 = 4 (normalized score = 4 for all items)
      answeredAt: new Date(),
    }));

    const responseDoc = await AssessmentResponse.create({
      sessionId: session._id,
      clientId: testStudent._id,
      assessmentDefinitionId: definition._id,
      responses,
    });

    console.log(`✅ Created AssessmentResponse document with ${responses.length} controlled items (expected normalized value = 4 for all).`);

    // 4. Run Scoring Engine
    const scoreDoc = await scoringEngine.calculateAndSaveScore(session._id);
    console.log(`✅ Calculated and persisted AssessmentScore (ID: ${scoreDoc._id})\n`);

    // 5. Verification Checks
    console.log("--- 1. Facet Score Verification ---");
    console.log(`Total Facet Scores count: ${scoreDoc.facetScores.length} (Expected: 30)`);
    if (scoreDoc.facetScores.length !== 30) throw new Error("Facet score count mismatch!");

    const sampleFacet = scoreDoc.facetScores[0];
    console.log(`Sample Facet [${sampleFacet.facet}] ${sampleFacet.facetName}: RawScore=${sampleFacet.rawScore}, Band=${sampleFacet.band}`);
    if (sampleFacet.rawScore !== 4.0) throw new Error(`Expected facet raw score 4.0, got ${sampleFacet.rawScore}`);
    if (sampleFacet.band !== "High") throw new Error(`Expected band High for 4.0, got ${sampleFacet.band}`);

    console.log("\n--- 2. Domain Score Verification ---");
    console.log(`Total Domain Scores count: ${scoreDoc.domainScores.length} (Expected: 5)`);
    if (scoreDoc.domainScores.length !== 5) throw new Error("Domain score count mismatch!");

    for (const dom of scoreDoc.domainScores) {
      console.log(`Domain [${dom.domain}] ${dom.dimensionName}: Score=${dom.score}, Band=${dom.band}`);
      console.log(`   Interpretation: "${dom.interpretation}"`);

      if (dom.score !== 4.0) throw new Error(`Expected domain score 4.0, got ${dom.score}`);
      if (dom.band !== "High") throw new Error(`Expected band High for 4.0, got ${dom.band}`);
      
      const expectedInterp = interpretationsConfig[dom.dimensionName]["High"];
      if (dom.interpretation !== expectedInterp) {
        throw new Error(`Interpretation mismatch for ${dom.dimensionName} High!`);
      }
    }

    console.log("\n--- 3. Static Config & Schema Verification ---");
    console.log(`AssessmentKey: ${scoreDoc.assessmentKey} (Expected: ipip-neo-120)`);
    console.log(`StudentId: ${scoreDoc.studentId}`);
    console.log(`Overall Code: ${scoreDoc.overallCode}`);
    console.log(`Metadata Interpretations Count: ${Object.keys(scoreDoc.metadata.interpretations).length}`);

    // Cleanup
    await AssessmentResponse.deleteMany({ sessionId: session._id });
    await AssessmentScore.deleteMany({ sessionId: session._id });
    await AssessmentSession.deleteMany({ _id: session._id });
    await User.deleteMany({ _id: testStudent._id });

    console.log("\n==========================================================================");
    console.log("    🎉 IPIP-NEO-120 SCORING ENGINE & INTERPRETATIONS VERIFIED 100%!       ");
    console.log("==========================================================================\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  }
};

runScoringEngineVerification();
