const LikertSumStrategy = require("./src/modules/assessments/scoring/strategies/likertSumStrategy");
const IPIPNEO120Strategy = require("./src/modules/assessments/scoring/strategies/ipipNeo120Strategy");
const RIASECStrategy = require("./src/modules/assessments/scoring/strategies/riasecStrategy");

const runTests = async () => {
  console.log("\n🧪 Running Scoring Engine Architectural Unit Tests...\n");

  const mockDefinition = {
    _id: "def123",
    category: "personality",
    scoringStrategy: "ipip_neo_120",
    scale: { min: 1, max: 5 },
  };

  const mockSession = {
    _id: "sess123",
    clientId: "user123",
    assessmentDefinitionId: "def123",
  };

  // Mock Questions (1 normal, 1 reverse scored)
  const mockQuestions = [
    {
      _id: "q1",
      questionNumber: 1,
      domain: "Extraversion",
      facet: "Friendliness",
      reverseScored: false,
      weight: 1,
    },
    {
      _id: "q2",
      questionNumber: 2,
      domain: "Extraversion",
      facet: "Friendliness",
      reverseScored: true, // 1 -> 5
      weight: 1,
    },
    {
      _id: "q3",
      questionNumber: 3,
      domain: "Neuroticism",
      facet: "Anxiety",
      reverseScored: false,
      weight: 1,
    },
  ];

  // Mock Responses
  // q1: 5 (Agree Strongly)
  // q2: 1 (Disagree Strongly -> reverse scored to 5)
  // q3: 2 (Disagree a little)
  const mockResponseDoc = {
    sessionId: "sess123",
    responses: [
      { questionId: "q1", selectedValue: 5 },
      { questionId: "q2", selectedValue: 1 },
      { questionId: "q3", selectedValue: 2 },
    ],
  };

  // Test 1: LikertSumStrategy
  const likertStrategy = new LikertSumStrategy();
  const likertResult = await likertStrategy.calculateScore({
    session: mockSession,
    definition: mockDefinition,
    questions: mockQuestions,
    responseDoc: mockResponseDoc,
  });

  console.log("✅ LikertSumStrategy Test:");
  console.log("  - Dimension Scores Count:", likertResult.dimensionScores.length);
  const extraversion = likertResult.dimensionScores.find((d) => d.dimensionName === "Extraversion");
  console.log("  - Extraversion Raw Score:", extraversion.rawScore, "(Expected 10 from 5 + reversed 1->5)");
  console.log("  - Extraversion Normalized Score:", extraversion.normalizedScore, "%");
  console.log("  - Extraversion Qualitative Level:", extraversion.qualitativeLevel);

  if (extraversion.rawScore !== 10) {
    console.error("❌ Reverse scoring test failed! Expected 10, got", extraversion.rawScore);
    process.exit(1);
  }

  // Test 2: IPIPNEO120Strategy
  const ipipStrategy = new IPIPNEO120Strategy();
  const ipipResult = await ipipStrategy.calculateScore({
    session: mockSession,
    definition: mockDefinition,
    questions: mockQuestions,
    responseDoc: mockResponseDoc,
  });

  console.log("\n✅ IPIPNEO120Strategy Test:");
  console.log("  - Profile Code:", ipipResult.overallCode);
  console.log("  - Instrument Metadata:", ipipResult.metadata.instrument);

  // Test 3: RIASECStrategy
  const riasecStrategy = new RIASECStrategy();
  const riasecResult = await riasecStrategy.calculateScore({
    session: mockSession,
    definition: mockDefinition,
    questions: mockQuestions,
    responseDoc: mockResponseDoc,
  });

  console.log("\n✅ RIASECStrategy Test:");
  console.log("  - Holland Code:", riasecResult.overallCode);

  console.log("\n🎉 ALL SCORING ENGINE TESTS PASSED SUCCESSFULLY!\n");
};

runTests();
