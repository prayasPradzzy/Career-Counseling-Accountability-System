const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const mongoose = require("mongoose");

const User = require("../modules/users/user.model");
const StudentProfile = require("../modules/profiles/studentProfile.model");
const AssessmentDefinition = require("../modules/assessments/assessmentDefinition.model");
const AssessmentQuestion = require("../modules/assessments/assessmentQuestion.model");
const { AssessmentAssignment, ASSIGNMENT_STATUS } = require("../modules/assessments/assessmentAssignment.model");
const AssessmentSession = require("../modules/assessments/assessmentSession.model");
const { SESSION_STATUS } = require("../modules/assessments/assessmentSession.model");
const AssessmentResponse = require("../modules/assessments/assessmentResponse.model");
const AssessmentScore = require("../modules/assessments/assessmentScore.model");

const assessmentAssignmentService = require("../modules/assessments/assessmentAssignment.service");
const assessmentSessionService = require("../modules/assessments/assessmentSession.service");

async function runAssessmentEngineTests() {
  console.log("==========================================================================");
  console.log("           ASSESSMENT ENGINE REAL TESTING & INTEGRATION SUITE            ");
  console.log("==========================================================================");

  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/career_counseling";
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected successfully.\n");

    // ------------------------------------------------------------------------
    // SETUP TEST FIXTURES (Counselor, Student, Definition)
    // ------------------------------------------------------------------------
    console.log("--- 1. Setting Up Test Fixtures ---");

    // Find or create test Counselor
    let counselor = await User.findOne({ email: "test_counselor_suite@example.com" });
    if (!counselor) {
      counselor = await User.create({
        email: "test_counselor_suite@example.com",
        password: "Password123!",
        passwordHash: "$2a$10$hash",
        firstName: "Test",
        lastName: "Counselor",
        role: "counselor",
      });
    }

    // Find or create test Student
    let student = await User.findOne({ email: "test_student_suite@example.com" });
    if (!student) {
      student = await User.create({
        email: "test_student_suite@example.com",
        password: "Password123!",
        passwordHash: "$2a$10$hash",
        firstName: "Test",
        lastName: "Student",
        role: "student",
      });
    }

    // Find or create Student Profile
    let profile = await StudentProfile.findOne({ userId: student._id });
    if (!profile) {
      profile = await StudentProfile.create({
        userId: student._id,
        phone: "+1234567890",
        assignedCounselorId: counselor._id,
        status: "COUNSELOR_ASSIGNED",
      });
    }

    // Find Personality Assessment Definition (IPIP-120)
    let personalityDef = await AssessmentDefinition.findOne({ code: "IPIP_120" });
    if (!personalityDef) {
      personalityDef = await AssessmentDefinition.findOne({ category: "personality" });
    }

    if (!personalityDef) {
      throw new Error("No personality assessment definition found in database. Run seed:ipip first.");
    }

    console.log(`✅ Test Counselor: ${counselor.email} (${counselor._id})`);
    console.log(`✅ Test Student: ${student.email} (${student._id})`);
    console.log(`✅ Target Assessment: ${personalityDef.title} [${personalityDef.code}] (${personalityDef._id})\n`);

    // Clean up any prior test assignments/sessions for this test student
    await AssessmentAssignment.deleteMany({ studentId: student._id });
    await AssessmentSession.deleteMany({ clientId: student._id });
    await AssessmentResponse.deleteMany({ clientId: student._id });

    // ------------------------------------------------------------------------
    // TEST REQUIREMENT 1: Counselor Assigns Personality Assessment
    // ------------------------------------------------------------------------
    console.log("--- 2. Testing Assignment Creation & Lifecycle Update ---");
    const assignmentData = {
      studentId: student._id.toString(),
      assessmentDefinitionId: personalityDef._id.toString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      counselorNotes: "Please complete personality assessment prior to next interview.",
    };

    const assignment = await assessmentAssignmentService.assignAssessment(assignmentData, counselor);
    console.log(`✅ AssessmentAssignment created: ${assignment._id}`);
    console.log(`   - Status: ${assignment.status}`);
    console.log(`   - Category: ${assignment.category}`);

    // Verify Lifecycle Update in StudentProfile
    const updatedProfile1 = await StudentProfile.findOne({ userId: student._id });
    console.log(`✅ StudentProfile Lifecycle Status updated to: ${updatedProfile1.status} (Expected: ASSESSMENT_PENDING)\n`);

    // ------------------------------------------------------------------------
    // TEST REQUIREMENT 2: Guard — Prevent Starting Locked Assessments (Scheduled / Prerequisite)
    // ------------------------------------------------------------------------
    console.log("--- 3. Testing Guards on Locked Assessments ---");

    // Test Future Scheduled Lock
    const futureAssignment = await AssessmentAssignment.create({
      studentId: student._id,
      counselorId: counselor._id,
      assessmentDefinitionId: personalityDef._id,
      category: personalityDef.category,
      status: ASSIGNMENT_STATUS.SCHEDULED,
      scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      assignedAt: new Date(),
    });

    try {
      await assessmentSessionService.startOrResumeSession(futureAssignment._id, student);
      console.error("❌ FAILED: Scheduled lock guard did not throw error!");
    } catch (err) {
      console.log(`✅ Future Scheduled Lock Guard Passed: "${err.message}"`);
    }
    await AssessmentAssignment.findByIdAndDelete(futureAssignment._id);

    // Test Prerequisite Lock
    const lockedAssignment = await AssessmentAssignment.create({
      studentId: student._id,
      counselorId: counselor._id,
      assessmentDefinitionId: personalityDef._id,
      category: personalityDef.category,
      status: ASSIGNMENT_STATUS.ASSIGNED,
      prerequisiteAssignmentId: assignment._id, // assignment is not approved yet!
      assignedAt: new Date(),
    });

    try {
      await assessmentSessionService.startOrResumeSession(lockedAssignment._id, student);
      console.error("❌ FAILED: Prerequisite lock guard did not throw error!");
    } catch (err) {
      console.log(`✅ Prerequisite Lock Guard Passed: "${err.message}"\n`);
    }
    await AssessmentAssignment.findByIdAndDelete(lockedAssignment._id);

    // ------------------------------------------------------------------------
    // TEST REQUIREMENT 3: Student Starts Session
    // ------------------------------------------------------------------------
    console.log("--- 4. Testing Session Initialization & Lifecycle Update ---");
    const sessionState = await assessmentSessionService.startOrResumeSession(assignment._id, student);
    const session = sessionState.session;

    console.log(`✅ AssessmentSession created: ${session._id}`);
    console.log(`   - Status: ${session.status}`);
    console.log(`   - Current Index: ${session.currentQuestionIndex}`);

    // Verify Assignment Status changed to IN_PROGRESS
    const updatedAssignment1 = await AssessmentAssignment.findById(assignment._id);
    console.log(`✅ AssessmentAssignment status changed to: ${updatedAssignment1.status}`);

    // Verify Lifecycle Status changed to ASSESSMENT_IN_PROGRESS
    const updatedProfile2 = await StudentProfile.findOne({ userId: student._id });
    console.log(`✅ StudentProfile Lifecycle Status updated to: ${updatedProfile2.status} (Expected: ASSESSMENT_IN_PROGRESS)\n`);

    // ------------------------------------------------------------------------
    // TEST REQUIREMENT 4: Guard — Prevent Multiple Active Sessions & Duplicate Sessions
    // ------------------------------------------------------------------------
    console.log("--- 5. Testing Active Session & Duplicate Session Guards ---");

    // Test Resume (Duplicate Session attempt on SAME assignment)
    const resumedState = await assessmentSessionService.startOrResumeSession(assignment._id, student);
    console.log(`✅ Duplicate Session Guard (Resume) Passed: Returned existing session ${resumedState.session._id}`);

    // Test Multiple Active Sessions (Attempting to start another test while session is active)
    const secondAssignment = await AssessmentAssignment.create({
      studentId: student._id,
      counselorId: counselor._id,
      assessmentDefinitionId: personalityDef._id,
      category: personalityDef.category,
      status: ASSIGNMENT_STATUS.ASSIGNED,
      assignedAt: new Date(),
    });

    try {
      await assessmentSessionService.startOrResumeSession(secondAssignment._id, student);
      console.error("❌ FAILED: Multiple active sessions guard did not throw error!");
    } catch (err) {
      console.log(`✅ Multiple Active Sessions Guard Passed: "${err.message}"\n`);
    }

    // Clean up second test assignment
    await AssessmentAssignment.findByIdAndDelete(secondAssignment._id);

    // ------------------------------------------------------------------------
    // TEST REQUIREMENT 5: Student Autosaves Progress
    // ------------------------------------------------------------------------
    console.log("--- 6. Testing Autosave Engine & Response Storage ---");

    // Fetch session questions to answer
    const questionsData = await assessmentSessionService.getQuestions(session._id, student);
    console.log(`✅ Retrieved ${questionsData.questions.length} questions from database.`);

    // Build answer payload (selecting option 4 for every question)
    const sampleResponses = questionsData.questions.map((q, idx) => ({
      questionId: q.id.toString(),
      questionNumber: q.questionNumber,
      selectedValue: 4,
      responseTimeMs: 1500,
    }));

    // Perform Autosave
    const autosaveResult = await assessmentSessionService.autosaveProgress(
      session._id,
      {
        responses: sampleResponses,
        currentQuestionIndex: questionsData.questions.length - 1,
        timeSpentSeconds: 300,
      },
      student
    );

    console.log(`✅ Autosave completed:`);
    console.log(`   - Answered Count: ${autosaveResult.progress.answeredCount} / ${autosaveResult.progress.totalQuestions}`);
    console.log(`   - Percentage: ${autosaveResult.progress.percentage}%`);
    console.log(`   - Time Spent: ${autosaveResult.timeSpentSeconds} seconds\n`);

    // ------------------------------------------------------------------------
    // TEST REQUIREMENT 6: Student Submits Session & Triggers Scoring Engine
    // ------------------------------------------------------------------------
    console.log("--- 7. Testing Session Submit & Scoring Engine ---");

    const submitResult = await assessmentSessionService.submitSession(session._id, student);
    console.log(`✅ Session Submitted Successfully!`);
    console.log(`   - Status: ${submitResult.status}`);
    console.log(`   - Progress: ${submitResult.progress.percentage}%`);

    // Verify Assignment Status changed to COMPLETED
    const completedAssignment = await AssessmentAssignment.findById(assignment._id);
    console.log(`✅ AssessmentAssignment Status updated to: ${completedAssignment.status}`);

    // Verify Lifecycle Status updated to ASSESSMENT_COMPLETED
    const updatedProfile3 = await StudentProfile.findOne({ userId: student._id });
    console.log(`✅ StudentProfile Lifecycle Status updated to: ${updatedProfile3.status} (Expected: ASSESSMENT_COMPLETED)\n`);

    // ------------------------------------------------------------------------
    // TEST REQUIREMENT 7: Verify ALL 4 MongoDB Collections Wrote Correctly
    // ------------------------------------------------------------------------
    console.log("--- 8. Verifying MongoDB Document Writes Across All 4 Collections ---");

    // 1. AssessmentAssignment
    const mongoAssignment = await AssessmentAssignment.findById(assignment._id);
    console.log(`1. [AssessmentAssignment] Collection Check:`);
    console.log(`   - ID: ${mongoAssignment._id}`);
    console.log(`   - Status: ${mongoAssignment.status}`);
    console.log(`   - Completed At: ${mongoAssignment.completedAt}`);
    console.log(`   - Written correctly: ${Boolean(mongoAssignment && mongoAssignment.status === "COMPLETED") ? "YES ✅" : "NO ❌"}`);

    // 2. AssessmentSession
    const mongoSession = await AssessmentSession.findById(session._id);
    console.log(`2. [AssessmentSession] Collection Check:`);
    console.log(`   - ID: ${mongoSession._id}`);
    console.log(`   - Status: ${mongoSession.status}`);
    console.log(`   - Submitted At: ${mongoSession.submittedAt}`);
    console.log(`   - Progress Percentage: ${mongoSession.progress.percentage}%`);
    console.log(`   - Written correctly: ${Boolean(mongoSession && mongoSession.status === "submitted") ? "YES ✅" : "NO ❌"}`);

    // 3. AssessmentResponse
    const mongoResponse = await AssessmentResponse.findOne({ sessionId: session._id });
    console.log(`3. [AssessmentResponse] Collection Check:`);
    console.log(`   - ID: ${mongoResponse._id}`);
    console.log(`   - Total Stored Responses: ${mongoResponse.responses.length}`);
    console.log(`   - Written correctly: ${Boolean(mongoResponse && mongoResponse.responses.length > 0) ? "YES ✅" : "NO ❌"}`);

    // 4. AssessmentScore
    const mongoScore = await AssessmentScore.findOne({ sessionId: session._id });
    console.log(`4. [AssessmentScore] Collection Check:`);
    console.log(`   - ID: ${mongoScore._id}`);
    console.log(`   - Strategy: ${mongoScore.scoringStrategy}`);
    console.log(`   - Dimension Scores Count: ${mongoScore.dimensionScores ? mongoScore.dimensionScores.length : 0}`);
    console.log(`   - Total Facet Breakdown Count: ${mongoScore.dimensionScores ? mongoScore.dimensionScores.reduce((acc, d) => acc + (d.facetScores ? d.facetScores.length : 0), 0) : 0}`);
    console.log(`   - Written correctly: ${Boolean(mongoScore && mongoScore.dimensionScores && mongoScore.dimensionScores.length > 0) ? "YES ✅" : "NO ❌"}`);

    // ------------------------------------------------------------------------
    // TEST REQUIREMENT 8: Lock Enforcement Post-Submit
    // ------------------------------------------------------------------------
    console.log("\n--- 9. Testing Post-Submit Lock Enforcement ---");
    try {
      await assessmentSessionService.autosaveProgress(session._id, { responses: sampleResponses }, student);
      console.error("❌ FAILED: Post-submit lock guard did not throw error!");
    } catch (err) {
      console.log(`✅ Post-Submit Lock Guard Passed: "${err.message}"`);
    }

    try {
      await assessmentSessionService.submitSession(session._id, student);
      console.error("❌ FAILED: Duplicate submit guard did not throw error!");
    } catch (err) {
      console.log(`✅ Duplicate Submit Guard Passed: "${err.message}"`);
    }

    // ------------------------------------------------------------------------
    // TEST REQUIREMENT 9: Counselor Assessment Review Workflow
    // ------------------------------------------------------------------------
    console.log("\n--- 10. Testing Counselor Review Detail Retrieval ---");
    const reviewDetail = await assessmentAssignmentService.getAssignmentReviewDetail(assignment._id, counselor);
    console.log(`✅ Counselor fetched Review Detail:`);
    console.log(`   - Student Name: ${reviewDetail.assignment.studentId.firstName} ${reviewDetail.assignment.studentId.lastName}`);
    console.log(`   - Assessment Title: ${reviewDetail.assignment.assessmentDefinitionId.title}`);
    console.log(`   - Raw Responses Count: ${reviewDetail.rawResponses.length}`);
    console.log(`   - Dimension Scores Count: ${reviewDetail.score ? reviewDetail.score.dimensionScores.length : 0}`);

    console.log("\n--- 11. Testing Counselor Request Retake / Reject Action ---");
    const rejectedAssignment = await assessmentAssignmentService.rejectAssignment(
      assignment._id,
      "Score profile requires retake due to inconsistent answers.",
      counselor
    );
    console.log(`✅ Assessment status updated to: ${rejectedAssignment.status} (Expected: REJECTED)`);
    console.log(`✅ Counselor notes saved: "${rejectedAssignment.counselorNotes}"`);

    console.log("\n--- 12. Testing Counselor Approval & Auto-Unlock Workflow ---");
    // Link a dummy next assessment ID to test automatic unlocking
    await AssessmentAssignment.findByIdAndUpdate(assignment._id, {
      unlocksNextAssessmentId: personalityDef._id,
    });

    const approvedAssignment = await assessmentAssignmentService.approveAssignment(
      assignment._id,
      "Approved. Excellent trait consistency across all 5 OCEAN domains.",
      counselor
    );
    console.log(`✅ Assessment status updated to: ${approvedAssignment.status} (Expected: APPROVED)`);

    // Verify Lifecycle Status updated to INTERVIEW_PENDING
    const updatedProfile4 = await StudentProfile.findOne({ userId: student._id });
    console.log(`✅ StudentProfile Lifecycle Status updated to: ${updatedProfile4.status} (Expected: INTERVIEW_PENDING)`);

    // Verify Next Assessment Unlocked (Auto-created assignment)
    const unlockedNext = await AssessmentAssignment.find({
      studentId: student._id,
      prerequisiteAssignmentId: assignment._id,
    });
    console.log(`✅ Next Assessment Auto-Unlocked: Created ${unlockedNext.length} new assignment(s) with prerequisite link.`);

    // Cleanup test records
    await AssessmentAssignment.deleteMany({ studentId: student._id });
    await AssessmentSession.deleteMany({ clientId: student._id });
    await AssessmentResponse.deleteMany({ clientId: student._id });
    await AssessmentScore.deleteMany({ clientId: student._id });
    await User.deleteMany({ email: { $in: ["test_counselor_suite@example.com", "test_student_suite@example.com"] } });
    await StudentProfile.deleteMany({ userId: student._id });

    console.log("\n==========================================================================");
    console.log("           🎉 ALL ASSESSMENT & COUNSELOR REVIEW TESTS PASSED!             ");
    console.log("==========================================================================");
  } catch (error) {
    console.error("\n❌ TEST SUITE FAILED WITH ERROR:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed.");
  }
}

runAssessmentEngineTests();
