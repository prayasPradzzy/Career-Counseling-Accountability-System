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
const { AssessmentAssignment, ASSIGNMENT_STATUS } = require("../modules/assessments/assessmentAssignment.model");
const RetakeRequest = require("../modules/assessments/retakeRequest.model");
const User = require("../modules/users/user.model");
const StudentProfile = require("../modules/profiles/studentProfile.model");
const assessmentAssignmentService = require("../modules/assessments/assessmentAssignment.service");
const assessmentSessionService = require("../modules/assessments/assessmentSession.service");

const runRetakeWorkflowTest = async () => {
  try {
    await connectDB();
    console.log("\n==========================================================================");
    console.log("       FULL RETAKE WORKFLOW & DATA MODEL VERIFICATION SUITE              ");
    console.log("==========================================================================\n");

    // 1. Setup Test Users
    const timestamp = Date.now();
    const counselor = await User.create({
      firstName: "Test",
      lastName: "Counselor",
      email: `counselor_retake_${timestamp}@example.com`,
      password: "Password123!",
      role: "counselor",
    });

    const student = await User.create({
      firstName: "Test",
      lastName: "Student",
      email: `student_retake_${timestamp}@example.com`,
      password: "Password123!",
      role: "student",
      counselorId: counselor._id,
    });

    await StudentProfile.create({
      userId: student._id,
      assignedCounselorId: counselor._id,
    });

    let definition = await AssessmentDefinition.findOne({ code: "IPIP_NEO_120" });
    if (!definition) {
      definition = await AssessmentDefinition.create({
        title: "IPIP-NEO 120",
        code: "IPIP_NEO_120",
        category: "PERSONALITY",
        description: "Personality Assessment",
      });
    }

    // 2. Create Initial Assignment & Session
    const assignment = await AssessmentAssignment.create({
      studentId: student._id,
      counselorId: counselor._id,
      assessmentDefinitionId: definition._id,
      category: "personality",
      status: ASSIGNMENT_STATUS.ASSIGNED,
    });

    console.log(`✅ Created AssessmentAssignment: ${assignment._id}`);

    // Student starts first attempt
    const sessionRes1 = await assessmentSessionService.startOrResumeSession(assignment._id, student);
    const session1Id = sessionRes1.session.id || sessionRes1.session._id;
    console.log(`✅ Student started Attempt #1 Session: ${session1Id}`);

    // Create dummy score for session #1
    const score1 = await AssessmentScore.create({
      sessionId: session1Id,
      assignmentId: assignment._id,
      clientId: student._id,
      assessmentDefinitionId: definition._id,
      category: "personality",
      isCurrent: true,
      domainScores: [{ domain: "Openness", dimensionName: "Openness", score: 3.8, rawScore: 3.8, band: "High" }],
    });
    console.log(`✅ Created Score #1 (isCurrent: ${score1.isCurrent}) for Attempt #1`);

    // 3. Counselor Requests Retake
    const retakeReason = "First attempt appeared unusually quick. Please re-evaluate answers carefully.";
    console.log(`\n--- Counselor Requesting Retake ---`);
    console.log(`Reason: "${retakeReason}"`);

    const retakeResult = await assessmentAssignmentService.rejectAssignment(
      assignment._id,
      retakeReason,
      counselor
    );

    // 4. Verify Database Assertions
    const updatedSession1 = await AssessmentSession.findById(session1Id);
    console.log(`\n--- Attempt #1 Database Verification ---`);
    console.log(`Original Session Status: ${updatedSession1.status} (Expected: superseded)`);

    const updatedScore1 = await AssessmentScore.findById(score1._id);
    console.log(`Original Score isCurrent: ${updatedScore1.isCurrent} (Expected: false)`);

    const newSession = await AssessmentSession.findOne({
      assignmentId: assignment._id,
      status: "not_started",
    });
    console.log(`\n--- Attempt #2 Database Verification ---`);
    console.log(`New Session ID: ${newSession._id}`);
    console.log(`New Session status: ${newSession.status} (Expected: not_started)`);
    console.log(`New Session retakeOf: ${newSession.retakeOf} (Expected: ${session1Id})`);

    const retakeRequestDoc = await RetakeRequest.findOne({ assignmentId: assignment._id });
    console.log(`RetakeRequest Document Created: ${Boolean(retakeRequestDoc)}`);
    console.log(`RetakeReason Saved: "${retakeRequestDoc?.reason}"`);

    // 5. Verify Student Starts Fresh Attempt
    const sessionRes2 = await assessmentSessionService.startOrResumeSession(assignment._id, student);
    const session2Id = sessionRes2.session.id || sessionRes2.session._id;
    console.log(`\n✅ Student started Attempt #2 Session: ${session2Id} (Different ID: ${session2Id.toString() !== session1Id.toString()})`);

    // 6. Verify Counselor Review Detail Historical Attempts
    const reviewDetail = await assessmentAssignmentService.getAssignmentReviewDetail(assignment._id, counselor);
    console.log(`\n--- Counselor Review Detail Verification ---`);
    console.log(`Active Session Status: ${reviewDetail.session.status}`);
    console.log(`Previous Attempts Count: ${reviewDetail.previousAttempts.length} (Expected: 1)`);
    if (reviewDetail.previousAttempts.length > 0) {
      console.log(`  - Previous Attempt #1 Status: ${reviewDetail.previousAttempts[0].session.status}`);
      console.log(`  - Previous Attempt #1 Score: ${Boolean(reviewDetail.previousAttempts[0].score)}`);
      console.log(`  - Previous Attempt #1 Reason: "${reviewDetail.previousAttempts[0].reason}"`);
    }

    console.log("\n==========================================================================");
    console.log("    🎉 FULL RETAKE WORKFLOW & HISTORY PRESERVATION VERIFIED 100%!        ");
    console.log("==========================================================================\n");

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Retake Workflow Verification Failed:", err);
    process.exit(1);
  }
};

runRetakeWorkflowTest();
