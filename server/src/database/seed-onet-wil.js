const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "../../.env") });

const mongoose = require("mongoose");
const connectDB = require("./connectDB");
const AssessmentDefinition = require("../modules/assessments/assessmentDefinition.model");
const AssessmentQuestion = require("../modules/assessments/assessmentQuestion.model");
const wilData = require("./data/onet-wil.json");

/**
 * seed-onet-wil.js
 * Seeds the O*NET Work Importance Locator (WIL) assessment.
 *
 * Source: U.S. Department of Labor, Employment and Training Administration.
 *   O*NET Work Importance Locator, Version 3.0. Retired June 3, 2024.
 *   Used under CC-BY 4.0. Attribution required wherever this assessment appears.
 *
 * Run: node src/database/seed-onet-wil.js
 */
const seedOnetWil = async () => {
  try {
    await connectDB();
    console.log("\n🌱 Starting O*NET Work Importance Locator Seeder...");

    const definitionCode = "ONET_WORK_IMPORTANCE_LOCATOR";

    // Clean existing data for this assessment code
    const existingDef = await AssessmentDefinition.findOne({ code: definitionCode });
    if (existingDef) {
      console.log(`🧹 Removing existing data for assessment code: ${definitionCode}...`);
      await AssessmentQuestion.deleteMany({ assessmentId: existingDef._id });
      await AssessmentDefinition.deleteOne({ _id: existingDef._id });
    }

    // Build a lookup map: cardId → { workValue code, multiplier }
    const cardValueMap = {};
    for (const wv of wilData.workValues) {
      for (const cardId of wv.cardIds) {
        cardValueMap[cardId] = { code: wv.code, name: wv.name, multiplier: wv.multiplier };
      }
    }

    // 1. Create AssessmentDefinition
    const definition = await AssessmentDefinition.create({
      title: wilData.name,
      code: definitionCode,
      category: "values",
      responseType: "forced-rank-sort",
      description:
        "20-card forced-rank sort measuring your 6 core Work Values: Achievement, Recognition, Relationships, Support, Independence, and Working Conditions.",
      instructions:
        "Sort all 20 work value statements by assigning each one a rating from 1 (Least Important) to 5 (Most Important). You must place exactly 4 statements at each level before submitting.",
      estimatedDuration: 10,
      version: 3,
      status: "active",
      scoringStrategy: "onet_wil",
      scale: wilData.sortConfig,
      metadata: {
        citation: wilData.citation,
        sourceStatus: wilData.sourceStatus,
        sourceNote: wilData.sourceNote,
        assessmentKey: wilData.assessmentKey,
        workValues: wilData.workValues,
        scoreRange: wilData.scoreRange,
        attribution:
          "O*NET™ is a trademark of the U.S. Department of Labor, Employment and Training Administration. Version 3.0.",
      },
    });

    console.log(`✅ Created AssessmentDefinition: ${definition.title} (${definition._id})`);

    // 2. Create 20 AssessmentQuestions — one per card
    //    domain = work value code (used by scorer to bucket responses)
    //    weight = work value multiplier (used by scorer for weighted sum)
    const questionsToInsert = wilData.cards.map((card, idx) => {
      const mapping = cardValueMap[card.id];
      return {
        assessmentId: definition._id,
        questionNumber: idx + 1, // 1-indexed
        questionType: "ranking",
        text: card.text,
        domain: mapping ? mapping.code : "",
        facet: card.id, // card letter id (A–T) stored in facet for raw audit
        reverseScored: false,
        required: true,
        weight: mapping ? mapping.multiplier : 1,
        metadata: {
          cardId: card.id,
          workValueCode: mapping ? mapping.code : "",
          workValueName: mapping ? mapping.name : "",
          multiplier: mapping ? mapping.multiplier : 1,
        },
      };
    });

    const createdQuestions = await AssessmentQuestion.insertMany(questionsToInsert);
    console.log(`✅ Created ${createdQuestions.length} questions for O*NET Work Importance Locator.`);

    // 3. Summary of work values seeded
    console.log("\n📊 Work Values seeded:");
    for (const wv of wilData.workValues) {
      console.log(`   ${wv.name.padEnd(20)} | Cards: ${wv.cardIds.join(", ")} | Multiplier: ×${wv.multiplier} | Score range: ${wv.cardIds.length * 1 * wv.multiplier}–${wv.cardIds.length * 5 * wv.multiplier}`);
    }

    console.log("\n✨ O*NET Work Importance Locator Seeding Complete!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedOnetWil();
}

module.exports = seedOnetWil;
