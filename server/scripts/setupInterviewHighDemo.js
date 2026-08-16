/**
 * setupInterviewHighDemo.js
 * Creates a demo student whose assessment profile SHOULD trigger
 * 'high' priority clusters (per clusterWeightingRules.json), then
 * runs the full API flow to produce a fresh, approved question set —
 * so the Interview tab can be visually verified with a High cluster
 * present (Part A of the interview fixes).
 *
 * Run (API on :5000): node scripts/setupInterviewHighDemo.js
 */
const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

const connectDB = require("../src/database/connectDB");
const User = require("../src/modules/users/user.model");
const StudentProfile = require("../src/modules/profiles/studentProfile.model");
const AssessmentDefinition = require("../src/modules/assessments/assessmentDefinition.model");
const AssessmentSession = require("../src/modules/assessments/assessmentSession.model");
const AssessmentScore = require("../src/modules/assessments/assessmentScore.model");

const BASE = process.env.TEST_API_URL || "http://localhost:5000/api/v1";
const PASSWORD = "Password123!";
const COUNSELOR_EMAIL = "preview.counselor@example.com";
const STUDENT_EMAIL = "interview.high.demo@example.com";

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
    /* ignore */
  }
  return { status: res.status, json };
}

async function main() {
  await connectDB();

  // 1. Counselor + student
  const counselor = await User.findOne({ email: COUNSELOR_EMAIL });
  if (!counselor) throw new Error(`Counselor ${COUNSELOR_EMAIL} not found — run setupPreviewDemo.js first.`);
  let student = await User.findOne({ email: STUDENT_EMAIL });
  if (!student) {
    student = await User.create({
      firstName: "High",
      lastName: "Priority Demo",
      email: STUDENT_EMAIL,
      password: PASSWORD,
      role: "student",
      counselorId: counselor._id,
    });
  }
  let profile = await StudentProfile.findOne({ userId: student._id });
  if (!profile) {
    profile = await StudentProfile.create({
      userId: student._id,
      assignedCounselorId: counselor._id,
      onboardingSource: "counselor-invite",
    });
  }
  // audio consent on file so the conductor is fully usable in the browser
  if (!profile.consentStatus?.audioRecording?.isGiven) {
    profile.consentStatus.audioRecording = { isGiven: true, givenAt: new Date() };
    await profile.save();
  }
  console.log(`+ student ${STUDENT_EMAIL} (${student._id})`);

  // 2. Fresh score set (replace any previous run's scores)
  await AssessmentScore.deleteMany({ clientId: student._id });
  const defs = await AssessmentDefinition.find({ status: "active" });
  const byKey = Object.fromEntries(
    defs.map((d) => [String(d.metadata?.assessmentKey || "").toLowerCase(), d])
  );
  const ipip = byKey["ipip-neo-120"];
  const wil = byKey["onet-work-importance-locator"];
  const int = byKey["onet-interest-profiler-short"];
  if (!ipip || !wil || !int) throw new Error("Assessment definitions missing — re-seed.");

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

  // N=High (emotional_adaptive) + C=Low (motivation/cognitive) + E=High (social)
  await makeScore(ipip, "ipip-neo-120", "personality", {
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
  // workingConditions (emotional_adaptive) + recognition (identity_direction) top two
  await makeScore(wil, "onet-work-importance-locator", "values", {
    scoringStrategy: "onet_wil",
    topWorkValues: ["workingConditions", "recognition"],
    workValueScores: [
      { code: "workingConditions", name: "Working Conditions", rawSum: 12, weightedScore: 36, band: "High" },
      { code: "recognition", name: "Recognition", rawSum: 8, weightedScore: 16, band: "Moderate" },
    ],
  });
  // Holland SIA → social (social_relational), investigative (cognitive_decision), artistic (future_initiative)
  await makeScore(int, "onet-interest-profiler-short", "interest", {
    scoringStrategy: "riasec_holland",
    hollandCode: "SIA",
    categoryScores: [
      { code: "S", name: "Social", rawScore: 14, band: "High" },
      { code: "I", name: "Investigative", rawScore: 13, band: "High" },
      { code: "A", name: "Artistic", rawScore: 12, band: "High" },
    ],
  });
  console.log("+ scores fabricated (N=High, C=Low, E=High; WIL top2; Holland SIA)");

  // 3. Full API flow: engagement → candidate session → generate → approve
  const login = await api("/auth/login", { method: "POST", body: { email: COUNSELOR_EMAIL, password: PASSWORD } });
  const token = login.json?.data?.token;
  if (!token) throw new Error("Counselor login failed");

  let eng = await api(`/counselor/students/${student._id}/interview-engagement`, { method: "POST", token });
  const engagementId = eng.json?.data?.engagement?.id;

  const sessionRes = await api(`/counselor/interview-engagements/${engagementId}/sessions`, {
    method: "POST",
    token,
    body: { sessionType: "candidate" },
  });
  const sessionId = sessionRes.json?.data?.session?.id;

  const gen = await api(`/counselor/interview-sessions/${sessionId}/generate-questions`, { method: "POST", token });
  console.log("+ generate:", gen.json?.message, `(source=${gen.json?.data?.source})`);
  const qs = gen.json?.data?.questionSet;

  const approve = await api(`/counselor/interview-sessions/${sessionId}/questions`, {
    method: "PATCH",
    token,
    body: { questionsByCluster: qs?.questionsByCluster || [], reviewedByCounselor: true },
  });
  console.log("+ approve:", approve.json?.message);

  const priorities = (qs?.questionsByCluster || []).map((c) => `${c.cluster}=${c.priority}`);
  console.log("+ priorities:", priorities.join(", "));
  console.log(`\n✅ Demo student ready. Open in the browser:`);
  console.log(`   /students/${profile._id} → Interview tab`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (e) => {
  console.error("❌ setup failed:", e.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
