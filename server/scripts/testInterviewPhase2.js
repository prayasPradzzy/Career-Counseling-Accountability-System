/**
 * testInterviewPhase2.js
 * End-to-end verification of the Phase 2 dual-session structure & recording:
 *
 *   • Consent gate — upload is BLOCKED (403) before audio consent exists
 *   • Consent capture via PATCH /clients/:id/consent (audioRecording)
 *   • Status flow: approved → start (in_progress + conductedAt)
 *     → upload (recorded + real duration from file metadata)
 *     → signed playback URL → complete (completed)
 *   • Storage: file lives in GridFS (audioAssets bucket); AudioAsset doc
 *     holds only the reference — never the binary
 *   • Signed URL: valid token streams 200; bad/expired tokens rejected
 *   • Validation: wrong format rejected (400); ownership enforced (403)
 *
 * Usage (from the server directory, with the API running on :5000):
 *   node scripts/testInterviewPhase2.js
 */
const mongoose = require("mongoose");
const crypto = require("crypto");
require("dotenv").config({ path: "./.env" });

const connectDB = require("../src/database/connectDB");
const User = require("../src/modules/users/user.model");
const StudentProfile = require("../src/modules/profiles/studentProfile.model");
const InterviewEngagement = require("../src/modules/interviews/interviewEngagement.model");
const InterviewSession = require("../src/modules/interviews/interviewSession.model");
const InterviewQuestionSet = require("../src/modules/interviews/interviewQuestionSet.model");
const AudioAsset = require("../src/modules/interviews/audioAsset.model");

const BASE = process.env.TEST_API_URL || "http://localhost:5000/api/v1";
const PASSWORD = "InterviewPhase2Test!1";
const stamp = Date.now().toString(36);
const COUNSELOR_EMAIL = `p2.counselor.${stamp}@example.com`;
const OTHER_EMAIL = `p2.other.${stamp}@example.com`;
const STUDENT_EMAIL = `p2.student.${stamp}@example.com`;

let failures = 0;
function assert(cond, label, extra) {
  const ok = Boolean(cond);
  if (!ok) failures += 1;
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

async function main() {
  await connectDB();
  console.log(`\n=== Phase 2: session conduction + recording (student ${STUDENT_EMAIL}) ===`);

  // ── Fixtures: counselor, another counselor, student ──────────────────────
  const counselor = await User.create({
    firstName: "Phase2",
    lastName: "Counselor",
    email: COUNSELOR_EMAIL,
    password: PASSWORD,
    role: "counselor",
  });
  const other = await User.create({
    firstName: "Phase2",
    lastName: "Other",
    email: OTHER_EMAIL,
    password: PASSWORD,
    role: "counselor",
  });
  const student = await User.create({
    firstName: "Phase2",
    lastName: "Student",
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

  const login = await api("/auth/login", {
    method: "POST",
    body: { email: COUNSELOR_EMAIL, password: PASSWORD },
  });
  const token = login.json?.data?.token;
  assert(Boolean(token), "counselor login returns a token");
  const otherLogin = await api("/auth/login", {
    method: "POST",
    body: { email: OTHER_EMAIL, password: PASSWORD },
  });
  const otherToken = otherLogin.json?.data?.token;

  const studentId = String(student._id);

  // ── Engagement + session + approved question set (reuse Phase 1 flow) ───
  const start = await api(`/counselor/students/${studentId}/interview-engagement`, {
    method: "POST",
    token,
  });
  assert(start.status === 201, "start engagement");
  assert(start.json?.data?.audioConsent?.isGiven === false, "engagement response reports audio consent NOT given");
  const engagementId = start.json?.data?.engagement?.id;

  const sessionRes = await api(`/counselor/interview-engagements/${engagementId}/sessions`, {
    method: "POST",
    token,
    body: { sessionType: "candidate" },
  });
  const sessionId = sessionRes.json?.data?.session?.id;
  assert(Boolean(sessionId), "create candidate session");

  // Approve the session directly (Phase 2 tests conduction/recording, not
  // question generation — that flow is already covered by testInterviewFlow.js).
  const sessionDoc = await InterviewSession.findById(sessionId);
  await InterviewQuestionSet.create({
    sessionId,
    clusterPriorities: [{ cluster: "motivation_drive", priority: "high" }],
    questionsByCluster: [
      {
        cluster: "motivation_drive",
        priority: "high",
        questions: ["Tell me about your goals?"],
        rationale: "test fixture",
      },
    ],
    reviewedByCounselor: true,
  });
  sessionDoc.status = "approved";
  await sessionDoc.save();
  assert(true, "session fixture approved (direct DB setup)");

  // ── Consent gate ──────────────────────────────────────────────────────────
  const wav = makeWav(2);
  const noConsentForm = new FormData();
  noConsentForm.append("audio", new Blob([wav], { type: "audio/wav" }), "recording.wav");
  const noConsent = await api(`/counselor/interview-sessions/${sessionId}/audio`, {
    method: "POST",
    token,
    form: noConsentForm,
  });
  assert(
    noConsent.status === 403 && /Audio recording consent required/.test(noConsent.json?.message || ""),
    "upload BLOCKED without audio consent (403 + clear message)",
    `status=${noConsent.status} msg=${noConsent.json?.message}`
  );

  // ── Capture audio consent (without touching general consent) ────────────
  const consentRes = await api(`/clients/${studentId}/consent`, {
    method: "PATCH",
    token,
    body: { audioRecording: { isGiven: true } },
  });
  assert(consentRes.status === 200, "capture audio consent via PATCH /clients/:id/consent");
  const consentProfile = consentRes.json?.data?.profile;
  assert(consentProfile?.consentStatus?.audioRecording?.isGiven === true, "audioRecording consent persisted");
  assert(consentProfile?.consentStatus?.isGiven === false, "general data consent untouched by audio-only patch");

  const engAfter = await api(`/counselor/students/${studentId}/interview-engagement`, { token });
  assert(engAfter.json?.data?.audioConsent?.isGiven === true, "engagement response now reports audio consent given");

  // ── Start session (must be approved first) ───────────────────────────────
  const startSession = await api(`/counselor/interview-sessions/${sessionId}/start`, {
    method: "POST",
    token,
  });
  assert(startSession.status === 200, "start session");
  assert(startSession.json?.data?.session?.status === "in_progress", "session status → in_progress");
  assert(Boolean(startSession.json?.data?.session?.conductedAt), "conductedAt recorded");

  // ── Format validation: reject a .txt masquerading as audio ───────────────
  const badForm = new FormData();
  badForm.append("audio", new Blob([Buffer.from("definitely not audio")], { type: "text/plain" }), "notes.txt");
  const badUpload = await api(`/counselor/interview-sessions/${sessionId}/audio`, {
    method: "POST",
    token,
    form: badForm,
  });
  assert(badUpload.status === 400 && /Unsupported audio format/.test(badUpload.json?.message || ""), "wrong format rejected (400)", badUpload.json?.message);

  // ── Valid upload ──────────────────────────────────────────────────────────
  const goodForm = new FormData();
  goodForm.append("audio", new Blob([wav], { type: "audio/wav" }), "session-recording.wav");
  const upload = await api(`/counselor/interview-sessions/${sessionId}/audio`, {
    method: "POST",
    token,
    form: goodForm,
  });
  assert(upload.status === 201, "valid WAV upload accepted (201)");
  const asset = upload.json?.data?.asset;
  assert(Boolean(asset?.id) && asset?.storageProvider === "gridfs", "AudioAsset created with storageProvider gridfs");
  assert(Math.abs(asset?.durationSeconds - 2) < 0.2, "REAL duration extracted from file metadata (~2s)", `got=${asset?.durationSeconds}`);
  assert(asset?.fileSizeBytes === wav.length, "fileSizeBytes matches uploaded bytes");
  assert(upload.json?.data?.session?.status === "recorded", "session status → recorded");
  assert(upload.json?.data?.session?.audioAssetId === asset?.id, "session.audioAssetId set to asset reference");
  assert(Math.abs(upload.json?.data?.session?.actualDuration - 2) < 0.2, "session.actualDuration set from metadata");

  // ── Storage truth: GridFS holds the bytes, AudioAsset holds only a ref ──
  const fsFile = await mongoose.connection.db
    .collection("audioAssets.files")
    .findOne({ _id: new mongoose.Types.ObjectId(asset.storageKey) });
  assert(Boolean(fsFile), "GridFS file document exists in audioAssets bucket");
  assert(fsFile?.length === wav.length, "GridFS stores the exact byte length");
  const chunkCount = await mongoose.connection.db
    .collection("audioAssets.chunks")
    .countDocuments({ files_id: new mongoose.Types.ObjectId(asset.storageKey) });
  assert(chunkCount > 0, "GridFS chunks present", `chunks=${chunkCount}`);
  const assetDoc = await AudioAsset.findById(asset.id).lean();
  const docHasNoBinary =
    !assetDoc.buffer && !assetDoc.data && typeof assetDoc.storageKey === "string";
  assert(docHasNoBinary, "AudioAsset doc contains only the reference (no binary blob)");

  // ── Signed playback URL ──────────────────────────────────────────────────
  const audioInfo = await api(`/counselor/interview-sessions/${sessionId}/audio`, { token });
  assert(audioInfo.status === 200, "GET audio returns signed URL");
  const playbackPath = audioInfo.json?.data?.playbackPath;
  assert(/\/interview-audio\/sessions\/.*\/stream\?expires=\d+&sig=[a-f0-9]+/.test(playbackPath || ""), "playback path is signed + expiring", playbackPath);
  assert(audioInfo.json?.data?.ttlSeconds === 7200, "URL TTL is 2 hours");

  // Stream with the valid token → 200 + bytes
  const streamRes = await fetch(`${BASE}${playbackPath}`);
  const streamBytes = Buffer.from(await streamRes.arrayBuffer());
  assert(streamRes.status === 200, "stream endpoint serves the recording (200)");
  assert(streamBytes.length === wav.length, "streamed bytes match the uploaded file");

  // Tampered signature → 403
  const tampered = `${BASE}${playbackPath.replace(/sig=[a-f0-9]+/, "sig=deadbeef")}`;
  const tamperedRes = await fetch(tampered);
  assert(tamperedRes.status === 403, "tampered signature rejected (403)");

  // Expired signature → 403 (crafted with an old expiry)
  const expiredAt = Date.now() - 1000;
  const payload = `${sessionId}:${expiredAt}`;
  const expiredSig = crypto.createHmac("sha256", process.env.JWT_SECRET).update(payload).digest("hex");
  const expiredUrl = `${BASE}/interview-audio/sessions/${sessionId}/stream?expires=${expiredAt}&sig=${expiredSig}`;
  const expiredRes = await fetch(expiredUrl);
  assert(expiredRes.status === 403, "expired signature rejected (403)");

  // ── Ownership: another counselor cannot mint a playback URL ─────────────
  // (findOwnedEngagement filters by counselorId, so a non-owner gets 404 —
  // same ownership-filter pattern used everywhere else in this project.)
  const otherAudio = await api(`/counselor/interview-sessions/${sessionId}/audio`, {
    token: otherToken,
  });
  assert(
    otherAudio.status === 404 || otherAudio.status === 403,
    "unowned counselor blocked from playback URL",
    `status=${otherAudio.status}`
  );

  // ── Complete ─────────────────────────────────────────────────────────────
  const incomplete = await api(`/counselor/interview-sessions/${sessionId}/complete`, {
    method: "POST",
    token,
    body: {},
  });
  // NOTE: this session IS recorded at this point, so complete succeeds below.
  const done = await api(`/counselor/interview-sessions/${sessionId}/complete`, {
    method: "POST",
    token,
  });
  assert(done.status === 200 && done.json?.data?.session?.status === "completed", "complete recorded session → completed");

  // ── Validation: cannot start a completed session again ──────────────────
  const restart = await api(`/counselor/interview-sessions/${sessionId}/start`, {
    method: "POST",
    token,
  });
  assert(restart.status === 400, "cannot start a completed session (400)", restart.json?.message);

  if (failures > 0) {
    console.error(`\n❌ Phase 2 FAILED with ${failures} assertion(s).`);
  } else {
    console.log("\n=== PHASE 2 PASSED ✅ ===");
    console.log("Consent gate, storage, real-duration extraction, signed playback, and the");
    console.log("approved → in_progress → recorded → completed flow all verified end-to-end.");
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────
  // Remove exactly the GridFS file this test uploaded (file + chunks).
  if (asset?.storageKey) {
    const fileId = new mongoose.Types.ObjectId(asset.storageKey);
    await mongoose.connection.db.collection("audioAssets.files").deleteOne({ _id: fileId });
    await mongoose.connection.db.collection("audioAssets.chunks").deleteMany({ files_id: fileId });
  }
  await AudioAsset.deleteMany({ sessionId });
  const sessions = await InterviewSession.find({ engagementId: { $in: await InterviewEngagement.find({ studentId: student._id }).select("_id") } }).select("_id");
  const sessionIds = sessions.map((s) => s._id);
  await InterviewQuestionSet.deleteMany({ sessionId: { $in: sessionIds } });
  await InterviewSession.deleteMany({ _id: { $in: sessionIds } });
  await InterviewEngagement.deleteMany({ studentId: student._id });
  await StudentProfile.deleteMany({ userId: { $in: [student._id, counselor._id, other._id] } });
  await User.deleteMany({ _id: { $in: [student._id, counselor._id, other._id] } });
  console.log("  🧹 cleanup: removed fabricated test data.");

  await mongoose.disconnect();
  process.exit(failures > 0 ? 1 : 0);
}

main().catch(async (e) => {
  console.error("❌ Test failed:", e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
