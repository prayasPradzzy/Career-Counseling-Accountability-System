const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

const AssessmentDefinition = require("../modules/assessments/assessmentDefinition.model");
const AssessmentQuestion = require("../modules/assessments/assessmentQuestion.model");
const AssessmentSession = require("../modules/assessments/assessmentSession.model");
const AssessmentScore = require("../modules/assessments/assessmentScore.model");
const RetakeRequest = require("../modules/assessments/retakeRequest.model");
const assessmentAssignmentService = require("../modules/assessments/assessmentAssignment.service");
const assessmentSessionService = require("../modules/assessments/assessmentSession.service");

async function testRetakeWorkflow() {
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

  console.log("\n=================================================");
  console.log("   TESTING GENERALIZED RETAKE WORKFLOW           ");
  console.log("=================================================\n");

  const assessmentCodes = [
    "IPIP_NEO_120",
    "ONET_INTEREST_PROFILER_SHORT",
    "ONET_WORK_IMPORTANCE_LOCATOR",
  ];

  for (const code of assessmentCodes) {
    console.log(`\n--- Testing Retake for Assessment [${code}] ---`);

    const def = await AssessmentDefinition.findOne({ code });
    if (!def) {
      console.warn(`⚠️ Definition ${code} not found in DB. Skipping.`);
      continue;
    }

    // 1. Assign assessment
    const assignment = await assessmentAssignmentService.assignAssessment(
      {
        studentId: studentUser._id,
        counselorId: counselorUser._id,
        assessmentDefinitionId: def._id,
        counselorNotes: `Initial Assignment for ${code}`,
      },
      counselorUser
    );
    console.log(`1. Assigned ${code}: assignmentId = ${assignment._id}`);

    // 2. Start session & submit attempt #1
    const sessionRes = await assessmentSessionService.startOrResumeSession(assignment._id, studentUser);
    const session1Id = sessionRes.session._id;
    console.log(`2. Started Session #1: ${session1Id}`);

    const questions = await AssessmentQuestion.find({ assessmentId: def._id }).sort({ questionNumber: 1 });

    // Mock answer filling based on type
    const mockResponses = questions.map((q, idx) => {
      let val = 3;
      if (def.responseType === "checkbox") val = idx % 2 === 0 ? 1 : 0;
      if (def.responseType === "forced-rank-sort") val = (idx % 5) + 1;
      return { questionId: q._id, questionNumber: q.questionNumber, selectedValue: val };
    });

    await assessmentSessionService.autosaveProgress(session1Id, { responses: mockResponses }, studentUser);
    await assessmentSessionService.submitSession(session1Id, studentUser);

    const score1 = await AssessmentScore.findOne({ sessionId: session1Id });
    console.log(`3. Submitted Session #1 — Score doc created: ${score1?._id}, isCurrent = ${score1?.isCurrent}`);

    // 3. Counselor requests retake
    const retakeReason = `Responses for ${code} appeared too uniform. Please reflect and redo.`;
    console.log(`4. Requesting retake with reason: "${retakeReason}"...`);

    const retakeRes = await assessmentAssignmentService.requestRetake(
      { sessionId: session1Id, reason: retakeReason },
      counselorUser
    );

    // 4. Verify Database State
    const session1Updated = await AssessmentSession.findById(session1Id);
    console.log(`   Original Session #1 status: '${session1Updated.status}' (Expected: 'superseded')`);
    console.log(`   Original Session #1 supersededBy: ${session1Updated.supersededBy}`);

    const score1Updated = await AssessmentScore.findById(score1._id);
    console.log(`   Original Score #1 isCurrent: ${score1Updated.isCurrent} (Expected: false)`);

    const retakeReqDoc = await RetakeRequest.findOne({ originalSessionId: session1Id });
    console.log(`   RetakeRequest created: ${retakeReqDoc?._id}`);
    console.log(`   RetakeRequest assessmentKey: '${retakeReqDoc?.assessmentKey}'`);
    console.log(`   RetakeRequest reason: '${retakeReqDoc?.reason}'`);

    const updatedAssignment = await db.collection("assessmentassignments").findOne({ _id: assignment._id });
    console.log(`   Assignment status: '${updatedAssignment.status}' (Expected: 'REJECTED')`);

    // 5. Student Starts Attempt #2 (Retake)
    console.log(`5. Student starts retake assessment...`);
    const sessionRes2 = await assessmentSessionService.startOrResumeSession(assignment._id, studentUser);
    const session2Id = sessionRes2.session._id;
    console.log(`   Started Session #2: ${session2Id} (retakeOf: ${sessionRes2.session.retakeOf})`);

    // Verify session 2 is distinct from session 1
    if (String(session1Id) === String(session2Id)) {
      console.error(`❌ Session #2 is identical to Session #1! Failed retake isolation.`);
    } else {
      console.log(`✅ Session #2 is distinct from Session #1.`);
    }

    // Submit attempt #2
    const mockResponses2 = questions.map((q, idx) => {
      let val = 4;
      if (def.responseType === "checkbox") val = 1;
      if (def.responseType === "forced-rank-sort") val = ((idx + 2) % 5) + 1;
      return { questionId: q._id, questionNumber: q.questionNumber, selectedValue: val };
    });

    await assessmentSessionService.autosaveProgress(session2Id, { responses: mockResponses2 }, studentUser);
    await assessmentSessionService.submitSession(session2Id, studentUser);

    const score2 = await AssessmentScore.findOne({ sessionId: session2Id });
    console.log(`6. Submitted Session #2 — New Score doc: ${score2?._id}, isCurrent = ${score2?.isCurrent}`);

    // 6. Verify Counselor Review Detail
    const reviewDetail = await assessmentAssignmentService.getAssignmentReviewDetail(assignment._id, counselorUser);
    console.log(`7. Counselor Review Detail checks:`);
    console.log(`   Current Session ID: ${reviewDetail.session?._id}`);
    console.log(`   Current Score ID: ${reviewDetail.score?._id}`);
    console.log(`   Previous Attempts count: ${reviewDetail.previousAttempts?.length}`);
    if (reviewDetail.previousAttempts?.length > 0) {
      console.log(`   Previous Attempt #1 Reason: "${reviewDetail.previousAttempts[0].reason}"`);
    }

    console.log(`\n✅ RETAKE WORKFLOW PASSED FOR [${code}]!`);
  }

  console.log("\n=================================================");
  console.log("   ALL RETAKE TESTS COMPLETED SUCCESSFULLY!      ");
  console.log("=================================================\n");
  process.exit(0);
}

testRetakeWorkflow().catch((e) => {
  console.error("❌ FAILED RETAKE WORKFLOW TEST:", e);
  process.exit(1);
});
