/**
 * testInterviewFlow.js
 * End-to-end verification of the Interview Question Generator phase:
 *
 * Phase A (DB-level): fabricates a student with notably high Neuroticism
 *   plus completed IPIP / WIL / Interest scores, then asserts the
 *   deterministic priority mapping marks emotional_adaptive as 'high'.
 *
 * Phase B (HTTP): runs the full counselor API flow against a running
 *   server — start engagement → create session → generate questions →
 *   fetch → approve — and verifies the grounded cluster priorities.
 *
 * Usage (from the server directory, with the API running on :5000):
 *   node scripts/testInterviewFlow.js
 */
const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

const connectDB = require("../src/database/connectDB");
const User = require("../src/modules/users/user.model");
const StudentProfile = require("../src/modules/profiles/studentProfile.model");
const AssessmentDefinition = require("../src/modules/assessments/assessmentDefinition.model");
const AssessmentSession = require("../src/modules/assessments/assessmentSession.model");
const AssessmentScore = require("../src/modules/assessments/assessmentScore.model");
const InterviewEngagement = require("../src/modules/interviews/interviewEngagement.model");
const InterviewSession = require("../src/modules/interviews/interviewSession.model");
const InterviewQuestionSet = require("../src/modules/interviews/interviewQuestionSet.model");
const clusterPriorityService = require("../src/modules/interviews/clusterPriorityService");

const BASE = process.env.TEST_API_URL || "http://localhost:5000/api/v1";
const PASSWORD = "InterviewTest123!";
const stamp = Date.now().toString(36);
const COUNSELOR_EMAIL = `interview.test.counselor.${stamp}@example.com`;
const STUDENT_EMAIL = `interview.test.highn.${stamp}@example.com`;

let failures = 0;
function assert(cond, label, extra) {
  const ok = Boolean(cond);
  if (!ok) failures += 1;
  console.log(`  ${ok ? "✔" : "✘"} ${label}${extra ? ` — ${extra}` : ""}`);
  return ok;
}

// ── HTTP helpers (Bearer token auth, like the cookie flow) ─────────────────
async function api(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
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
    /* non-JSON response */
  }
  return { status: res.status, json };
}

async function main() {
  await connectDB();
  console.log(`\n=== Phase A: deterministic priority mapping (student ${STUDENT_EMAIL}) ===`);

  // 1. Counselor + student + linked profile
  const counselor = await User.create({
    firstName: "Interview",
    lastName: "Counselor",
    email: COUNSELOR_EMAIL,
    password: PASSWORD,
    role: "counselor",
  });
  const student = await User.create({
    firstName: "High",
    lastName: "Neuroticism",
    email: STUDENT_EMAIL,
    password: PASSWORD,
    role: "student",
    counselorId: counselor._id,
  });
  await StudentProfile.create({
    userId: student._id,
    assignedCounselorId: counselor._id,
    onboardingSource: "counselor-invite",
  });
  console.log(`  + created counselor ${COUNSELOR_EMAIL}`);
  console.log(`  + created student  ${STUDENT_EMAIL}`);

  // 2. Definitions + fabricated completed sessions/scores
  const defs = await AssessmentDefinition.find({ status: "active" });
  const byKey = Object.fromEntries(
    defs.map((d) => [String(d.metadata?.assessmentKey || "").toLowerCase(), d])
  );
  const ipipDef = byKey["ipip-neo-120"];
  const wilDef = byKey["onet-work-importance-locator"];
  const intDef = byKey["onet-interest-profiler-short"];
  assert(ipipDef && wilDef && intDef, "all three assessment definitions present in DB");

  async function makeScore(def, key, category, payload) {
    const session = await AssessmentSession.create({
      clientId: student._id,
      assessmentDefinitionId: def._id,
      status: "completed",
      completedAt: new Date(),
    });
    return AssessmentScore.create({
      sessionId: session._id,
      studentId: student._id,
      clientId: student._id,
      assessmentDefinitionId: def._id,
      assessmentKey: key,
      category,
      isCurrent: true,
      version: 1,
      ...payload,
    });
  }

  // IPIP: N=High (the acceptance-criterion signal), C=Low, E=High, O/A=Moderate
  await makeScore(ipipDef, "ipip-neo-120", "personality", {
    scoringStrategy: "ipip_neo_120",
    domainScores: [
      { domain: "N", dimensionName: "Neuroticism", score: 4.4, rawScore: 4.4, band: "High" },
      { domain: "C", dimensionName: "Conscientiousness", score: 2.1, rawScore: 2.1, band: "Low" },
      { domain: "E", dimensionName: "Extraversion", score: 4.2, rawScore: 4.2, band: "High" },
      { domain: "O", dimensionName: "Openness", score: 3.0, rawScore: 3.0, band: "Moderate" },
      { domain: "A", dimensionName: "Agreeableness", score: 3.1, rawScore: 3.1, band: "Moderate" },
    ],
    dimensionScores: [],
  });

  // WIL: workingConditions + independence in top two (emotional_adaptive + future/cognitive)
  await makeScore(wilDef, "onet-work-importance-locator", "values", {
    scoringStrategy: "onet_wil",
    topWorkValues: ["workingConditions", "independence"],
    workValueScores: [
      { code: "workingConditions", name: "Working Conditions", rawSum: 12, weightedScore: 36, band: "High" },
      { code: "independence", name: "Independence", rawSum: 8, weightedScore: 16, band: "Moderate" },
    ],
  });

  // Interest: holland "SIA" → S (social), I (cognitive), A (future)
  await makeScore(intDef, "onet-interest-profiler-short", "interest", {
    scoringStrategy: "riasec_holland",
    hollandCode: "SIA",
    categoryScores: [
      { code: "S", name: "Social", rawScore: 14, band: "High" },
      { code: "I", name: "Investigative", rawScore: 13, band: "High" },
      { code: "A", name: "Artistic", rawScore: 12, band: "High" },
    ],
  });

  // 3. Assert the deterministic mapping
  const { priorities, boosts, completedAssessmentCount } =
    await clusterPriorityService.computeClusterPriorities(student._id);

  console.log("  priorities:", JSON.stringify(priorities, null, 0));
  assert(completedAssessmentCount === 3, "counts all 3 completed assessments", `count=${completedAssessmentCount}`);
  assert(priorities.emotional_adaptive === "high", "high Neuroticism + workingConditions => emotional_adaptive HIGH", `boost=${boosts.emotional_adaptive}`);
  assert(priorities.cognitive_decision === "high", "C-low + independence + I => cognitive_decision HIGH", `boost=${boosts.cognitive_decision}`);
  assert(priorities.social_relational === "high", "E-high + S => social_relational HIGH", `boost=${boosts.social_relational}`);
  assert(priorities.future_initiative === "high", "independence + A => future_initiative HIGH", `boost=${boosts.future_initiative}`);
  assert(priorities.identity_direction === "light", "no recognition signal => identity_direction LIGHT", `boost=${boosts.identity_direction || 0}`);

  // 4. Psychometric summary is band-level only (no raw numbers)
  const scores = await clusterPriorityService.getStudentCurrentScores(student._id);
  const summary = clusterPriorityService.buildPsychometricSummary(scores);
  const serialized = JSON.stringify(summary);
  assert(summary["ipip-neo-120"]?.domainBands?.N === "High", "summary carries N: High band");
  assert(!serialized.includes("4.4"), "summary contains no raw numeric scores");

  if (failures > 0) {
    console.error(`\n❌ Phase A failed with ${failures} assertion(s).`);
    process.exitCode = 1;
    await mongoose.disconnect();
    return;
  }
  console.log("\n=== Phase A PASSED ===\n");

  console.log("=== Phase B: full HTTP flow ===");
  // 1. login
  const login = await api("/auth/login", {
    method: "POST",
    body: { email: COUNSELOR_EMAIL, password: PASSWORD },
  });
  assert(login.status === 200, "counselor login", login.json?.message);
  const token = login.json?.data?.token;
  assert(Boolean(token), "login returns a token");

  const studentId = String(student._id);

  // 2. no engagement yet
  const before = await api(`/counselor/students/${studentId}/interview-engagement`, { token });
  assert(before.status === 200 && before.json?.data?.engagement === null, "GET engagement before start returns null", `count=${before.json?.data?.completedAssessmentCount}`);

  // 3. start engagement
  const start = await api(`/counselor/students/${studentId}/interview-engagement`, { method: "POST", token });
  assert(start.status === 201, "start engagement", start.json?.message);
  const engagementId = start.json?.data?.engagement?.id;
  assert(Boolean(engagementId), "engagement has an id");
  assert(start.json?.data?.completedAssessmentCount === 3, "engagement response reports 3 completed assessments");

  // 4. create a candidate session (45 min)
  const sessionRes = await api(`/counselor/interview-engagements/${engagementId}/sessions`, {
    method: "POST",
    token,
    body: { sessionType: "candidate" },
  });
  assert(sessionRes.status === 201, "create candidate session", sessionRes.json?.message);
  const sessionId = sessionRes.json?.data?.session?.id;
  assert(Boolean(sessionId), "session has an id");
  assert(sessionRes.json?.data?.session?.targetDuration === 45, "candidate session duration is 45 min");

  // 5. parent sessions are NOT available — creation must be blocked with a
  //    clear message (same direction as parent signup returning unavailable)
  const parentRes = await api(`/counselor/interview-engagements/${engagementId}/sessions`, {
    method: "POST",
    token,
    body: { sessionType: "parent" },
  });
  assert(
    parentRes.status === 400 && /Parent sessions are not currently available/.test(parentRes.json?.message || ""),
    "parent session creation blocked (400, clear message)",
    parentRes.json?.message
  );

  // 6. generate questions for the candidate session
  const gen = await api(`/counselor/interview-sessions/${sessionId}/generate-questions`, {
    method: "POST",
    token,
  });
  assert(gen.status === 201, "generate questions", gen.json?.message);
  const qs = gen.json?.data?.questionSet;
  assert(Boolean(qs), "question set returned");
  assert(qs?.reviewedByCounselor === false, "question set starts unreviewed");

  const prioritiesInSet = Object.fromEntries(
    (qs?.clusterPriorities || []).map((c) => [c.cluster, c.priority])
  );
  assert(prioritiesInSet.emotional_adaptive === "high", "grounded priorities reach the AI: emotional_adaptive HIGH");
  assert(prioritiesInSet.identity_direction === "light", "grounded priorities: identity_direction LIGHT");
  assert(Array.isArray(qs?.questionsByCluster) && qs.questionsByCluster.length === 6, "all 6 clusters present");
  const highClusters = qs?.questionsByCluster?.filter((c) => c.priority === "high") || [];
  assert(highClusters.length > 0 && highClusters.every((c) => c.questions.length === 3), "high-priority clusters get 3 questions each");

  // 7. fetch questions
  const fetched = await api(`/counselor/interview-sessions/${sessionId}/questions`, { token });
  assert(fetched.status === 200 && fetched.json?.data?.questionSet?.id === qs.id, "GET questions returns the generated set");

  // 8. approve (with an inline edit on one question)
  const edited = [...qs.questionsByCluster];
  if (edited[0]?.questions?.length) {
    edited[0].questions[0] = `${edited[0].questions[0]} [edited by counselor]`;
  }
  const approve = await api(`/counselor/interview-sessions/${sessionId}/questions`, {
    method: "PATCH",
    token,
    body: { questionsByCluster: edited, reviewedByCounselor: true },
  });
  assert(approve.status === 200, "approve question set", approve.json?.message);
  assert(approve.json?.data?.questionSet?.reviewedByCounselor === true, "set marked reviewed");

  // 9. approval locks the session status
  const afterApprove = await api(`/counselor/interview-sessions/${sessionId}/questions`, { token });
  assert(afterApprove.json?.data?.questionSet?.reviewedByCounselor === true, "approved state persists on refetch");

  // 10. ownership guard — a different counselor must not see this student
  const other = await User.create({
    firstName: "Other",
    lastName: "Counselor",
    email: `interview.test.other.${stamp}@example.com`,
    password: PASSWORD,
    role: "counselor",
  });
  const otherLogin = await api("/auth/login", {
    method: "POST",
    body: { email: other.email, password: PASSWORD },
  });
  const otherToken = otherLogin.json?.data?.token;
  const forbidden = await api(`/counselor/students/${studentId}/interview-engagement`, {
    token: otherToken,
  });
  assert(forbidden.status === 403, "unowned student blocked (403)");

  // 11. validation — invalid session type rejected
  const badType = await api(`/counselor/interview-engagements/${engagementId}/sessions`, {
    method: "POST",
    token,
    body: { sessionType: "dinner" },
  });
  assert(badType.status === 400, "invalid sessionType rejected (400)");

  if (failures > 0) {
    console.error(`\n❌ Phase B failed with ${failures} assertion(s).`);
  } else {
    console.log("\n=== Phase B PASSED ===\n✅ Full interview flow verified end-to-end.");
  }

  // ── Cleanup: remove every fabricated test document from the shared DB ──
  const ids = [student._id, counselor._id, other?._id].filter(Boolean);
  const studentId2 = student._id;
  await AssessmentScore.deleteMany({ clientId: studentId2 });
  const sessions = await AssessmentSession.find({ clientId: studentId2 }).select("_id");
  const sessionIds = sessions.map((s) => s._id);
  await InterviewQuestionSet.deleteMany({ sessionId: { $in: sessionIds } });
  await InterviewSession.deleteMany({ engagementId: { $in: await InterviewEngagement.find({ studentId: studentId2 }).select("_id").then((e) => e.map((x) => x._id)) } });
  await InterviewEngagement.deleteMany({ studentId: studentId2 });
  await AssessmentSession.deleteMany({ clientId: studentId2 });
  await StudentProfile.deleteMany({ userId: { $in: ids } });
  await User.deleteMany({ _id: { $in: ids } });
  console.log("  🧹 cleanup: removed fabricated test data.");

  await mongoose.disconnect();
  process.exit(failures > 0 ? 1 : 0);
}

main().catch(async (e) => {
  console.error("❌ Test failed:", e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
