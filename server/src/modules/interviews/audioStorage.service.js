const mongoose = require("mongoose");

// ============================================================
// Audio Storage — GridFS Provider
// ============================================================
// Phase 2 storage decision: MongoDB GridFS (the prompt's
// sanctioned fallback — no external service/signup needed since
// the project already runs on Atlas). Audio is stored as GridFS
// chunks; the AudioAsset collection keeps only the file id.
//
// This module is the ONLY place that touches the storage backend.
// Swapping to Cloudinary later means writing a second provider
// with the same surface (saveAudio / openReadStream / deleteAudio)
// and flipping storageProvider — nothing else changes.
// ============================================================

const STORAGE_PROVIDER = "gridfs";
const BUCKET_NAME = "audioAssets";

function getBucket() {
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: BUCKET_NAME,
  });
}

/**
 * Store an audio buffer in GridFS.
 * @returns {Promise<{ key: string }>} key = GridFS file id
 */
function saveAudio({ buffer, filename, contentType }) {
  const bucket = getBucket();
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType,
      metadata: { uploadedAt: new Date() },
    });
    uploadStream.once("error", reject);
    uploadStream.once("finish", () =>
      resolve({ key: uploadStream.id.toString() })
    );
    uploadStream.end(buffer);
  });
}

/**
 * Fetch a GridFS file document (length, contentType) by key.
 */
async function getFileInfo(key) {
  const bucket = getBucket();
  const file = await bucket.find({ _id: new mongoose.Types.ObjectId(key) }).next();
  return file || null;
}

/**
 * Open a read stream for a stored file, optionally for a byte
 * range (used to support Range requests so audio seeking works).
 * The stream surfaces errors via its 'error' event.
 */
function openReadStream(key, { start, end } = {}) {
  const bucket = getBucket();
  const options = {};
  if (start !== undefined) options.start = start;
  if (end !== undefined) options.end = end;
  return bucket.openDownloadStream(new mongoose.Types.ObjectId(key), options);
}

/**
 * Delete a stored file by key (no-op if it doesn't exist).
 */
async function deleteAudio(key) {
  const bucket = getBucket();
  try {
    await bucket.delete(new mongoose.Types.ObjectId(key));
  } catch (err) {
    // Deleting a missing file is not an error — treat as already gone.
    if (err.code !== 26) throw err; // 26 = FileNotFound
  }
}

module.exports = {
  STORAGE_PROVIDER,
  BUCKET_NAME,
  saveAudio,
  getFileInfo,
  openReadStream,
  deleteAudio,
};
