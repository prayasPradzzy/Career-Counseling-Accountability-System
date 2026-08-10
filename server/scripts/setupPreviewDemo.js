/**
 * setupPreviewDemo.js
 * Creates a small, idempotent demo dataset for the counselor Assessments preview:
 *  - preview.counselor@example.com (counselor)
 *  - 3 demo students
 *  - Assignments across IPIP-NEO-120, O*NET Interest Profiler and O*NET WIL in
 *    varied states (completed / in-progress / not-started) so the Assessment
 *    Library shows real aggregate stats.
 *
 * Run: node scripts/setupPreviewDemo.js   (from the server directory)
 * Idempotent: re-running reuses existing accounts/assignments and only fills in
 * missing sessions.
 */
const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

const connectDB = require("../src/database/connectDB");
const User = require("../src/modules/users/user.model");
const StudentProfile = require("../src/modules/profiles/studentProfile.model");
const AssessmentDefinition = require("../src/modules/assessments/assessmentDefinition.model");
const AssessmentQuestion = require("../src/modules/assessments/assessmentQuestion.model");
const { AssessmentAssignment } = require("../src/modules/assessments/assessmentAssignment.model");
const AssessmentSession = require("../src/modules/assessments/assessmentSession.model");
const assessmentAssignmentService = require("../src/modules/assessments/assessmentAssignment.service");
const assessmentSessionService = require("../src/modules/assessments/assessmentSession.service");

const PASSWORD = "Password123!";
const DEMO_COUNSELOR_EMAIL = "preview.counselor@example.com";
const DEMO_STUDENTS = [
  { email: "preview.student.a@example.com", firstName: "Alex", lastName: "Demo" },
  { email: "preview.student.b@example.com", firstName: "Bella", lastName: "Demo" },
  { email: "preview.student.c@example.com", firstName: "Cara", lastName: "Demo" },
];

async function getOrCreateUser({ email, firstName, lastName, role, counselorId }) {
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      firstName,
      lastName,
      email,
      password: PASSWORD,
      role,
      ...(counselorId ? { counselorId } : {}),
    });
    console.log(`  + created ${role}: ${email}`);
  }
  return user;
}

async function ensureStudentProfile(user, counselor) {
  let profile = await StudentProfile.findOne({ userId: user._id });
  if (!profile) {
    profile = await StudentProfile.create({
      userId: user._id,
      assignedCounselorId: counselor._id,
      onboardingSource: "counselor-invite",
    });
    console.log(`  + created profile for ${user.email}`);
  }
  return profile;
}

async function getOrCreateAssignment(student, counselor, definition) {
  const existing = await AssessmentAssignment.findOne({
    studentId: student._id,
    assessmentDefinitionId: definition._id,
  });
  if (existing) return existing;

  const assignment = await assessmentAssignmentService.assignAssessment(
    { studentId: student._id, assessmentDefinitionId: definition._id },
    counselor
  );
  console.log(`  + assigned ${definition.code} -> ${student.email}`);
  return assignment;
}

/** Complete a session end-to-end (autosave all responses + submit). */
async function completeSession(assignment, student, questions, valueFor) {
  // Idempotency: skip if this assignment already has a submitted session
  const existingSession = await AssessmentSession.findOne({
    assignmentId: assignment._id,
    status: { $ne: "SUPERSEDED" },
  });
  if (
    existingSession &&
    ["COMPLETED", "SUBMITTED", "REVIEWED", "APPROVED"].includes(existingSession.status)
  ) {
    console.log(`  ~ already submitted: ${assignment._id}`);
    return;
  }

  const sessionState = await assessmentSessionService.startOrResumeSession(assignment._id, student);
  const sessionId = sessionState.session._id;

  const responses = questions.map((q, i) => ({
    questionId: q._id,
    questionNumber: q.questionNumber,
    selectedValue: valueFor(q, i),
  }));

  await assessmentSessionService.autosaveProgress(
    sessionId,
    { responses, timeSpentSeconds: 0, currentQuestionIndex: 0 },
    student
  );
  // Patch time spent directly so "avg completion time" is realistic
  await AssessmentSession.updateOne({ _id: sessionId }, { timeSpentSeconds: 400 });
  const res = await assessmentSessionService.submitSession(sessionId, student);
  console.log(`  ✔ completed assignment ${assignment._id} for ${student.email} (${res.status})`);
}

async function main() {
  await connectDB();

  const counselor = await getOrCreateUser({
    email: DEMO_COUNSELOR_EMAIL,
    firstName: "Preview",
    lastName: "Counselor",
    role: "counselor",
  });

  const students = {};
  for (const spec of DEMO_STUDENTS) {
    const s = await getOrCreateUser({ ...spec, role: "student", counselorId: counselor._id });
    await ensureStudentProfile(s, counselor);
    students[spec.firstName.toLowerCase()] = s;
  }

  const defs = await AssessmentDefinition.find({ status: "active" });
  const byCode = Object.fromEntries(defs.map((d) => [d.code, d]));
  const ipip = byCode["IPIP_NEO_120"];
  const interest = byCode["ONET_INTEREST_PROFILER_SHORT"];
  const wil = byCode["ONET_WORK_IMPORTANCE_LOCATOR"];

  if (!ipip || !interest || !wil) {
    console.error("❌ Missing seeded assessment definitions (IPIP_NEO_120, ONET_INTEREST_PROFILER_SHORT, ONET_WORK_IMPORTANCE_LOCATOR).");
    process.exit(1);
  }

  // ── Assignments ────────────────────────────────────────────────────────────
  // IPIP: Alex completed, Bella in progress, Cara not started
  // Interest: Alex completed, Bella not started
  // WIL: Cara not started
  const aIpipAlex = await getOrCreateAssignment(students.alex, counselor, ipip);
  const aIpipBella = await getOrCreateAssignment(students.bella, counselor, ipip);
  const aIpipCara = await getOrCreateAssignment(students.cara, counselor, ipip);
  const aIntAlex = await getOrCreateAssignment(students.alex, counselor, interest);
  const aIntBella = await getOrCreateAssignment(students.bella, counselor, interest);
  const aWilCara = await getOrCreateAssignment(students.cara, counselor, wil);

  // ── Sessions / states ──────────────────────────────────────────────────────
  const ipipQuestions = await AssessmentQuestion.find({ assessmentId: ipip._id }).sort({ questionNumber: 1 });
  const interestQuestions = await AssessmentQuestion.find({ assessmentId: interest._id }).sort({ questionNumber: 1 });

  // Alex: complete IPIP (likert, 120 items)
  await completeSession(aIpipAlex, students.alex, ipipQuestions, (q, i) => (i % 5) + 1);

  // Alex: complete Interest Profiler (checkbox, 60 items — 20 selected)
  await completeSession(aIntAlex, students.alex, interestQuestions, (q) =>
    q.questionNumber <= 20 ? 1 : 0
  );

  // Bella: IPIP in progress with a few answers saved
  const bellaState = await assessmentSessionService.startOrResumeSession(aIpipBella._id, students.bella);
  const bellaResponses = ipipQuestions.slice(0, 5).map((q, i) => ({
    questionId: q._id,
    questionNumber: q.questionNumber,
    selectedValue: (i % 5) + 1,
  }));
  await assessmentSessionService.autosaveProgress(
    bellaState.session._id,
    { responses: bellaResponses, timeSpentSeconds: 120, currentQuestionIndex: 0 },
    students.bella
  );
  console.log(`  ▶ in-progress IPIP for ${students.bella.email} (5 answered)`);

  console.log("\n✅ Demo data ready. Login: preview.counselor@example.com / " + PASSWORD);
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Demo setup failed:", e);
  process.exit(1);
});
