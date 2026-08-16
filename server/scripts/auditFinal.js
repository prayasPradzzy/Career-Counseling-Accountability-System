/**
 * auditFinal.js — Comprehensive Final Audit (clean end-to-end scenario)
 *
 * Runs the ENTIRE audit checklist against ONE freshly-created counselor +
 * student pair, signed up through the REAL HTTP signup flow (not direct DB
 * fixtures). Every checkbox is verified with observed API responses and/or
 * direct DB queries.
 *
 *   Section 1 — Auth & Access Control
 *   Section 2 — Mutual Visibility Scoping
 *   Section 3 — Assessment Engine (IPIP-NEO-120, Interest Profiler, WIL)
 *   Section 4 — Retake System
 *   Section 5 — Interview Module (Phase 1 + Phase 2)
 *   Section 6 — Student Results (friendly interpretation only)
 *   Section 7 — Profile Completeness (Intake Progress parity)
 *
 * Usage (from the server directory, with the API running on :5000):
 *   node scripts/auditFinal.js
 */
const mongoose = require("mongoose");
const crypto = require("crypto");
require("dotenv").config({ path: "./.env" });

const connectDB = require("../src/database/connectDB");
const User = require("../src/modules/users/user.model");
const StudentProfile = require("../src/modules/profiles/studentProfile.model");
const InviteCode = require("../src/modules/auth/inviteCode.model");
const AssessmentSession = require("../src/modules/assessments/assessmentSession.model");
const AssessmentResponse = require("../src/modules/assessments/assessmentResponse.model");
const AssessmentScore = require("../src/modules/assessments/assessmentScore.model");
const RetakeRequest = require("../src/modules/assessments/retakeRequest.model");
const InterviewEngagement = require("../src/modules/interviews/interviewEngagement.model");
const InterviewSession = require("../src/modules/interviews/interviewSession.model");
const InterviewQuestionSet = require("../src/modules/interviews/interviewQuestionSet.model");
const AudioAsset = require("../src/modules/interviews/audioAsset.model");
const Notification = require("../src/modules/notifications/notification.model");
const clusterPriorityService = require("../src/modules/interviews/clusterPriorityService");

const BASE = process.env.TEST_API_URL || "http://localhost:5000/api/v1";
const PASSWORD = "AuditPass123!";
const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const COUNSELOR_A_EMAIL = `audit.a.counselor.${stamp}@example.com`;
const COUNSELOR_B_EMAIL = `audit.b.counselor.${stamp}@example.com`;
const STUDENT_A_EMAIL = `audit.a.student.${stamp}@example.com`;
const STUDENT_B_EMAIL = `audit.b.student.${stamp}@example.com`;

let failures = 0;
let passed = 0;
function assert(cond, label, extra) {
  const ok = Boolean(cond);
  if (ok) passed += 1;
  else failures += 1;
  console.log(`  ${ok ? "✔" : "✘"} ${label}${extra ? ` — ${extra}` : ""}`);
  return ok;
}

async function api(path, { method = "GET", token, body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (form) {
    // multipart — let fetch set the boundary
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: form ? form : body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON response (e.g. streamed audio) */
  }
  return { status: res.status, json, raw: res };
}

/** Build a tiny valid WAV (PCM silence) with a real, parseable duration. */
function makeWav(seconds = 2, sampleRate = 8000) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const dataSize = Math.floor(seconds * byteRate);
  const b = Buffer.alloc(44 + dataSize);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + dataSize, 4);
  b.write("WAVE", 8);
  b.write("fmt ", 12);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); // PCM
  b.writeUInt16LE(numChannels, 22);
  b.writeUInt32LE(sampleRate, 24);
  b.writeUInt32LE(byteRate, 28);
  b.writeUInt16LE((numChannels * bitsPerSample) / 8, 32);
  b.writeUInt16LE(bitsPerSample, 34);
  b.write("data", 36);
  b.writeUInt32LE(dataSize, 40);
  return b;
}

let S = {};

async function main() {
  await connectDB();
  console.log(`\n════════════════════════════════════════════════════════`);
  console.log(`  COMPREHENSIVE FINAL AUDIT — CLEAN SCENARIO ${stamp}`);
  console.log(`════════════════════════════════════════════════════════\n`);

  // ─────────────────────────────────────────────────────────────────
  // SETUP — real signups
  // ─────────────────────────────────────────────────────────────────
  console.log("── SETUP: fresh counselor + student via real signup flow ──");

  const cA = await api("/auth/signup", {
    method: "POST",
    body: { role: "counselor", firstName: "Audit", lastName: "CounselorA", email: COUNSELOR_A_EMAIL, password: PASSWORD },
  });
  assert(cA.status === 201 && cA.json?.data?.user?.role === "counselor", "counselor A signs up (201, role counselor)", cA.json?.message);
  S.counselorAId = cA.json?.data?.user?._id;
  S.inviteCodeA = cA.json?.data?.user?.inviteCode?.code;
  assert(Boolean(S.inviteCodeA), "invite code AUTO-generated on counselor signup", `code=${S.inviteCodeA}`);

  const cB = await api("/auth/signup", {
    method: "POST",
    body: { role: "counselor", firstName: "Audit", lastName: "CounselorB", email: COUNSELOR_B_EMAIL, password: PASSWORD },
  });
  assert(cB.status === 201, "counselor B signs up (201)");
  S.counselorBId = cB.json?.data?.user?._id;
  S.inviteCodeB = cB.json?.data?.user?.inviteCode?.code;
  assert(Boolean(S.inviteCodeB), "counselor B invite code generated");

  const sA = await api("/auth/signup", {
    method: "POST",
    body: { role: "student", firstName: "Audit", lastName: "StudentA", email: STUDENT_A_EMAIL, password: PASSWORD, code: S.inviteCodeA },
  });
  assert(sA.status === 201 && sA.json?.data?.user?.role === "student", "student A signs up with A's invite code (201)");
  S.studentAId = sA.json?.data?.user?._id;

  const sB = await api("/auth/signup", {
    method: "POST",
    body: { role: "student", firstName: "Audit", lastName: "StudentB", email: STUDENT_B_EMAIL, password: PASSWORD, code: S.inviteCodeB },
  });
  assert(sB.status === 201, "student B signs up with B's invite code (201)");
  S.studentBId = sB.json?.data?.user?._id;

  // ─────────────────────────────────────────────────────────────────
  // SECTION 1 — AUTH & ACCESS CONTROL
  // ─────────────────────────────────────────────────────────────────
  console.log("\n── SECTION 1: Auth & Access Control ──");

  const adminSignup = await api("/auth/signup", {
    method: "POST",
    body: { role: "admin", firstName: "Evil", lastName: "Admin", email: `audit.admin.${stamp}@example.com`, password: PASSWORD },
  });
  assert(adminSignup.status === 403, "role:'admin' at signup REJECTED (403)", `${adminSignup.status} ${adminSignup.json?.message}`);
  const adminUserInDb = await User.findOne({ email: `audit.admin.${stamp}@example.com` });
  assert(!adminUserInDb, "no admin user created in DB");

  const parentSignup = await api("/auth/signup", {
    method: "POST",
    body: { role: "parent", firstName: "Audit", lastName: "Parent", email: `audit.parent.${stamp}@example.com`, password: PASSWORD },
  });
  const parentMsg = String(parentSignup.json?.message || "");
  assert(
    (parentSignup.status === 501 || parentSignup.status === 400) && /unavailable|not available/i.test(parentMsg),
    "role:'parent' at signup returns the 'not available' response",
    `${parentSignup.status} ${parentMsg}`
  );
  const parentUserInDb = await User.findOne({ email: `audit.parent.${stamp}@example.com` });
  assert(!parentUserInDb, "no parent account created");

  const noCode = await api("/auth/signup", {
    method: "POST",
    body: { role: "student", firstName: "No", lastName: "Code", email: `audit.nocode.${stamp}@example.com`, password: PASSWORD },
  });
  assert(noCode.status === 400 && /invite_code_required/i.test(noCode.json?.message || ""), "student signup WITHOUT code REJECTED (400)", `${noCode.status} ${noCode.json?.message}`);
  const noCodeUser = await User.findOne({ email: `audit.nocode.${stamp}@example.com` });
  assert(!noCodeUser, "no unlinked student created");

  // counselorId set at creation (direct DB)
  const studentAUserDoc = await User.findById(S.studentAId).lean();
  assert(
    studentAUserDoc && String(studentAUserDoc.counselorId) === String(S.counselorAId),
    "student A's counselorId matches inviting counselor exactly (DB)",
    `got=${studentAUserDoc?.counselorId}`
  );
  const studentAProfile = await StudentProfile.findOne({ userId: S.studentAId }).lean();
  assert(
    studentAProfile && String(studentAProfile.assignedCounselorId) === String(S.counselorAId),
    "StudentProfile.assignedCounselorId set at creation (DB)"
  );

  const unauth = await api("/auth/me");
  assert(unauth.status === 401, "unauthenticated request to protected route BLOCKED (401)");

  const loginA = await api("/auth/login", { method: "POST", body: { email: COUNSELOR_A_EMAIL, password: PASSWORD } });
  S.tokenA = loginA.json?.data?.token;
  assert(Boolean(S.tokenA), "counselor A login");
  const loginB = await api("/auth/login", { method: "POST", body: { email: COUNSELOR_B_EMAIL, password: PASSWORD } });
  S.tokenB = loginB.json?.data?.token;
  const loginSA = await api("/auth/login", { method: "POST", body: { email: STUDENT_A_EMAIL, password: PASSWORD } });
  S.tokenSA = loginSA.json?.data?.token;
  const loginSB = await api("/auth/login", { method: "POST", body: { email: STUDENT_B_EMAIL, password: PASSWORD } });
  S.tokenSB = loginSB.json?.data?.token;
  assert(Boolean(S.tokenB) && Boolean(S.tokenSA) && Boolean(S.tokenSB), "all other accounts log in");

  // ─────────────────────────────────────────────────────────────────
  // SECTION 2 — MUTUAL VISIBILITY SCOPING
  // ─────────────────────────────────────────────────────────────────
  console.log("\n── SECTION 2: Mutual Visibility Scoping ──");

  const listA = await api("/clients?limit=100", { token: S.tokenA });
  const clientsA = listA.json?.data?.clients || [];
  const idsInList = clientsA.map((c) => String(c.userId?._id || c.userId || ""));
  assert(listA.status === 200, "counselor A can list students");
  assert(idsInList.includes(String(S.studentAId)), "counselor A list includes ONLY-A student (student A present)");
  assert(!idsInList.includes(String(S.studentBId)), "counselor A list does NOT include counselor B's student (student B absent)");
  const allScoped = clientsA.every((c) => {
    const uid = c.userId?._id || c.userId;
    const ac = c.assignedCounselorId?._id || c.assignedCounselorId;
    const inv = c.invitedBy?._id || c.invitedBy;
    return uid && (String(ac) === String(S.counselorAId) || String(inv) === String(S.counselorAId));
  });
  assert(allScoped, "every student in A's list belongs to A (scoped query)");

  // Direct-by-ID for a foreign student — the exact gap that caused real bugs
  const foreignProfile = await api(`/clients/${S.studentBId}`, { token: S.tokenA });
  assert(
    foreignProfile.status === 403 || foreignProfile.status === 404,
    "direct-by-ID fetch of a student NOT belonging to A REJECTED (403/404)",
    `status=${foreignProfile.status}`
  );
  const ownProfile = await api(`/clients/${S.studentAId}`, { token: S.tokenA });
  assert(ownProfile.status === 200, "direct-by-ID fetch of A's OWN student works (200)");

  // Student's "My Counselor"
  const myCounselor = await api("/counselor/my-counselor", { token: S.tokenSA });
  assert(
    myCounselor.status === 200 && String(myCounselor.json?.data?.id) === String(S.counselorAId),
    "student A's My Counselor is exactly counselor A",
    `id=${myCounselor.json?.data?.id}`
  );

  // Student fetching another counselor's profile — rejected
  const studentFetchesCounselorB = await api(`/clients/${S.counselorBId}`, { token: S.tokenSA });
  assert(
    studentFetchesCounselorB.status === 403 || studentFetchesCounselorB.status === 404,
    "student A fetching another counselor's profile REJECTED",
    `status=${studentFetchesCounselorB.status}`
  );

  // KNOWN-BUG RECHECK: counselor IPIP results route (double-$or overwrite)
  const ipipResLeak = await api(`/counselor/students/${S.studentBId}/assessments/ipip-neo-120/results`, { token: S.tokenA });
  if (ipipResLeak.status === 200 && ipipResLeak.json?.data) {
    const leakStudent = String(ipipResLeak.json.data.studentId || ipipResLeak.json.data.clientId || "");
    const leakedForeign = leakStudent && leakStudent !== String(S.studentBId);
    assert(
      false,
      "direct-by-ID IPIP results for foreign student must NOT return data (403/404)",
      `status=200 — returned score for ${leakStudent || "unknown student"} (LEAK)`
    );
  } else {
    assert(
      ipipResLeak.status === 403 || ipipResLeak.status === 404,
      "direct-by-ID IPIP results for foreign student REJECTED (403/404)",
      `status=${ipipResLeak.status}`
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // SECTION 3 — ASSESSMENT ENGINE (all three)
  // ─────────────────────────────────────────────────────────────────
  console.log("\n── SECTION 3: Assessment Engine (IPIP-NEO-120, Interest Profiler, WIL) ──");

  const defsRes = await api("/assessment-definitions", { token: S.tokenA });
  const defs = defsRes.json?.data?.definitions || [];
  const defByCode = {};
  for (const d of defs) {
    const code = String(d.code || "").toLowerCase();
    if (code.includes("ipip")) defByCode.ipip = d;
    if (code.includes("interest")) defByCode.interest = d;
    if (code.includes("wil") || code.includes("work_importance") || code.includes("work-importance")) defByCode.wil = d;
  }
  assert(defByCode.ipip && defByCode.interest && defByCode.wil, "all 3 assessment definitions present", `count=${defs.length}`);
  assert(defByCode.ipip?.questionCount === 120, "IPIP has 120 questions", `got=${defByCode.ipip?.questionCount}`);
  assert(defByCode.interest?.questionCount === 60, "Interest Profiler has 60 questions", `got=${defByCode.interest?.questionCount}`);
  assert(defByCode.wil?.questionCount === 20, "WIL has 20 questions", `got=${defByCode.wil?.questionCount}`);

  // Assign all three to student A
  async function assign(def) {
    const r = await api("/assessments/assignments", {
      method: "POST",
      token: S.tokenA,
      body: { studentId: S.studentAId, assessmentDefinitionId: def._id },
    });
    // NOTE: models using defaultSchemaOptions serialize _id → id in JSON
    return { status: r.status, id: r.json?.data?.assignment?.id, json: r.json };
  }
  const aIpip = await assign(defByCode.ipip);
  const aInt = await assign(defByCode.interest);
  const aWil = await assign(defByCode.wil);
  assert(aIpip.status === 201 && aIpip.id, "counselor assigns IPIP (201)");
  assert(aInt.status === 201 && aInt.id, "counselor assigns Interest Profiler (201)");
  assert(aWil.status === 201 && aWil.id, "counselor assigns WIL (201)");

  async function startSession(assignmentId) {
    const r = await api("/assessments/sessions/start", { method: "POST", token: S.tokenSA, body: { assignmentId } });
    return { status: r.status, sessionId: r.json?.data?.session?.id, json: r.json };
  }
  // NOTE: the assessment guard rule allows only ONE in-progress session at a
  // time, so the three assessments run strictly sequentially below.
  const stIpip = await startSession(aIpip.id);
  assert(stIpip.status === 200 && stIpip.sessionId, "student starts IPIP session");

  async function getQuestions(sessionId) {
    const r = await api(`/assessments/sessions/${sessionId}/questions`, { token: S.tokenSA });
    return r.json?.data?.questions || [];
  }
  const ipipQuestions = await getQuestions(stIpip.sessionId);
  assert(ipipQuestions.length === 120, "IPIP questions fetched (120)");

  async function autosave(sessionId, responses) {
    const r = await api(`/assessments/sessions/${sessionId}/autosave`, {
      method: "PATCH",
      token: S.tokenSA,
      body: { responses, currentQuestionIndex: 0, timeSpentSeconds: 600 },
    });
    return r.status;
  }

  // ── IPIP: incomplete → blocked; complete → scored ──
  const ipipReq = ipipQuestions.filter((q) => q.required !== false);
  const ipipAnswers119 = ipipReq.slice(0, ipipReq.length - 1).map((q) => ({
    questionId: q.id,
    questionNumber: q.questionNumber,
    selectedValue: 3,
  }));
  await autosave(stIpip.sessionId, ipipAnswers119);
  const ipipIncomplete = await api(`/assessments/sessions/${stIpip.sessionId}/submit`, { method: "POST", token: S.tokenSA });
  assert(
    ipipIncomplete.status === 400 && /unanswered|required/i.test(ipipIncomplete.json?.message || ""),
    "IPIP submit with unanswered questions BLOCKED with clear warning",
    `${ipipIncomplete.status} ${ipipIncomplete.json?.message}`
  );

  const ipipAll = ipipQuestions.map((q) => ({
    questionId: q.id,
    questionNumber: q.questionNumber,
    selectedValue: q.questionNumber % 2 === 0 ? 4 : 3,
  }));
  await autosave(stIpip.sessionId, ipipAll);
  const ipipDone = await api(`/assessments/sessions/${stIpip.sessionId}/submit`, { method: "POST", token: S.tokenSA });
  assert(ipipDone.status === 200, "IPIP submit succeeds once all 120 answered", ipipDone.json?.message);
  const ipipScore = await AssessmentScore.findOne({ sessionId: stIpip.sessionId }).lean();
  assert(Boolean(ipipScore), "IPIP score exists IMMEDIATELY after submit (auto-scored)");

  // Positive control: the OWN student's IPIP results route now returns real data
  const ownIpipRes = await api(`/counselor/students/${S.studentAId}/assessments/ipip-neo-120/results`, { token: S.tokenA });
  assert(
    ownIpipRes.status === 200 && ownIpipRes.json?.data && String(ownIpipRes.json.data.studentId || ownIpipRes.json.data.clientId || "") === String(S.studentAId),
    "own student's IPIP results route returns that student's score (200, correctly scoped)",
    `status=${ownIpipRes.status}`
  );
  assert(Array.isArray(ipipScore?.domainScores) && ipipScore.domainScores.length === 5, "IPIP score has 5 domain scores");
  assert(
    ipipScore.domainScores.every((d) => d.domain && typeof d.rawScore === "number" && d.band && d.band.length > 0),
    "IPIP domain scores carry real rawScore + band",
    JSON.stringify(ipipScore.domainScores.map((d) => `${d.domain}:${d.band}`))
  );

  // ── Interest Profiler: 0 boxes must still submit ──
  const stInt = await startSession(aInt.id);
  assert(stInt.status === 200 && stInt.sessionId, "student starts Interest Profiler session");
  const intQuestions = await getQuestions(stInt.sessionId);
  assert(intQuestions.length === 60, "Interest questions fetched (60)");
  const intEmpty = await api(`/assessments/sessions/${stInt.sessionId}/submit`, { method: "POST", token: S.tokenSA });
  assert(intEmpty.status === 200, "Interest Profiler submits with ZERO boxes checked (no false blocking)", `${intEmpty.status} ${intEmpty.json?.message}`);
  const intScore = await AssessmentScore.findOne({ sessionId: stInt.sessionId }).lean();
  assert(Boolean(intScore), "Interest Profiler auto-scored on submit");
  assert(Array.isArray(intScore?.categoryScores) && intScore.categoryScores.length === 6, "Interest score has 6 RIASEC categories");
  assert(Boolean(intScore?.hollandCode), "Interest score produced a Holland code", `code=${intScore?.hollandCode}`);

  // ── WIL: forced-rank constraint must be genuinely enforced ──
  const stWil = await startSession(aWil.id);
  assert(stWil.status === 200 && stWil.sessionId, "student starts WIL session");
  const wilQuestions = await getQuestions(stWil.sessionId);
  assert(wilQuestions.length === 20, "WIL questions fetched (20)");
  // Attempt #1: all 20 answered but all in column 1 → must be BLOCKED
  const wilBad = wilQuestions.map((q) => ({ questionId: q.id, questionNumber: q.questionNumber, selectedValue: 1 }));
  await autosave(stWil.sessionId, wilBad);
  const wilBlocked = await api(`/assessments/sessions/${stWil.sessionId}/submit`, { method: "POST", token: S.tokenSA });
  assert(
    wilBlocked.status === 400,
    "WIL submit with ALL items in one column BLOCKED (forced-rank genuinely enforced)",
    `${wilBlocked.status} ${wilBlocked.json?.message || "(unexpectedly accepted)"}`
  );

  // If the invalid submission slipped through (bug), create a fresh assignment+session for the valid run
  let wilSessionId = stWil.sessionId;
  if (wilBlocked.status !== 400) {
    const aWil2 = await assign(defByCode.wil);
    const stWil2 = await startSession(aWil2.id);
    wilSessionId = stWil2.sessionId;
    console.log("    ⚠ invalid WIL distribution was accepted — re-testing with a fresh session");
  }

  // Attempt #2: valid distribution — exactly 4 per column, crafted so
  // 'achievement' (2 cards × mult 3) lands top for a math spot-check.
  const wilAll = await getQuestions(wilSessionId);
  const byValue = {};
  for (const q of wilAll) {
    const v = q.domain || "other";
    (byValue[v] = byValue[v] || []).push(q);
  }
  const targetValue = Object.keys(byValue).find((v) => byValue[v].length === 2) || "achievement";
  const assignments = {}; // qid -> column
  const filler = [];
  const targetCards = byValue[targetValue] || [];
  targetCards.forEach((q, i) => {
    assignments[q.id] = 5;
  });
  for (const v of Object.keys(byValue)) {
    if (v === targetValue) continue;
    for (const q of byValue[v]) filler.push(q);
  }
  // top up column 5 to exactly 4 from filler
  let fillerIdx = 0;
  while (Object.values(assignments).filter((c) => c === 5).length < 4 && fillerIdx < filler.length) {
    assignments[filler[fillerIdx].id] = 5;
    fillerIdx += 1;
  }
  // distribute the rest 4-per-column across 4..1
  let col = 4;
  let inCol = 0;
  for (const q of filler) {
    if (assignments[q.id] !== undefined) continue;
    assignments[q.id] = col;
    inCol += 1;
    if (inCol === 4) {
      col -= 1;
      inCol = 0;
    }
  }
  const colCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const c of Object.values(assignments)) colCounts[c] += 1;
  assert(
    Object.values(colCounts).every((c) => c === 4) && Object.keys(assignments).length === 20,
    "crafted WIL distribution has exactly 4 items in each of the 5 columns",
    JSON.stringify(colCounts)
  );

  const wilGood = wilAll.map((q) => ({ questionId: q.id, questionNumber: q.questionNumber, selectedValue: assignments[q.id] }));
  await autosave(wilSessionId, wilGood);
  const wilDone = await api(`/assessments/sessions/${wilSessionId}/submit`, { method: "POST", token: S.tokenSA });
  assert(wilDone.status === 200, "WIL valid distribution submits successfully", `${wilDone.status} ${wilDone.json?.message}`);
  const wilScore = await AssessmentScore.findOne({ sessionId: wilSessionId }).lean();
  assert(Boolean(wilScore), "WIL auto-scored on submit");
  assert(Array.isArray(wilScore?.workValueScores) && wilScore.workValueScores.length === 6, "WIL score has 6 work-value scores");

  // WIL math spot-check: replicate the scorer (rawSum × multiplier) and compare
  const wilQuestionsDb = await mongoose.connection.db
    .collection("assessmentquestions")
    .find({ assessmentId: wilScore.assessmentDefinitionId })
    .toArray();
  const respDoc = await AssessmentResponse.findOne({ sessionId: wilSessionId }).lean();
  const respMap = new Map();
  for (const r of respDoc?.responses || []) {
    respMap.set(String(r.questionId), Number(r.selectedValue));
    respMap.set(`n${r.questionNumber}`, Number(r.selectedValue));
  }
  const expected = {};
  for (const q of wilQuestionsDb) {
    const val = respMap.get(String(q._id)) ?? respMap.get(`n${q.questionNumber}`);
    if (val === undefined) continue;
    const mult = typeof q.weight === "number" && q.weight > 0 ? q.weight : 1;
    expected[q.domain] = (expected[q.domain] || 0) + val * mult;
  }
  const sortedExpected = Object.entries(expected).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const topExpected = sortedExpected[0][0];
  assert(
    wilScore.topWorkValues?.[0] === topExpected,
    "WIL top work value matches hand-computed weighted scores (math spot-check)",
    `expected=${topExpected}(${sortedExpected[0][1]}) got=${wilScore.topWorkValues?.[0]}`
  );
  assert(
    wilScore.workValueScores.find((w) => w.code === topExpected)?.weightedScore === sortedExpected[0][1],
    "WIL weightedScore equals rawSum×multiplier exactly",
    `expected ${sortedExpected[0][1]}`
  );

  // completedAssessmentCount for the interview module (3 done)
  const engagementBefore = await api(`/counselor/students/${S.studentAId}/interview-engagement`, { token: S.tokenA });
  assert(
    engagementBefore.json?.data?.completedAssessmentCount === 3,
    "engagement reports 3 completed assessments (auto-scored)",
    `count=${engagementBefore.json?.data?.completedAssessmentCount}`
  );

  // ─────────────────────────────────────────────────────────────────
  // SECTION 4 — RETAKE SYSTEM
  // ─────────────────────────────────────────────────────────────────
  console.log("\n── SECTION 4: Retake System ──");

  const retakeReason = `AUDIT-RETAKE-${stamp} typed reason with spaces`;
  const retakeRes = await api(`/assessments/sessions/${stIpip.sessionId}/retake`, {
    method: "POST",
    token: S.tokenA,
    body: { reason: retakeReason },
  });
  assert(retakeRes.status === 200, "counselor requests retake on completed IPIP (200)", retakeRes.json?.message);

  const origSession = await AssessmentSession.findById(stIpip.sessionId).lean();
  assert(origSession?.status === "superseded", "original session marked SUPERSEDED (not deleted)", `status=${origSession?.status}`);
  const newSession = await AssessmentSession.findOne({ retakeOf: stIpip.sessionId }).lean();
  assert(Boolean(newSession) && newSession.status === "not_started", "retake created a REAL new session (not_started)");
  assert(origSession?.supersededBy && String(origSession.supersededBy) === String(newSession._id), "supersededBy link set on original");

  const retakeDoc = await RetakeRequest.findOne({ originalSessionId: stIpip.sessionId }).lean();
  assert(Boolean(retakeDoc), "RetakeRequest audit record created");
  assert(retakeDoc?.reason === retakeReason, "retake reason captures REAL typed input", `got="${retakeDoc?.reason}"`);
  assert(String(retakeDoc?.studentId) === String(S.studentAId), "RetakeRequest scoped to correct student");

  const scoreAfterRetake = await AssessmentScore.findOne({ sessionId: stIpip.sessionId }).lean();
  assert(scoreAfterRetake?.isCurrent === false, "original score marked isCurrent=false");

  // The "everything shows Retake Requested" bug check — OTHER assessment unaffected
  const intSessionDoc = await AssessmentSession.findById(stInt.sessionId).lean();
  assert(
    intSessionDoc?.status !== "superseded" && intSessionDoc?.status !== "not_started",
    "Interest Profiler session status UNCHANGED by IPIP retake",
    `status=${intSessionDoc?.status}`
  );

  // Main assessment list: one row per (student, assessment), current session only
  const counselorAssignments = await api("/assessments/counselor-assignments", { token: S.tokenA });
  const rows = counselorAssignments.json?.data?.assignments || [];
  const myRows = rows.filter((r) => String(r.studentId?._id || r.studentId) === String(S.studentAId));
  const perDef = {};
  for (const r of myRows) {
    const defId = String(r.assessmentDefinitionId?.id || r.assessmentDefinitionId || "");
    perDef[defId] = (perDef[defId] || 0) + 1;
  }
  assert(
    Object.keys(perDef).length >= 3 && Object.values(perDef).every((n) => n === 1),
    "counselor assessment list shows ONE row per student+assessment (deduped, no duplicates)",
    JSON.stringify(perDef)
  );
  const ipipRow = myRows.find((r) => String(r.assessmentDefinitionId?.id || r.assessmentDefinitionId) === String(defByCode.ipip._id));
  assert(
    ipipRow && ipipRow.sessionSummary && String(ipipRow.sessionSummary.sessionId) === String(newSession._id),
    "list shows the CURRENT (non-superseded) session per assessment"
  );

  // Review detail: previous attempts preserved with the real reason
  const reviewDetail = await api(`/assessments/assignments/${aIpip.id}/review-detail`, { token: S.tokenA });
  assert(reviewDetail.status === 200, "counselor review-detail loads (200)");
  const prev = reviewDetail.json?.data?.previousAttempts || [];
  assert(prev.length >= 1, "previousAttempts preserved (history not wiped)", `attempts=${prev.length}`);
  assert(prev[0]?.reason === retakeReason, "previous attempt shows the real retake reason");
  assert(
    String(reviewDetail.json?.data?.session?.id) === String(newSession._id),
    "review-detail current session is the NEW retake session"
  );

  // ─────────────────────────────────────────────────────────────────
  // SECTION 5 — INTERVIEW MODULE (Phase 1 + Phase 2)
  // ─────────────────────────────────────────────────────────────────
  console.log("\n── SECTION 5: Interview Module (Phase 1 + Phase 2) ──");

  const startEng = await api(`/counselor/students/${S.studentAId}/interview-engagement`, { method: "POST", token: S.tokenA });
  assert(startEng.status === 201, "start interview engagement (201)");
  const engagementId = startEng.json?.data?.engagement?.id;
  assert(Boolean(engagementId), "engagement has id");

  const candRes = await api(`/counselor/interview-engagements/${engagementId}/sessions`, { method: "POST", token: S.tokenA, body: { sessionType: "candidate" } });
  assert(candRes.status === 201, "create candidate session (201)");
  const candSessionId = candRes.json?.data?.session?.id;
  const profRes = await api(`/counselor/interview-engagements/${engagementId}/sessions`, { method: "POST", token: S.tokenA, body: { sessionType: "professional_self" } });
  assert(profRes.status === 201, "create professional session (201)");
  const parentRes = await api(`/counselor/interview-engagements/${engagementId}/sessions`, { method: "POST", token: S.tokenA, body: { sessionType: "parent" } });
  assert(
    parentRes.status === 400 && /Parent sessions are not currently available/.test(parentRes.json?.message || ""),
    "parent session creation blocked at API level with clear message",
    `${parentRes.status} ${parentRes.json?.message}`
  );

  // Generate + grounding check against the deterministic priority service
  const gen = await api(`/counselor/interview-sessions/${candSessionId}/generate-questions`, { method: "POST", token: S.tokenA });
  assert(gen.status === 201, "generate question set (201)", gen.json?.message);
  const qs = gen.json?.data?.questionSet;
  const qbc = qs?.questionsByCluster || [];
  const clusterNames = qbc.map((c) => c.cluster);
  assert(qbc.length === 6, "all 6 clusters present", `got=${qbc.length}`);
  assert(new Set(clusterNames).size === clusterNames.length, "each cluster appears EXACTLY ONCE (no duplicates)", JSON.stringify(clusterNames));
  const prioritiesInSet = Object.fromEntries((qs?.clusterPriorities || []).map((c) => [c.cluster, c.priority]));
  const isSorted = qbc.every((c, i, arr) => i === 0 || RANK[arr[i - 1].priority] <= RANK[c.priority]);
  assert(isSorted, "clusters sorted High → Medium → Light", qbc.map((c) => `${c.cluster}:${c.priority}`).join(", "));

  // Grounding: compare with the deterministic service for THIS student's real scores
  const { priorities: groundPriorities } = await clusterPriorityService.computeClusterPriorities(S.studentAId);
  const groundMatch = qbc.every((c) => prioritiesInSet[c.cluster] === groundPriorities[c.cluster]);
  assert(
    groundMatch && qs?.clusterPriorities?.length === 6,
    "cluster priorities grounded in student's real scores (match deterministic service)",
    JSON.stringify(prioritiesInSet)
  );
  assert(prioritiesInSet.identity_direction === groundPriorities.identity_direction, `priority grounded: identity_direction=${prioritiesInSet.identity_direction}`);

  // Approve
  const edited = JSON.parse(JSON.stringify(qbc));
  if (edited[0]?.questions?.length) edited[0].questions[0] = `${edited[0].questions[0]} [audit edit]`;
  const approve = await api(`/counselor/interview-sessions/${candSessionId}/questions`, {
    method: "PATCH",
    token: S.tokenA,
    body: { questionsByCluster: edited, reviewedByCounselor: true },
  });
  assert(approve.status === 200 && approve.json?.data?.questionSet?.reviewedByCounselor === true, "approve question set → reviewedByCounselor=true");
  const sessionDoc = await InterviewSession.findById(candSessionId).lean();
  assert(sessionDoc?.status === "approved", "session status → approved");

  // Phase 2 — consent gate
  const wav = makeWav(2);
  const noConsentForm = new FormData();
  noConsentForm.append("audio", new Blob([wav], { type: "audio/wav" }), "audit.wav");
  const noConsent = await api(`/counselor/interview-sessions/${candSessionId}/audio`, { method: "POST", token: S.tokenA, form: noConsentForm });
  assert(
    noConsent.status === 403 && /Audio recording consent required/.test(noConsent.json?.message || ""),
    "audio upload BLOCKED without consent (403, clear message)",
    `${noConsent.status} ${noConsent.json?.message}`
  );

  const consentRes = await api(`/clients/${S.studentAId}/consent`, { method: "PATCH", token: S.tokenA, body: { audioRecording: { isGiven: true } } });
  assert(consentRes.status === 200, "audio consent captured via PATCH /clients/:id/consent");
  assert(consentRes.json?.data?.profile?.consentStatus?.audioRecording?.isGiven === true, "audioRecording consent persisted");

  const startSess = await api(`/counselor/interview-sessions/${candSessionId}/start`, { method: "POST", token: S.tokenA });
  assert(startSess.status === 200 && startSess.json?.data?.session?.status === "in_progress", "session start → in_progress");
  assert(Boolean(startSess.json?.data?.session?.conductedAt), "conductedAt recorded");

  const goodForm = new FormData();
  goodForm.append("audio", new Blob([wav], { type: "audio/wav" }), "audit-recording.wav");
  const upload = await api(`/counselor/interview-sessions/${candSessionId}/audio`, { method: "POST", token: S.tokenA, form: goodForm });
  assert(upload.status === 201, "valid WAV upload accepted (201)");
  const asset = upload.json?.data?.asset;
  assert(asset?.storageProvider === "gridfs", "stored in GridFS (reference-only object storage)");
  assert(Math.abs(asset?.durationSeconds - 2) < 0.3, "REAL duration extracted from file metadata (~2s)", `got=${asset?.durationSeconds}`);
  assert(upload.json?.data?.session?.status === "recorded", "session status → recorded");

  const fsFile = await mongoose.connection.db.collection("audioAssets.files").findOne({ _id: new mongoose.Types.ObjectId(asset.storageKey) });
  assert(Boolean(fsFile) && fsFile.length === wav.length, "GridFS holds the bytes (not MongoDB blob field)", `len=${fsFile?.length}`);
  const assetDoc = await AudioAsset.findById(asset.id).lean();
  assert(!assetDoc.buffer && !assetDoc.data && typeof assetDoc.storageKey === "string", "AudioAsset doc holds ONLY the reference");

  const audioInfo = await api(`/counselor/interview-sessions/${candSessionId}/audio`, { token: S.tokenA });
  const playbackPath = audioInfo.json?.data?.playbackPath;
  assert(
    /\?expires=\d+&sig=[a-f0-9]+/.test(playbackPath || ""),
    "playback uses a SIGNED, expiring URL",
    playbackPath
  );
  const streamRes = await fetch(`${BASE}${playbackPath}`);
  const streamBytes = Buffer.from(await streamRes.arrayBuffer());
  assert(streamRes.status === 200 && streamBytes.length === wav.length, "signed URL streams the recording");
  const tampered = await fetch(`${BASE}${playbackPath.replace(/sig=[a-f0-9]+/, "sig=deadbeef")}`);
  assert(tampered.status === 403, "tampered signature rejected (403)");

  const done = await api(`/counselor/interview-sessions/${candSessionId}/complete`, { method: "POST", token: S.tokenA });
  assert(done.status === 200 && done.json?.data?.session?.status === "completed", "complete session → completed");

  // Ownership: counselor B cannot touch A's session
  const bAudio = await api(`/counselor/interview-sessions/${candSessionId}/audio`, { token: S.tokenB });
  assert(bAudio.status === 404 || bAudio.status === 403, "unowned counselor blocked from session audio", `status=${bAudio.status}`);

  // ─────────────────────────────────────────────────────────────────
  // SECTION 6 — STUDENT RESULTS: friendly interpretation only
  // ─────────────────────────────────────────────────────────────────
  console.log("\n── SECTION 6: Student Results (friendly interpretation only) ──");

  const LEAK_PATTERNS = ["rawScore", "normalizedScore", "rawSum", "weightedScore", "domainScores", "dimensionScores", "categoryScores", "workValueScores", "rankedValues", "percentile", "\\bscore\\b", "\\bband\\b", "\\brank\\b"];

  const ipipResults = await api("/student/assessments/ipip-neo-120/results", { token: S.tokenSA });
  assert(ipipResults.status === 200, "student fetches IPIP results (200)");
  const ipipSerialized = JSON.stringify(ipipResults.json?.data || {});
  const ipipClean = !LEAK_PATTERNS.some((p) => new RegExp(p, "i").test(ipipSerialized));
  assert(ipipClean, "IPIP results response contains NO raw score / band / numeric fields", `keys=${Object.keys(ipipResults.json?.data || {}).join(",")}`);
  assert(Array.isArray(ipipResults.json?.data?.insights) && ipipResults.json.data.insights.length === 5, "IPIP results return 5 friendly domain interpretations");
  assert(
    ipipResults.json?.data?.insights.every((i) => i.code && i.label && i.text && Object.keys(i).every((k) => ["code", "label", "text"].includes(k))),
    "IPIP insight entries carry ONLY code/label/text (no numbers)"
  );

  const intResults = await api("/student/assessments/onet-interest-profiler-short/results", { token: S.tokenSA });
  assert(intResults.status === 200, "student fetches Interest Profiler results (200)");
  const intSerialized = JSON.stringify(intResults.json?.data || {});
  assert(!LEAK_PATTERNS.some((p) => new RegExp(p, "i").test(intSerialized)), "Interest results contain NO raw category scores");
  assert(Boolean(intResults.json?.data?.hollandCode) && Array.isArray(intResults.json?.data?.insights), "Interest results = Holland code + friendly insights only");

  const wilResults = await api("/student/assessments/onet-work-importance-locator/results", { token: S.tokenSA });
  assert(wilResults.status === 200, "student fetches WIL results (200)");
  const wilSerialized = JSON.stringify(wilResults.json?.data || {});
  assert(!LEAK_PATTERNS.some((p) => new RegExp(p, "i").test(wilSerialized)), "WIL results contain NO raw work-value scores");
  assert(Array.isArray(wilResults.json?.data?.topWorkValues) && Array.isArray(wilResults.json?.data?.insights), "WIL results = top work values + friendly insights only");

  // Counselor side DOES have raw scores (audit trail) — sanity check. The
  // current session is now the retake (unscored), so verify the previous
  // attempt's score AND the raw response values carry real numbers.
  const counselorDetail = await api(`/assessments/assignments/${aIpip.id}/review-detail`, { token: S.tokenA });
  const prevScore = counselorDetail.json?.data?.previousAttempts?.[0]?.score;
  const rawRes = counselorDetail.json?.data?.rawResponses || [];
  assert(
    Array.isArray(prevScore?.domainScores) &&
      prevScore.domainScores.length === 5 &&
      typeof prevScore.domainScores[0].rawScore === "number",
    "counselor review trail carries real domain scores (previous attempt)"
  );
  // The retake session correctly has no raw responses yet — verify the raw
  // audit trail against the (non-retaken) WIL assignment instead.
  const wilDetail = await api(`/assessments/assignments/${aWil.id}/review-detail`, { token: S.tokenA });
  const wilRaw = wilDetail.json?.data?.rawResponses || [];
  assert(
    wilRaw.length === 20 && typeof wilRaw[0].selectedValue === "number",
    "counselor raw-response audit trail carries real per-item values",
    `items=${wilRaw.length}`
  );

  // ─────────────────────────────────────────────────────────────────
  // SECTION 7 — PROFILE COMPLETENESS parity
  // ─────────────────────────────────────────────────────────────────
  console.log("\n── SECTION 7: Profile Completeness (Intake Progress parity) ──");

  const pctBefore1 = (await api("/profile/completeness", { token: S.tokenSA })).json?.data?.completenessPercentage;
  const listBefore = await api("/clients?limit=100", { token: S.tokenA });
  const entryBefore = (listBefore.json?.data?.clients || []).find((c) => String(c.userId?._id || c.userId) === String(S.studentAId));
  assert(
    Number(entryBefore?.completionPercentage) === Number(pctBefore1),
    "completeness % matches between student profile view and counselor list BEFORE fill",
    `student=${pctBefore1} counselorList=${entryBefore?.completionPercentage}`
  );

  // Fill the profile
  const fill = await api("/profile", {
    method: "PATCH",
    token: S.tokenSA,
    body: {
      phone: "+91 98765 43210",
      gender: "female",
      dateOfBirth: new Date("2005-06-15").toISOString(),
      education: [{ institution: "Audit University", degree: "B.Sc.", fieldOfStudy: "Computer Science", startYear: 2022, endYear: 2026, gradeGpa: "8.5" }],
      careerGoals: ["Data Scientist"],
      targetIndustries: ["Technology"],
      skills: ["Python", "SQL"],
      languages: ["English", "Hindi"],
    },
  });
  assert(fill.status === 200, "student fills profile via Edit Profile form (PATCH /profile)", `${fill.status} ${fill.json?.message}`);

  const pctAfter1 = (await api("/profile/completeness", { token: S.tokenSA })).json?.data?.completenessPercentage;
  const listAfter = await api("/clients?limit=100", { token: S.tokenA });
  const entryAfter = (listAfter.json?.data?.clients || []).find((c) => String(c.userId?._id || c.userId) === String(S.studentAId));
  assert(
    Number(entryAfter?.completionPercentage) === Number(pctAfter1),
    "completeness % matches between student profile view and counselor list AFTER fill",
    `student=${pctAfter1} counselorList=${entryAfter?.completionPercentage}`
  );
  assert(Number(pctAfter1) > Number(pctBefore1), "percentage actually increased after filling", `${pctBefore1}% → ${pctAfter1}%`);

  // ─────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────
  console.log("\n════════════════════════════════════════════════════════");
  console.log(`  RESULT: ${passed} passed, ${failures} failed`);
  console.log("════════════════════════════════════════════════════════\n");

  // ─────────────────────────────────────────────────────────────────
  // CLEANUP — remove every document this audit created
  // ─────────────────────────────────────────────────────────────────
  const allUserIds = [S.counselorAId, S.counselorBId, S.studentAId, S.studentBId].filter(Boolean);
  const sessionsForA = await AssessmentSession.find({ clientId: S.studentAId }).select("_id");
  const sessionIdsA = sessionsForA.map((s) => s._id);
  const engIds = await InterviewEngagement.find({ studentId: S.studentAId }).select("_id");
  const engIdList = engIds.map((e) => e._id);
  const interviewSessionIds = await InterviewSession.find({ engagementId: { $in: engIdList } }).select("_id");
  const isIdList = interviewSessionIds.map((s) => s._id);
  const audioIds = await AudioAsset.find({ sessionId: { $in: isIdList } }).select("storageKey");
  for (const a of audioIds) {
    try {
      const fid = new mongoose.Types.ObjectId(a.storageKey);
      await mongoose.connection.db.collection("audioAssets.files").deleteOne({ _id: fid });
      await mongoose.connection.db.collection("audioAssets.chunks").deleteMany({ files_id: fid });
    } catch { /* already gone */ }
  }
  await AudioAsset.deleteMany({ sessionId: { $in: isIdList } });
  await InterviewQuestionSet.deleteMany({ sessionId: { $in: isIdList } });
  await InterviewSession.deleteMany({ _id: { $in: isIdList } });
  await InterviewEngagement.deleteMany({ _id: { $in: engIdList } });
  await RetakeRequest.deleteMany({ studentId: S.studentAId });
  await AssessmentResponse.deleteMany({ clientId: S.studentAId });
  await AssessmentScore.deleteMany({ $or: [{ clientId: S.studentAId }, { studentId: S.studentAId }] });
  await AssessmentSession.deleteMany({ clientId: S.studentAId });
  await Notification.deleteMany({ userId: S.studentAId });
  const AssignmentModel = require("../src/modules/assessments/assessmentAssignment.model").AssessmentAssignment;
  await AssignmentModel.deleteMany({ studentId: { $in: [S.studentAId, S.studentBId] } });
  await InviteCode.deleteMany({ ownerId: { $in: [S.counselorAId, S.counselorBId] } });
  await StudentProfile.deleteMany({ userId: { $in: allUserIds } });
  await User.deleteMany({ _id: { $in: allUserIds } });
  // cleanup any users created by negative signup tests (all threw before create, but be safe)
  await User.deleteMany({ email: { $in: [`audit.admin.${stamp}@example.com`, `audit.parent.${stamp}@example.com`, `audit.nocode.${stamp}@example.com`] } });
  console.log("  🧹 cleanup: removed all audit-created data.");

  await mongoose.disconnect();
  process.exit(failures > 0 ? 1 : 0);
}

// Priority rank for sortedness check
const RANK = { high: 0, medium: 1, light: 2 };

main().catch(async (e) => {
  console.error("❌ Audit failed with an exception:", e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
