const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

const AssessmentDefinition = require("../modules/assessments/assessmentDefinition.model");
const AssessmentQuestion = require("../modules/assessments/assessmentQuestion.model");
const assessmentAssignmentService = require("../modules/assessments/assessmentAssignment.service");
const assessmentSessionService = require("../modules/assessments/assessmentSession.service");

async function testOnetFlow() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const studentUser = await db.collection("users").findOne({ email: "pradzzy6969@gmail.com" });
  let counselorUser = await db.collection("users").findOne({ email: "counselor@example.com" });
  if (!counselorUser) {
    const counselorId = studentUser.counselorId || studentUser._id;
    counselorUser = await db.collection("users").findOne({ _id: counselorId }) || { _id: counselorId, role: "counselor" };
  }
  if (!counselorUser.role) counselorUser.role = "counselor";

  const def = await AssessmentDefinition.findOne({ code: "ONET_INTEREST_PROFILER_SHORT" });
  console.log("1. Found O*NET AssessmentDefinition:", def?.title, def?._id);

  const questions = await AssessmentQuestion.find({ assessmentId: def._id }).sort({ questionNumber: 1 });
  console.log("2. Found Questions count:", questions.length);

  // Assign assessment
  const assignment = await assessmentAssignmentService.assignAssessment(
    {
      studentId: studentUser._id,
      counselorId: counselorUser._id,
      assessmentDefinitionId: def._id,
      priority: "normal",
      counselorNotes: "Test O*NET Assignment",
    },
    counselorUser
  );
  console.log("3. Assigned Assessment:", assignment._id, assignment.status);

  // Start Session
  const sessionData = await assessmentSessionService.startOrResumeSession(assignment._id, studentUser);
  const sessionId = sessionData.session._id;
  console.log("4. Started Session:", sessionId);

  // Generate mock answers: Check Social (31-40: 10 items), Enterprising (41-50: 10 items), Conventional (51-60: 10 items)
  // Categories: R (1-10: 3 items), I (11-20: 0 items), A (21-30: 0 items), S (31-40: 10 items), E (41-50: 10 items), C (51-60: 10 items)
  const answersPayload = [];
  for (const q of questions) {
    let checked = false;
    if (q.domain === "S" || q.domain === "E" || q.domain === "C") {
      checked = true; // 10 checkmarks each for S, E, C => Holland Code SEC
    } else if (q.domain === "R" && q.questionNumber <= 3) {
      checked = true; // 3 checkmarks for R
    }
    answersPayload.push({
      questionId: q._id,
      questionNumber: q.questionNumber,
      selectedValue: checked ? 1 : 0,
    });
  }

  console.log("5. Autosaving 60 responses...");
  await assessmentSessionService.autosaveProgress(sessionId, { responses: answersPayload }, studentUser);

  console.log("6. Submitting session to trigger scoring engine...");
  const submitRes = await assessmentSessionService.submitSession(sessionId, studentUser);
  console.log("Submitted Session Result:", submitRes?.status || "SUCCESS");

  // Query Score
  const score = await db.collection("assessmentscores").findOne({ sessionId: sessionId });
  console.log("\n=================================================");
  console.log("   COMPUTED ASSESSMENT SCORE (ONET PROFILER)    ");
  console.log("=================================================");
  console.log("AssessmentKey:", score?.assessmentKey);
  console.log("ScoringStrategy:", score?.scoringStrategy);
  console.log("Holland Code:", score?.hollandCode);
  console.log("Category Scores:", JSON.stringify(score?.categoryScores, null, 2));

  // Test Student Results Endpoint
  console.log("\n=================================================");
  console.log("   STUDENT INSIGHTS (TOP 3 CATEGORIES ONLY)      ");
  console.log("=================================================");
  const studentResults = await assessmentSessionService.getStudentResults("onet-interest-profiler-short", studentUser);
  console.log("Student Assessment Title:", studentResults.assessmentName);
  console.log("Student Holland Code:", studentResults.hollandCode);
  console.log("Student Insights (ONLY top 3 categories):", JSON.stringify(studentResults.insights, null, 2));

  process.exit(0);
}

testOnetFlow().catch((e) => {
  console.error("❌ FAILED ONET TEST:", e);
  process.exit(1);
});
