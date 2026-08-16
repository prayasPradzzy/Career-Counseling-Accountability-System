const crypto = require("crypto");
const path = require("path");
const { parseBuffer } = require("music-metadata");
const ApiError = require("../../shared/utils/ApiError");
const StudentProfile = require("../profiles/studentProfile.model");
const AudioAsset = require("./audioAsset.model");
const audioStorage = require("./audioStorage.service");

// ============================================================
// Interview Audio Service — Consent, Upload, Playback
// ============================================================
// Phase 2: conducting + recording an approved interview session.
//   • Consent gate: no audio may be recorded/uploaded without an
//     explicit audio_recording consent on the student's profile.
//   • Uploads are validated (format + size), stored via GridFS,
//     and the REAL duration is read from the file metadata.
//   • Playback uses a signed, time-limited URL — never a
//     permanent public URL for what is sensitive audio of a
//     (possibly minor) student.
// ============================================================

const ALLOWED_FORMATS = ["mp3", "wav", "m4a", "aac"];
const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB
const PLAYBACK_URL_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

const CONSENT_MESSAGE =
  "Audio recording consent required before this session can be recorded — capture consent on the student's profile first";

/** Map an extension (with or without leading dot) to a normalized format. */
function normalizeFormat(filename) {
  const ext = path.extname(String(filename || "")).toLowerCase().replace(".", "");
  return ALLOWED_FORMATS.includes(ext) ? ext : null;
}

/**
 * Consent gate — throw unless the student has a valid
 * audio_recording consent on file.
 */
async function assertAudioConsent(studentId) {
  const profile = await StudentProfile.findOne({ userId: studentId }).select(
    "consentStatus"
  );
  const given =
    Boolean(profile?.consentStatus?.audioRecording?.isGiven) ||
    // Also accept the older single data-processing consent? No —
    // audio recording is a distinct, higher-stakes consent type and
    // must be captured explicitly. Only audioRecording counts.
    false;
  if (!given) {
    throw new ApiError(403, CONSENT_MESSAGE);
  }
}

/** Return the student's audio-recording consent state for the UI. */
async function getAudioConsentStatus(studentId) {
  const profile = await StudentProfile.findOne({ userId: studentId }).select(
    "consentStatus"
  );
  const ar = profile?.consentStatus?.audioRecording || {};
  return {
    isGiven: Boolean(ar.isGiven),
    givenAt: ar.givenAt || null,
  };
}

/**
 * Validate an uploaded file's format and size.
 * @returns normalized format string
 */
function validateAudioFile({ filename, size }) {
  const format = normalizeFormat(filename);
  if (!format) {
    throw new ApiError(
      400,
      `Unsupported audio format. Accepted formats: ${ALLOWED_FORMATS.join(", ")}`
    );
  }
  if (typeof size === "number" && size > MAX_FILE_SIZE_BYTES) {
    throw new ApiError(
      400,
      `Audio file too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`
    );
  }
  return format;
}

/**
 * Extract the real duration (seconds) from the audio buffer's
 * metadata — never trust a client-reported value.
 */
async function extractDuration(buffer, mimeType) {
  try {
    const meta = await parseBuffer(buffer, {
      mimeType,
      size: buffer.length,
    });
    const duration = Number(meta?.format?.duration);
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error("No usable duration in audio metadata");
    }
    return Math.round(duration * 10) / 10;
  } catch (err) {
    throw new ApiError(
      400,
      `Could not read audio metadata from this file (${err.message}). Please upload a valid audio recording.`
    );
  }
}

/**
 * Store an uploaded recording for a session:
 *  1. validate format/size
 *  2. store in GridFS (reference only goes into AudioAsset)
 *  3. extract the real duration from the file metadata
 *  4. replace any previous recording for this session
 *  5. mark the session 'recorded'
 */
async function uploadSessionAudio({ session, buffer, originalname, mimetype, uploadedBy }) {
  const format = validateAudioFile({ filename: originalname, size: buffer.length });

  // Store first, then read duration from the actual stored bytes.
  const { key } = await audioStorage.saveAudio({
    buffer,
    filename: `interview-${session._id}.${format}`,
    contentType: mimetype || "audio/mpeg",
  });

  const durationSeconds = await extractDuration(buffer, mimetype);

  // Replacing a previous recording: remove the old GridFS file and
  // its AudioAsset doc so each session has exactly one recording.
  const previous = await AudioAsset.findOne({ sessionId: session._id });
  if (previous) {
    await audioStorage.deleteAudio(previous.storageKey).catch(() => {});
    await AudioAsset.deleteOne({ _id: previous._id });
  }

  const asset = await AudioAsset.create({
    sessionId: session._id,
    storageProvider: audioStorage.STORAGE_PROVIDER,
    storageKey: key,
    fileFormat: format,
    fileSizeBytes: buffer.length,
    durationSeconds,
    uploadedBy,
  });

  session.audioAssetId = asset._id;
  session.actualDuration = durationSeconds;
  session.status = "recorded";
  await session.save();

  return { asset, session };
}

/**
 * Sign a playback URL for a session's recording. The token binds
 * the session id + expiry with an HMAC; the resulting URL is only
 * valid until expiry and cannot be forged without the secret.
 */
function signPlaybackPath({ sessionId, expiresAt }) {
  const expires = expiresAt.getTime();
  const payload = `${sessionId}:${expires}`;
  const sig = crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(payload)
    .digest("hex");
  return `/interview-audio/sessions/${sessionId}/stream?expires=${expires}&sig=${sig}`;
}

/** Verify a signed playback token; returns true/false. */
function verifyPlaybackSignature({ sessionId, expires, sig }) {
  if (!sessionId || !expires || !sig) return false;
  const expiresAt = new Date(Number(expires));
  if (Number.isNaN(expiresAt.getTime())) return false;
  if (expiresAt.getTime() < Date.now()) return false; // expired

  const payload = `${sessionId}:${expires}`;
  const expected = crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(payload)
    .digest("hex");
  const a = Buffer.from(String(sig));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Get a session's recording + a fresh signed playback URL.
 * Throws 404 if the session has no recording yet.
 */
async function getSessionAudio(session) {
  if (!session.audioAssetId) {
    throw new ApiError(404, "No recording has been uploaded for this session yet.");
  }
  const asset = await AudioAsset.findById(session.audioAssetId);
  if (!asset) {
    throw new ApiError(404, "Recording asset not found.");
  }
  const expiresAt = new Date(Date.now() + PLAYBACK_URL_TTL_MS);
  return {
    asset,
    playbackPath: signPlaybackPath({ sessionId: session._id, expiresAt }),
    expiresAt,
    ttlSeconds: PLAYBACK_URL_TTL_MS / 1000,
  };
}

module.exports = {
  ALLOWED_FORMATS,
  MAX_FILE_SIZE_BYTES,
  CONSENT_MESSAGE,
  assertAudioConsent,
  getAudioConsentStatus,
  validateAudioFile,
  extractDuration,
  uploadSessionAudio,
  getSessionAudio,
  verifyPlaybackSignature,
};
