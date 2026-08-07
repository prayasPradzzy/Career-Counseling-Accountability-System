const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

async function backfillAssessmentKeys() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const res = await db.collection("assessmentscores").updateMany(
    { $or: [{ assessmentKey: { $exists: false } }, { assessmentKey: null }] },
    { $set: { assessmentKey: "ipip-neo-120" } }
  );

  console.log("Backfilled assessmentKey on AssessmentScores:", res.modifiedCount, "documents updated.");
  process.exit(0);
}

backfillAssessmentKeys().catch((err) => {
  console.error("Error backfilling assessmentKey:", err);
  process.exit(1);
});
