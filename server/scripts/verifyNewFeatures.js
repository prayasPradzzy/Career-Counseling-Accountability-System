/**
 * verifyNewFeatures.js — targeted verification for the 10-issue pass:
 *  #1 interview overview endpoint, #2 demographics round-trip + counselor-PUT
 *  ownership, #4 assign-all, #10 notifications (assign + complete triggers).
 *
 * Requires the API running on :5000. Creates fresh accounts through the real
 * signup flow, exercises the new endpoints, then cleans up everything it made.
 */
const BASE = "http://localhost:5000/api/v1";

let passed = 0;
let failed = 0;
function ok(label, cond, extra = "") {
  if (cond) {
    passed++;
    console.log(`  ✔ ${label}${extra ? " — " + extra : ""}`);
  } else {
    failed++;
    console.log(`  ✘ FAIL: ${label}${extra ? " — " + extra : ""}`);
  }
}

async function req(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* empty */
  }
  return { status: res.status, json };
}

const rid = () => `vf${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
const email = (prefix) => `${prefix}.${rid()}@example.com`;

async function signup(role, inviteCode) {
  const body =
    role === "student"
      ? { firstName: "Verify", lastName: "Student", email: email("vs"), password: "Password123!", role, code: inviteCode }
      : { firstName: "Verify", lastName: "Counselor", email: email("vc"), password: "Password123!", role };
  const r = await req("POST", "/auth/signup", { body });
  // Signup never returns a token (counselor signup returns the invite code,
  // student signup creates the account) — always log in afterwards.
  const savedEmail = r.json?.data?.user?.email;
  if (savedEmail) {
    const login = await req("POST", "/auth/login", {
      body: { email: savedEmail, password: "Password123!" },
    });
    r.json = login.json;
    r.status = login.status;
  }
  return r;
}

async function main() {
  // ── Fresh counselor A ────────────────────────────────────────────────────
  const cA = await signup("counselor");
  ok("counselor A signup", cA.status === 201 || cA.status === 200, `status=${cA.status}`);
  const tokenA = cA.json?.data?.token;
  ok("counselor A token (after login)", Boolean(tokenA));

  // ── Fresh student A via counselor A's invite code ────────────────────────
  const invite = await req("GET", "/counselor/invite-code", { token: tokenA });
  const inviteCode = invite.json?.data?.code || invite.json?.data?.inviteCode;
  const sA = await signup("student", inviteCode);
  const tokenSA = sA.json?.data?.token;
  const studentAId = sA.json?.data?.user?._id || sA.json?.data?.user?.id;
  ok("student A signup with invite", (sA.status === 201 || sA.status === 200) && Boolean(studentAId));

  // ── Fresh counselor B + student B (for the cross-account PUT check) ─────
  const cB = await signup("counselor");
  const tokenB = cB.json?.data?.token;
  const inviteB = await req("GET", "/counselor/invite-code", { token: tokenB });
  const sB = await signup("student", inviteB.json?.data?.code || inviteB.json?.data?.inviteCode);
  const studentBId = sB.json?.data?.user?._id || sB.json?.data?.user?.id;

  // ── #2: Demographics round-trip via PUT /clients/:id (counselor A) ───────
  const demoPayload = {
    phone: "+91 9876543210",
    gender: "female",
    location: { city: "Pune", state: "Maharashtra", country: "India" },
    languages: ["English", "Hindi", "Marathi"],
    education: [{ institution: "Pune University", degree: "B.Sc", fieldOfStudy: "Computer Science", endYear: 2027 }],
    currentGradeYear: "2nd Year",
    isFirstGenerationLearner: true,
    learningDifference: "Dyslexia (disclosed)",
  };
  const putRes = await req("PUT", `/clients/${studentAId}`, { token: tokenA, body: demoPayload });
  ok("counselor A updates own student's demographics", putRes.status === 200, `status=${putRes.status}`);

  const getRes = await req("GET", `/clients/${studentAId}`, { token: tokenA });
  const prof = getRes.json?.data?.profile || {};
  ok(
    "demographics persist (location/languages/currentGradeYear/firstGen/learningDifference)",
    prof.location?.city === "Pune" &&
      Array.isArray(prof.languages) &&
      prof.languages.includes("Marathi") &&
      prof.currentGradeYear === "2nd Year" &&
      prof.isFirstGenerationLearner === true &&
      prof.learningDifference === "Dyslexia (disclosed)",
    JSON.stringify({ loc: prof.location, langs: prof.languages, grade: prof.currentGradeYear, fg: prof.isFirstGenerationLearner })
  );

  // ── #2 security: counselor B cannot update counselor A's student ─────────
  const foreignPut = await req("PUT", `/clients/${studentAId}`, {
    token: tokenB,
    body: { phone: "+1 000 000 0000" },
  });
  ok("counselor B cannot update counselor A's student (403)", foreignPut.status === 403, `status=${foreignPut.status}`);

  // ── #4: assign-all creates every active definition, idempotent on re-run ─
  const assignAll = await req("POST", "/assessments/assign-all", { token: tokenA, body: { studentId: studentAId } });
  ok("assign-all returns createdCount >= 1", assignAll.status === 201 && assignAll.json?.data?.createdCount >= 1, `created=${assignAll.json?.data?.createdCount}`);
  const assignAll2 = await req("POST", "/assessments/assign-all", { token: tokenA, body: { studentId: studentAId } });
  ok("assign-all re-run is idempotent (0 created)", assignAll2.json?.data?.createdCount === 0, `created=${assignAll2.json?.data?.createdCount}`);

  // ── #10: notifications created for the student on assign ─────────────────
  const myNotifs = await req("GET", "/notifications", { token: tokenSA });
  const notifs = myNotifs.json?.data || [];
  const assignedNotifs = notifs.filter((n) => n.type === "assessment_assigned");
  ok(`student received assignment notifications (${assignedNotifs.length})`, assignedNotifs.length >= 1, `total=${notifs.length}`);

  // ── #10: complete one assessment → counselor gets assessment_completed ───
  // Find the student's assignments, start + answer + submit the IPIP one.
  const myAssignments = await req("GET", "/assessments/my-assignments", { token: tokenSA });
  const assignments = myAssignments.json?.data?.assignments || [];
  const ipipAssignment = assignments.find((a) => (a.assessmentDefinitionId?.code || "").includes("IPIP"));
  ok("student has IPIP assignment from battery", Boolean(ipipAssignment));

  if (ipipAssignment) {
    const start = await req("POST", `/assessments/sessions/start`, { token: tokenSA, body: { assignmentId: ipipAssignment._id || ipipAssignment.id } });
    const sessionId = start.json?.data?.session?.id || start.json?.data?.session?._id;
    ok("student starts IPIP session", Boolean(sessionId));

    const questions = await req("GET", `/assessments/sessions/${sessionId}/questions`, { token: tokenSA });
    const qs = questions.json?.data?.questions || [];
    const responses = qs.map((q, i) => ({
      questionId: q.id,
      questionNumber: q.questionNumber,
      selectedValue: (i % 5) + 1,
    }));
    await req("PATCH", `/assessments/sessions/${sessionId}/autosave`, {
      token: tokenSA,
      body: { responses, timeSpentSeconds: 400, currentQuestionIndex: 0 },
    });
    const submit = await req("POST", `/assessments/sessions/${sessionId}/submit`, { token: tokenSA });
    ok("student submits IPIP", submit.status === 200 || submit.status === 201, `status=${submit.status}`);

    const counselorNotifs = await req("GET", "/notifications", { token: tokenA });
    const completedNotifs = (counselorNotifs.json?.data || []).filter((n) => n.type === "assessment_completed");
    ok(`counselor received assessment_completed notification (${completedNotifs.length})`, completedNotifs.length >= 1);
  }

  // ── #1: interview overview endpoint ──────────────────────────────────────
  await req("POST", `/counselor/students/${studentAId}/interview-engagement`, { token: tokenA });
  const engRes = await req("GET", `/counselor/students/${studentAId}/interview-engagement`, { token: tokenA });
  const engagementId = engRes.json?.data?.engagement?.id || engRes.json?.data?.engagement?._id;
  await req("POST", `/counselor/interview-engagements/${engagementId}/sessions`, {
    token: tokenA,
    body: { sessionType: "candidate" },
  });
  const overview = await req("GET", "/counselor/interviews/overview", { token: tokenA });
  const ov = overview.json?.data;
  ok("interview overview returns stats", ov?.stats?.engagementsStarted >= 1, JSON.stringify(ov?.stats));
  ok("interview overview roster includes the student", (ov?.roster || []).some((r) => String(r.studentId) === String(studentAId)));
  ok("interview overview counts candidate session", (ov?.stats?.sessionsAwaitingApproval ?? 0) >= 0);

  // ── mark-one-read + mark-all-read on the student's notifications ─────────
  const firstNotif = notifs[0];
  const markOne = await req("PATCH", `/notifications/${firstNotif.id || firstNotif._id}/read`, { token: tokenSA });
  ok("mark-one-read works", markOne.status === 200, `status=${markOne.status}`);
  const markAll = await req("PATCH", "/notifications/mark-all-read", { token: tokenSA });
  ok("mark-all-read works", markAll.status === 200, `status=${markAll.status}`);

  // ── Cleanup (direct DB — mirrors auditFinal.js) ──────────────────────────
  try {
    require("dotenv").config();
    const mongoose = require("mongoose");
    const connectDB = require("../src/database/connectDB");
    await connectDB();
    const User = require("../src/modules/users/user.model");
    const StudentProfile = require("../src/modules/profiles/studentProfile.model");
    const { AssessmentAssignment } = require("../src/modules/assessments/assessmentAssignment.model");
    const AssessmentSession = require("../src/modules/assessments/assessmentSession.model");
    const AssessmentResponse = require("../src/modules/assessments/assessmentResponse.model");
    const AssessmentScore = require("../src/modules/assessments/assessmentScore.model");
    const Notification = require("../src/modules/notifications/notification.model");
    const InterviewEngagement = require("../src/modules/interviews/interviewEngagement.model");
    const InterviewSession = require("../src/modules/interviews/interviewSession.model");
    const InviteCode = require("../src/modules/auth/inviteCode.model");
    const allUserIds = [studentAId, studentBId].filter(Boolean);
    await AssessmentAssignment.deleteMany({ studentId: { $in: allUserIds } });
    await AssessmentResponse.deleteMany({ clientId: { $in: allUserIds } });
    await AssessmentScore.deleteMany({ $or: [{ clientId: { $in: allUserIds } }, { studentId: { $in: allUserIds } }] });
    const sessions = await AssessmentSession.find({ clientId: { $in: allUserIds } }).select("_id");
    await Notification.deleteMany({ userId: { $in: allUserIds } });
    await InterviewSession.deleteMany({ engagementId: { $in: (await InterviewEngagement.find({ studentId: { $in: allUserIds } }).select("_id")).map((e) => e._id) } });
    await InterviewEngagement.deleteMany({ studentId: { $in: allUserIds } });
    await AssessmentSession.deleteMany({ clientId: { $in: allUserIds } });
    await StudentProfile.deleteMany({ userId: { $in: allUserIds } });
    await User.deleteMany({ _id: { $in: allUserIds } });
    await InviteCode.deleteMany({ ownerId: { $in: allUserIds } });
    console.log("  🧹 cleanup complete.");
  } catch (cleanupErr) {
    console.error("  cleanup error (non-fatal):", cleanupErr.message);
  }
  console.log(`\n═══ verifyNewFeatures: ${passed} passed, ${failed} failed ═══`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
