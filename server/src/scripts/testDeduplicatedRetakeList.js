const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

const AssessmentDefinition = require("../modules/assessments/assessmentDefinition.model");
const AssessmentQuestion = require("../modules/assessments/assessmentQuestion.model");
const AssessmentSession = require("../modules/assessments/assessmentSession.model");
const AssessmentScore = require("../modules/assessments/assessmentScore.model");
const User = require("../modules/users/user.model");
const assessmentAssignmentService = require("../modules/assessments/assessmentAssignment.service");
const assessmentSessionService = require("../modules/assessments/assessmentSession.service");

async function testDeduplicatedRetakeList() {
  await mongoose.connect(process.env.MONGODB_URI);

  console.log("\n=================================================");
  console.log("   TESTING DEDUPLICATED RETAKE LIST & STATS      ");
  console.log("=================================================\n");

  const studentUser = await User.findOne({ email: "pradzzy6969@gmail.com" });
  const counselorUser = await User.findOne({ role: "counselor" });

  if (!studentUser || !counselorUser) {
    throw new Error("Student or Counselor user not found in DB.");
  }

  // Set counselor on student
  studentUser.counselorId = counselorUser._id;
  await studentUser.save();

  console.log(`Student ID: ${studentUser._id} (${studentUser.email})`);
  console.log(`Counselor ID: ${counselorUser._id} (${counselorUser.email})`);

  const def = await AssessmentDefinition.findOne({ code: "ONET_WORK_IMPORTANCE_LOCATOR" });
  if (!def) {
    throw new Error("O*NET WIL assessment definition not found.");
  }

  // 1. Assign assessment
  const assignment = await assessmentAssignmentService.assignAssessment(
    {
      studentId: studentUser._id,
      counselorId: counselorUser._id,
      assessmentDefinitionId: def._id,
      counselorNotes: "Single retake test scenario",
    },
    counselorUser
  );
  console.log("1. Created fresh assignment:", assignment._id);

  // 2. Start & complete attempt #1
  const session1Res = await assessmentSessionService.startOrResumeSession(assignment._id, studentUser);
  const session1Id = session1Res.session._id;

  const questions = await AssessmentQuestion.find({ assessmentId: def._id }).sort({ questionNumber: 1 });
  const mockResponses = questions.map((q, idx) => ({
    questionId: q._id,
    questionNumber: q.questionNumber,
    selectedValue: (idx % 5) + 1,
  }));

  await assessmentSessionService.autosaveProgress(session1Id, { responses: mockResponses }, studentUser);
  await assessmentSessionService.submitSession(session1Id, studentUser);
  console.log("2. Completed Attempt #1 session:", session1Id);

  const getDocId = (val) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (val._id) return val._id.toString();
    if (val.id) return val.id.toString();
    return "";
  };

  // Check counselor assignments list before retake
  const listBefore = await assessmentAssignmentService.getCounselorAssignments(counselorUser, {});
  console.log("listBefore items count:", listBefore.length);
  for (const item of listBefore) {
    console.log("Item:", {
      studentId: getDocId(item.studentId),
      defId: getDocId(item.assessmentDefinitionId),
      defCode: item.assessmentDefinitionId?.code,
      status: item.status,
    });
  }

  const wilItemBefore = listBefore.find(
    (a) =>
      getDocId(a.studentId) === studentUser._id.toString() &&
      getDocId(a.assessmentDefinitionId) === def._id.toString()
  );

  console.log("Target studentId:", studentUser._id.toString());
  console.log("Target defId:", def._id.toString());
  console.log("3. Main list status BEFORE retake:", wilItemBefore?.status, "(Expected: COMPLETED)");

  // 3. Request Retake
  console.log("4. Requesting retake...");
  await assessmentAssignmentService.requestRetake(
    { assignmentId: assignment._id, reason: "Inconsistent responses, please redo." },
    counselorUser
  );

  // 4. Check main list IMMEDIATELY AFTER RETAKE REQUEST
  const listAfter = await assessmentAssignmentService.getCounselorAssignments(counselorUser, {});
  const matchingItemsAfter = listAfter.filter(
    (a) =>
      getDocId(a.studentId) === studentUser._id.toString() &&
      getDocId(a.assessmentDefinitionId) === def._id.toString()
  );

  console.log(`5. Matching rows for student+assessment in main list: ${matchingItemsAfter.length} (Expected: 1)`);
  if (matchingItemsAfter.length !== 1) {
    console.error("❌ Duplicate rows detected in main list!");
  } else {
    console.log("✅ Main list deduplication PASSED: Exactly 1 row for student+assessment.");
  }

  const wilItemAfter = matchingItemsAfter[0];
  console.log(`   Effective status after retake request: '${wilItemAfter?.status}' (Expected: 'ASSIGNED' / Not Started)`);

  if (wilItemAfter?.status === "ASSIGNED") {
    console.log("✅ Status resolution PASSED: Retake session shows as 'ASSIGNED' (Not Started).");
  } else {
    console.error(`❌ Unexpected status: ${wilItemAfter?.status}`);
  }

  // Verify Stat Card Totals
  const notStarted = listAfter.filter((a) => a.status === "ASSIGNED" || a.status === "SCHEDULED").length;
  const inProgress = listAfter.filter((a) => a.status === "IN_PROGRESS").length;
  const completed = listAfter.filter(
    (a) => a.status === "COMPLETED" || a.status === "UNDER_REVIEW" || a.status === "APPROVED"
  ).length;

  console.log("\n📊 Stat Card Recomputation:");
  console.log(`   Not Started: ${notStarted}`);
  console.log(`   In Progress: ${inProgress}`);
  console.log(`   Completed:   ${completed}`);

  if (notStarted > 0) {
    console.log("✅ Stat Card Recomputation PASSED: Not Started count is non-zero.");
  } else {
    console.error("❌ Stat Card Not Started count is 0.");
  }

  console.log("\n=================================================");
  console.log("   DEDUPLICATION & STATS TEST COMPLETE!         ");
  console.log("=================================================\n");
  process.exit(0);
}

testDeduplicatedRetakeList().catch((e) => {
  console.error("❌ Diagnostic error:", e);
  process.exit(1);
});
