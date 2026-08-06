const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const http = require("http");

const app = require("../app");
const User = require("../modules/users/user.model");
const StudentProfile = require("../modules/profiles/studentProfile.model");
const AssessmentDefinition = require("../modules/assessments/assessmentDefinition.model");
const AssessmentQuestion = require("../modules/assessments/assessmentQuestion.model");
const { AssessmentAssignment } = require("../modules/assessments/assessmentAssignment.model");
const AssessmentSession = require("../modules/assessments/assessmentSession.model");
const AssessmentResponse = require("../modules/assessments/assessmentResponse.model");
const AssessmentScore = require("../modules/assessments/assessmentScore.model");
const { generateToken } = require("../shared/utils/jwt");

// Helper function to make HTTP requests against express app
function makeRequest(server, options, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const reqOptions = {
      hostname: "127.0.0.1",
      port: address.port,
      path: options.path,
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let cookieToken = null;
        const setCookieHeader = res.headers["set-cookie"];
        if (setCookieHeader && Array.isArray(setCookieHeader)) {
          const tokenCookie = setCookieHeader.find((c) => c.startsWith("token="));
          if (tokenCookie) {
            cookieToken = tokenCookie.split(";")[0].split("=")[1];
          }
        }

        try {
          const json = JSON.parse(data);
          const extractedToken = json.data?.token || cookieToken;
          resolve({ status: res.statusCode, headers: res.headers, body: json, token: extractedToken });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data, token: cookieToken });
        }
      });
    });

    req.on("error", reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runMvpE2EWorkflowAudit() {
  console.log("==========================================================================");
  console.log("       END-TO-END MVP ACCEPTANCE AUDIT & INTEGRATION TEST SUITE           ");
  console.log("==========================================================================");

  let server;
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/career_counseling";
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected successfully.");

    // Start ephemeral server on random available port
    server = http.createServer(app);
    await new Promise((res) => server.listen(0, "127.0.0.1", res));
    const port = server.address().port;
    console.log(`✅ Test server running on http://127.0.0.1:${port}\n`);

    // Clean prior test accounts
    const testAdminEmail = "e2e_admin@example.com";
    const testCounselorEmail = "e2e_counselor@example.com";
    const testStudentEmail = "e2e_student@example.com";

    await User.deleteMany({ email: { $in: [testAdminEmail, testCounselorEmail, testStudentEmail] } });
    await StudentProfile.deleteMany({ invitedEmail: testStudentEmail });

    // ------------------------------------------------------------------------
    // STEP 1: Admin account exists
    // ------------------------------------------------------------------------
    console.log("--- Step 1: Admin Account Creation ---");
    const admin = await User.create({
      firstName: "Super",
      lastName: "Admin",
      email: testAdminEmail,
      password: "AdminPassword123!",
      passwordHash: "$2a$10$hash",
      role: "admin",
      isVerified: true,
    });
    console.log(`✅ Step 1 Verified: Admin Account exists (${admin.email}, ID: ${admin._id})\n`);

    // ------------------------------------------------------------------------
    // STEP 2: Counselor logs in
    // ------------------------------------------------------------------------
    console.log("--- Step 2: Counselor Login ---");
    const counselorUser = await User.create({
      firstName: "Dr. Sarah",
      lastName: "Jenkins",
      email: testCounselorEmail,
      password: "CounselorPassword123!",
      passwordHash: "$2a$10$hash",
      role: "counselor",
      isVerified: true,
    });

    const counselorLoginRes = await makeRequest(server, { path: "/api/v1/auth/login", method: "POST" }, {
      email: testCounselorEmail,
      password: "CounselorPassword123!",
    });

    if (counselorLoginRes.status !== 200 || !counselorLoginRes.token) {
      throw new Error(`Counselor login failed: ${JSON.stringify(counselorLoginRes.body)}`);
    }

    const counselorToken = counselorLoginRes.token;
    console.log(`✅ Step 2 Verified: Counselor Login successful (HTTP ${counselorLoginRes.status}, Token received)\n`);

    const adminToken = generateToken(admin._id, "admin");

    // ------------------------------------------------------------------------
    // STEP 3: Admin invites a student
    // ------------------------------------------------------------------------
    console.log("--- Step 3: Admin Invites Student ---");
    const inviteRes = await makeRequest(
      server,
      { path: "/api/v1/clients/invite", method: "POST" },
      {
        email: testStudentEmail,
        firstName: "Alex",
        lastName: "Taylor",
        phone: "+15550192834",
        assignedCounselorId: counselorUser._id,
      },
      adminToken
    );

    if (inviteRes.status !== 201 || !inviteRes.body.data?.invitationToken) {
      throw new Error(`Student invitation failed: ${JSON.stringify(inviteRes.body)}`);
    }

    const invitationToken = inviteRes.body.data.invitationToken;
    const studentProfileObj = inviteRes.body.data.studentProfile || {};
    const studentProfileId = studentProfileObj._id || studentProfileObj.id;
    console.log(`✅ Step 3 Verified: Student Invited successfully`);
    console.log(`   - Invitation Token: ${invitationToken}`);
    console.log(`   - Student Profile ID: ${studentProfileId}\n`);

    // ------------------------------------------------------------------------
    // STEP 4: Student activates account
    // ------------------------------------------------------------------------
    console.log("--- Step 4: Student Activates Account ---");
    const activateRes = await makeRequest(
      server,
      { path: "/api/v1/clients/activate", method: "POST" },
      {
        token: invitationToken,
        password: "StudentPassword123!",
        firstName: "Alex",
        lastName: "Taylor",
      }
    );

    if (activateRes.status !== 200 || !activateRes.body.data?.user?.id) {
      throw new Error(`Student activation failed: ${JSON.stringify(activateRes.body)}`);
    }

    const studentUserId = activateRes.body.data.user.id;
    console.log(`✅ Step 4 Verified: Student Account Activated (User ID: ${studentUserId})\n`);

    // ------------------------------------------------------------------------
    // STEP 5: Student logs in
    // ------------------------------------------------------------------------
    console.log("--- Step 5: Student Logs In ---");
    const studentLoginRes = await makeRequest(server, { path: "/api/v1/auth/login", method: "POST" }, {
      email: testStudentEmail,
      password: "StudentPassword123!",
    });

    if (studentLoginRes.status !== 200 || !studentLoginRes.token) {
      throw new Error(`Student login failed: ${JSON.stringify(studentLoginRes.body)}`);
    }

    const studentToken = studentLoginRes.token;
    console.log(`✅ Step 5 Verified: Student Login successful (HTTP ${studentLoginRes.status}, Token received)\n`);

    // ------------------------------------------------------------------------
    // STEP 6: Student completes profile
    // ------------------------------------------------------------------------
    console.log("--- Step 6: Student Completes Profile ---");
    const updateProfileRes = await makeRequest(
      server,
      { path: `/api/v1/clients/${studentUserId}`, method: "PUT" },
      {
        phone: "+15550192834",
        dateOfBirth: "2004-05-15",
        gender: "male",
        education: [
          {
            institution: "Stanford University",
            degree: "Bachelor of Science",
            fieldOfStudy: "Computer Science",
            startYear: 2022,
            endYear: 2026,
          },
        ],
        careerGoals: ["Software Engineer", "AI Researcher"],
        skills: ["JavaScript", "Python", "React"],
      },
      studentToken
    );

    if (updateProfileRes.status !== 200) {
      throw new Error(`Student profile update failed: ${JSON.stringify(updateProfileRes.body)}`);
    }

    const updatedProfile = updateProfileRes.body.data.profile || updateProfileRes.body.data.clientProfile || {};
    console.log(`✅ Step 6 Verified: Student Profile Completed`);
    console.log(`   - Completion Percentage: ${updatedProfile.completionPercentage}%`);
    console.log(`   - Lifecycle Status: ${updatedProfile.lifecycleStatus}\n`);

    // ------------------------------------------------------------------------
    // STEP 7: Counselor assigns Personality Assessment
    // ------------------------------------------------------------------------
    console.log("--- Step 7: Counselor Assigns Personality Assessment ---");
    const personalityDef = await AssessmentDefinition.findOne({ category: "personality" });
    if (!personalityDef) {
      throw new Error("No personality assessment definition found. Seed database first.");
    }

    const assignRes = await makeRequest(
      server,
      { path: "/api/v1/assessments/assignments", method: "POST" },
      {
        studentId: studentUserId,
        assessmentDefinitionId: personalityDef._id.toString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        counselorNotes: "Please complete personality inventory before session.",
      },
      counselorToken
    );

    if (assignRes.status !== 201 || !assignRes.body.data?.assignment) {
      throw new Error(`Assessment assignment failed: ${JSON.stringify(assignRes.body)}`);
    }

    const assignmentId = assignRes.body.data.assignment._id || assignRes.body.data.assignment.id;
    console.log(`✅ Step 7 Verified: Personality Assessment Assigned (Assignment ID: ${assignmentId})\n`);

    // ------------------------------------------------------------------------
    // STEP 8: Student starts assessment
    // ------------------------------------------------------------------------
    console.log("--- Step 8: Student Starts Assessment ---");
    const startRes = await makeRequest(
      server,
      { path: `/api/v1/assessments/assignments/${assignmentId}/start`, method: "PATCH" },
      {},
      studentToken
    );

    if (startRes.status !== 200) {
      throw new Error(`Start assessment failed: ${JSON.stringify(startRes.body)}`);
    }

    // Initialize session
    const initSessionRes = await makeRequest(
      server,
      { path: "/api/v1/assessments/sessions/start", method: "POST" },
      { assignmentId },
      studentToken
    );

    const sessionId = initSessionRes.body.data?.session?._id || initSessionRes.body.data?.session?.id;
    console.log(`✅ Step 8 Verified: Student Started Assessment (Session ID: ${sessionId})\n`);

    // ------------------------------------------------------------------------
    // STEP 9: Autosave works
    // ------------------------------------------------------------------------
    console.log("--- Step 9: Autosave Verification ---");
    const questions = await AssessmentQuestion.find({ assessmentId: personalityDef._id });
    const responsesPayload = questions.map((q) => ({
      questionId: q._id.toString(),
      questionNumber: q.questionNumber,
      selectedValue: 4,
      responseTimeMs: 1200,
    }));

    const autosaveRes = await makeRequest(
      server,
      { path: `/api/v1/assessments/sessions/${sessionId}/autosave`, method: "PATCH" },
      {
        responses: responsesPayload,
        currentQuestionIndex: questions.length - 1,
        timeSpentSeconds: 240,
      },
      studentToken
    );

    if (autosaveRes.status !== 200) {
      throw new Error(`Autosave failed: ${JSON.stringify(autosaveRes.body)}`);
    }

    console.log(`✅ Step 9 Verified: Autosave operational`);
    console.log(`   - Stored Answers: ${autosaveRes.body.data.progress.answeredCount} / ${autosaveRes.body.data.progress.totalQuestions}`);
    console.log(`   - Progress Percentage: ${autosaveRes.body.data.progress.percentage}%\n`);

    // ------------------------------------------------------------------------
    // STEP 10: Resume works
    // ------------------------------------------------------------------------
    console.log("--- Step 10: Resume Verification ---");
    const resumeRes = await makeRequest(
      server,
      { path: `/api/v1/assessments/sessions/${sessionId}`, method: "GET" },
      null,
      studentToken
    );

    if (resumeRes.status !== 200 || !resumeRes.body.data?.session) {
      throw new Error(`Resume failed: ${JSON.stringify(resumeRes.body)}`);
    }

    console.log(`✅ Step 10 Verified: Resume state restored correctly`);
    console.log(`   - Saved Responses Map Count: ${Object.keys(resumeRes.body.data.savedResponses || {}).length}\n`);

    // ------------------------------------------------------------------------
    // STEP 11: Submit works
    // ------------------------------------------------------------------------
    console.log("--- Step 11: Submit Verification ---");
    const submitRes = await makeRequest(
      server,
      { path: `/api/v1/assessments/sessions/${sessionId}/submit`, method: "POST" },
      {},
      studentToken
    );

    if (submitRes.status !== 200) {
      throw new Error(`Submit failed: ${JSON.stringify(submitRes.body)}`);
    }

    console.log(`✅ Step 11 Verified: Session Submitted & Locked (Status: ${submitRes.body.data.status})\n`);

    // ------------------------------------------------------------------------
    // STEP 12: AssessmentScore is generated
    // ------------------------------------------------------------------------
    console.log("--- Step 12: AssessmentScore Generation Check ---");
    const scoreDoc = await AssessmentScore.findOne({ sessionId });
    if (!scoreDoc || !scoreDoc.dimensionScores || scoreDoc.dimensionScores.length === 0) {
      throw new Error("AssessmentScore generation failed!");
    }

    console.log(`✅ Step 12 Verified: AssessmentScore generated in MongoDB`);
    console.log(`   - Strategy: ${scoreDoc.scoringStrategy}`);
    console.log(`   - Dimensions Calculated: ${scoreDoc.dimensionScores.length}`);
    console.log(`   - Total Facets Calculated: ${scoreDoc.dimensionScores.reduce((acc, d) => acc + d.facetScores.length, 0)}\n`);

    // ------------------------------------------------------------------------
    // STEP 13: Counselor reviews submission
    // ------------------------------------------------------------------------
    console.log("--- Step 13: Counselor Reviews Submission ---");
    const reviewRes = await makeRequest(
      server,
      { path: `/api/v1/assessments/assignments/${assignmentId}/review-detail`, method: "GET" },
      null,
      counselorToken
    );

    if (reviewRes.status !== 200 || !reviewRes.body.data?.assignment) {
      throw new Error(`Counselor review detail failed: ${JSON.stringify(reviewRes.body)}`);
    }

    console.log(`✅ Step 13 Verified: Counselor Review Detail retrieved`);
    console.log(`   - Raw Items Mapped: ${reviewRes.body.data.rawResponses.length}`);
    console.log(`   - Dimension Scores: ${reviewRes.body.data.score.dimensionScores.length}\n`);

    // ------------------------------------------------------------------------
    // STEP 14: Counselor approves
    // ------------------------------------------------------------------------
    console.log("--- Step 14: Counselor Approves Assessment ---");
    const approveRes = await makeRequest(
      server,
      { path: `/api/v1/assessments/assignments/${assignmentId}/approve`, method: "PATCH" },
      { counselorNotes: "Approved. Profile exhibits strong openness and conscientiousness traits." },
      counselorToken
    );

    if (approveRes.status !== 200) {
      throw new Error(`Counselor approval failed: ${JSON.stringify(approveRes.body)}`);
    }

    console.log(`✅ Step 14 Verified: Assessment Approved (Status: ${approveRes.body.data.assignment.status})\n`);

    // ------------------------------------------------------------------------
    // STEP 15: Student lifecycle changes to INTERVIEW_PENDING
    // ------------------------------------------------------------------------
    console.log("--- Step 15: Student Lifecycle Check ---");
    const finalProfile = await StudentProfile.findOne({ userId: studentUserId });
    const finalLifecycleStatus = finalProfile ? finalProfile.status : null;

    if (finalLifecycleStatus !== "INTERVIEW_PENDING") {
      throw new Error(`Lifecycle status expected 'INTERVIEW_PENDING', got '${finalLifecycleStatus}'`);
    }

    console.log(`✅ Step 15 Verified: Student Lifecycle Status updated to: ${finalLifecycleStatus}\n`);

    // Cleanup test records created during test run
    if (studentProfileId) await StudentProfile.deleteMany({ _id: studentProfileId });
    if (studentUserId) {
      await AssessmentAssignment.deleteMany({ studentId: studentUserId });
      await AssessmentSession.deleteMany({ clientId: studentUserId });
      await AssessmentResponse.deleteMany({ clientId: studentUserId });
      await AssessmentScore.deleteMany({ clientId: studentUserId });
      await User.deleteMany({ _id: studentUserId });
    }
    await User.deleteMany({ email: { $in: [testAdminEmail, testCounselorEmail, testStudentEmail] } });
    await StudentProfile.deleteMany({ invitedEmail: testStudentEmail });

    console.log("==========================================================================");
    console.log("    🎉 100% END-TO-END MVP ACCEPTANCE WORKFLOW AUDIT PASSED!              ");
    console.log("==========================================================================");
  } catch (err) {
    console.error("\n❌ MVP ACCEPTANCE WORKFLOW FAILED WITH ERROR:", err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    console.log("MongoDB connection closed.");
  }
}

runMvpE2EWorkflowAudit();
