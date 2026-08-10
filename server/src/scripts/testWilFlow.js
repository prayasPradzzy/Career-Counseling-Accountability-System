const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

const AssessmentDefinition = require("../modules/assessments/assessmentDefinition.model");
const AssessmentQuestion = require("../modules/assessments/assessmentQuestion.model");
const assessmentAssignmentService = require("../modules/assessments/assessmentAssignment.service");
const assessmentSessionService = require("../modules/assessments/assessmentSession.service");

async function testWilFlow() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const studentUser = await db.collection("users").findOne({ email: "pradzzy6969@gmail.com" });
  let counselorUser = await db.collection("users").findOne({ email: "counselor@example.com" });
  if (!counselorUser) {
    const counselorId = studentUser.counselorId || studentUser._id;
    counselorUser = (await db.collection("users").findOne({ _id: counselorId })) || {
      _id: counselorId,
      role: "counselor",
    };
  }
  if (!counselorUser.role) counselorUser.role = "counselor";

  const def = await AssessmentDefinition.findOne({ code: "ONET_WORK_IMPORTANCE_LOCATOR" });
  console.log("1. Found O*NET WIL AssessmentDefinition:", def?.title, def?._id);

  if (!def) {
    throw new Error("O*NET WIL definition not found. Did you run the seeder?");
  }

  const questions = await AssessmentQuestion.find({ assessmentId: def._id }).sort({ questionNumber: 1 });
  console.log("2. Found Questions count:", questions.length);

  // Assign assessment
  const assignment = await assessmentAssignmentService.assignAssessment(
    {
      studentId: studentUser._id,
      counselorId: counselorUser._id,
      assessmentDefinitionId: def._id,
      counselorNotes: "Test WIL Assignment",
    },
    counselorUser
  );
  console.log("3. Assigned WIL Assessment:", assignment._id, assignment.status);

  // Start Session
  const sessionData = await assessmentSessionService.startOrResumeSession(assignment._id, studentUser);
  const sessionId = sessionData.session._id;
  console.log("4. Started WIL Session:", sessionId);

  // Generate mock answers according to forced-rank rules:
  // Exactly 4 items rated 5, 4 items rated 4, 4 items rated 3, 4 items rated 2, 4 items rated 1.
  // Rate Achievement cards (A: Q1, F: Q6) as 5 => expected score 2 * 5 * 3 = 30 (MAX!)
  // Rate Independence cards (I: Q9, M: Q13) as 5 => expected score 2 * 5 * 2 + 1 * 4 * 2 = 28
  const ratings = [
    5, // Q1 (A - Achievement)
    1, // Q2 (B - Support)
    1, // Q3 (C - Working Conditions)
    4, // Q4 (D - Recognition)
    4, // Q5 (E - Recognition)
    5, // Q6 (F - Achievement)
    1, // Q7 (G - Working Conditions)
    3, // Q8 (H - Relationships)
    5, // Q9 (I - Independence)
    1, // Q10 (J - Working Conditions)
    3, // Q11 (K - Relationships)
    4, // Q12 (L - Recognition)
    5, // Q13 (M - Independence)
    2, // Q14 (N - Working Conditions)
    3, // Q15 (O - Relationships)
    2, // Q16 (P - Support)
    2, // Q17 (Q - Support)
    2, // Q18 (R - Working Conditions)
    3, // Q19 (S - Working Conditions)
    4, // Q20 (T - Independence)
  ];

  const answersPayload = questions.map((q, idx) => ({
    questionId: q._id,
    questionNumber: q.questionNumber,
    selectedValue: ratings[idx],
  }));

  console.log("5. Autosaving 20 forced-rank card responses...");
  await assessmentSessionService.autosaveProgress(sessionId, { responses: answersPayload }, studentUser);

  console.log("6. Submitting session to trigger WIL scoring engine...");
  const submitRes = await assessmentSessionService.submitSession(sessionId, studentUser);
  console.log("Submitted Session Result:", submitRes?.status || "SUCCESS");

  // Query Score
  const score = await db.collection("assessmentscores").findOne({ sessionId: sessionId });
  console.log("\n=================================================");
  console.log("   COMPUTED ASSESSMENT SCORE (O*NET WIL)        ");
  console.log("=================================================");
  console.log("AssessmentKey:", score?.assessmentKey);
  console.log("ScoringStrategy:", score?.scoringStrategy);
  console.log("Overall Code (Top 2 Work Values):", score?.overallCode);
  console.log("Top Work Values array:", score?.topWorkValues);
  console.log("Work Value Scores:", JSON.stringify(score?.workValueScores, null, 2));

  // Verify Spot-Check: Achievement should be 30
  const achievementScore = score?.workValueScores?.find((w) => w.code === "achievement");
  console.log("\n🎯 Spot Check - Achievement Weighted Score:", achievementScore?.weightedScore, "(Expected: 30)");
  if (achievementScore?.weightedScore !== 30) {
    console.error("❌ Spot check failed for Achievement score!");
  } else {
    console.log("✅ Spot check PASSED! Achievement score is exactly 30.");
  }

  // Test Student Results Endpoint
  console.log("\n=================================================");
  console.log("   STUDENT INSIGHTS (TOP 2 WORK VALUES ONLY)    ");
  console.log("=================================================");
  const studentResults = await assessmentSessionService.getStudentResults(
    "onet-work-importance-locator",
    studentUser
  );
  console.log("Student Assessment Name:", studentResults.assessmentName);
  console.log("Top Work Values:", studentResults.topWorkValues);
  console.log("Student Insights (ONLY top 2 values):", JSON.stringify(studentResults.insights, null, 2));

  process.exit(0);
}

testWilFlow().catch((e) => {
  console.error("❌ FAILED WIL TEST:", e);
  process.exit(1);
});
