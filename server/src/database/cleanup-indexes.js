const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "../../.env") });

const mongoose = require("mongoose");
const connectDB = require("./connectDB");

const cleanupIndexes = async () => {
  try {
    await connectDB();
    const db = mongoose.connection.db;
    console.log("\n🔧 Starting Index Cleanup & Final Migration...\n");

    // ─────────────────────────────────────────────────────────────────────
    // 0. Finish migration: move any remaining docs in clientprofiles
    //    to studentprofiles, then drop clientprofiles
    // ─────────────────────────────────────────────────────────────────────
    const oldColls = await db.listCollections({ name: "clientprofiles" }).toArray();
    if (oldColls.length > 0) {
      const legacyDocs = await db.collection("clientprofiles").find({}).toArray();
      if (legacyDocs.length > 0) {
        console.log(`📦 Migrating ${legacyDocs.length} remaining docs from clientprofiles -> studentprofiles...`);
        for (const doc of legacyDocs) {
          await db.collection("studentprofiles").updateOne(
            { _id: doc._id },
            { $setOnInsert: doc },
            { upsert: true }
          );
        }
        console.log(`   ✅ Migrated ${legacyDocs.length} documents.`);
      }
      await db.dropCollection("clientprofiles");
      console.log("🔥 Dropped legacy clientprofiles collection.");
    } else {
      console.log("✅ clientprofiles already gone.");
    }

    // ─────────────────────────────────────────────────────────────────────
    // 1. assessmentdefinitions — drop orphaned isActive_1 index
    // ─────────────────────────────────────────────────────────────────────
    try {
      await db.collection("assessmentdefinitions").dropIndex("isActive_1");
      console.log("✅ Dropped orphaned index: assessmentdefinitions.isActive_1");
    } catch (e) {
      console.log(`   ⚠️  isActive_1 not found or already dropped: ${e.message}`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 2. assessmentassignments — drop single-field indexes covered by compounds
    //    Keep: studentId_1_status_1_category_1  (covers studentId + status + category queries)
    //          counselorId_1_status_1            (covers counselorId queries)
    //          assessmentDefinitionId_1           (standalone FK not in any compound — KEEP)
    //    Drop: studentId_1, counselorId_1, category_1, status_1
    // ─────────────────────────────────────────────────────────────────────
    for (const idx of ["studentId_1", "counselorId_1", "category_1", "status_1"]) {
      try {
        await db.collection("assessmentassignments").dropIndex(idx);
        console.log(`✅ Dropped redundant index: assessmentassignments.${idx}`);
      } catch (e) {
        console.log(`   ⚠️  ${idx} not found: ${e.message}`);
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    // 3. assessmentscores — drop single-field indexes superseded by compounds
    //    Keep: clientId_1_category_1 (compound), sessionId_1_version_1 (compound)
    //    Drop: sessionId_1, clientId_1, assessmentDefinitionId_1, category_1
    //    (assessmentDefinitionId_1 is a useful FK but no compound covers it alone —
    //     keeping it for range queries on scores by assessment)
    // ─────────────────────────────────────────────────────────────────────
    for (const idx of ["sessionId_1", "clientId_1", "category_1"]) {
      try {
        await db.collection("assessmentscores").dropIndex(idx);
        console.log(`✅ Dropped redundant index: assessmentscores.${idx}`);
      } catch (e) {
        console.log(`   ⚠️  ${idx} not found: ${e.message}`);
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    // 4. assessmentsessions — drop single-field indexes covered by compound
    //    Keep: clientId_1_assessmentDefinitionId_1_status_1 (compound)
    //          assignmentId_1 (standalone lookup — keep)
    //    Drop: clientId_1, assessmentDefinitionId_1, status_1
    // ─────────────────────────────────────────────────────────────────────
    for (const idx of ["clientId_1", "assessmentDefinitionId_1", "status_1"]) {
      try {
        await db.collection("assessmentsessions").dropIndex(idx);
        console.log(`✅ Dropped redundant index: assessmentsessions.${idx}`);
      } catch (e) {
        console.log(`   ⚠️  ${idx} not found: ${e.message}`);
      }
    }

    console.log("\n✅ Index cleanup complete.\n");
    process.exit(0);
  } catch (err) {
    console.error("❌ Cleanup failed:", err);
    process.exit(1);
  }
};

cleanupIndexes();
