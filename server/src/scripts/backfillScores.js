const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

const AssessmentSession = require("../modules/assessments/assessmentSession.model");
const AssessmentDefinition = require("../modules/assessments/assessmentDefinition.model");
const AssessmentAssignment = require("../modules/assessments/assessmentAssignment.model").AssessmentAssignment;
const AssessmentResponse = require("../modules/assessments/assessmentResponse.model");
const AssessmentScore = require("../modules/assessments/assessmentScore.model");
const scoringEngine = require("../modules/assessments/scoring/scoringEngine");

async function backfill() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected successfully.");

  // 1. Fetch current active AssessmentDefinition
  const activeDef = await AssessmentDefinition.findOne({}).sort({ createdAt: -1 });
  if (!activeDef) {
    console.error("No active AssessmentDefinition found!");
    process.exit(1);
  }
  console.log(`Active AssessmentDefinition: '${activeDef.title}' (${activeDef._id})`);

  // 2. Align orphaned definition IDs across collections to active definition ID
  const sessionUpdate = await AssessmentSession.updateMany(
    { assessmentDefinitionId: { $ne: activeDef._id } },
    { $set: { assessmentDefinitionId: activeDef._id } }
  );
  console.log(`Updated ${sessionUpdate.modifiedCount} sessions with active definition ID.`);

  const assignmentUpdate = await AssessmentAssignment.updateMany(
    { assessmentDefinitionId: { $ne: activeDef._id } },
    { $set: { assessmentDefinitionId: activeDef._id } }
  );
  console.log(`Updated ${assignmentUpdate.modifiedCount} assignments with active definition ID.`);

  const responseUpdate = await AssessmentResponse.updateMany(
    { assessmentDefinitionId: { $ne: activeDef._id } },
    { $set: { assessmentDefinitionId: activeDef._id } }
  );
  console.log(`Updated ${responseUpdate.modifiedCount} response docs with active definition ID.`);

  // 3. Find all submitted/completed sessions with responses
  const completedSessions = await AssessmentSession.find({
    $or: [{ status: "submitted" }, { status: "completed" }, { status: "reviewed" }, { status: "approved" }],
  });

  console.log(`Found ${completedSessions.length} completed/submitted sessions to evaluate for backfill.`);

  let rescoredCount = 0;
  for (const session of completedSessions) {
    const existingScore = await AssessmentScore.findOne({ sessionId: session._id });

    // Check if score is missing OR if score uses legacy format missing domainScores
    if (!existingScore || !existingScore.domainScores || existingScore.domainScores.length === 0) {
      console.log(`Backfilling score for session ${session._id} (student: ${session.clientId})...`);
      try {
        const newScore = await scoringEngine.calculateAndSaveScore(session._id);
        console.log(`Successfully calculated score (${newScore._id}) for session ${session._id}. Domain count: ${newScore.domainScores?.length}`);
        rescoredCount++;
      } catch (err) {
        console.error(`Failed to calculate score for session ${session._id}:`, err.message);
      }
    } else {
      console.log(`Session ${session._id} already has a valid score document (${existingScore._id}).`);
    }
  }

  console.log(`Backfill complete! Rescored/Calculated ${rescoredCount} sessions.`);
  process.exit(0);
}

backfill().catch((err) => {
  console.error("Backfill error:", err);
  process.exit(1);
});
