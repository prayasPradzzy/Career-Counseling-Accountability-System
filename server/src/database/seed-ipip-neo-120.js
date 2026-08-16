const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "../../.env") });

const mongoose = require("mongoose");
const connectDB = require("./connectDB");
const AssessmentDefinition = require("../modules/assessments/assessmentDefinition.model");
const AssessmentSection = require("../modules/assessments/assessmentSection.model");
const AssessmentQuestion = require("../modules/assessments/assessmentQuestion.model");

const ipipData = require("./data/ipip-neo-120.json");

const seedIpipNeo120 = async () => {
  try {
    await connectDB();
    console.log("\n🌱 Starting IPIP-NEO-120 Seeder & Schema Migration...");

    // 0. Migration: Rename clientprofiles to studentprofiles if old collection exists
    const db = mongoose.connection.db;
    const collections = await db.listCollections({ name: "clientprofiles" }).toArray();
    if (collections.length > 0) {
      await db.collection("clientprofiles").rename("studentprofiles").catch(() => {});
      console.log("✅ Migrated collection clientprofiles -> studentprofiles");
    }

    // Drop legacy assessmentoptions collection if present
    const optCollections = await db.listCollections({ name: "assessmentoptions" }).toArray();
    if (optCollections.length > 0) {
      await db.dropCollection("assessmentoptions").catch(() => {});
      console.log("🔥 Dropped legacy assessmentoptions collection");
    }

    // 1. Create or Update AssessmentDefinition
    const definitionCode = "IPIP_NEO_120";

    // Clean existing data for this assessment to enable clean re-runs
    const existingDef = await AssessmentDefinition.findOne({ code: definitionCode });
    if (existingDef) {
      console.log(`🧹 Removing existing data for assessment code: ${definitionCode}...`);
      await AssessmentQuestion.deleteMany({ assessmentId: existingDef._id });
      await AssessmentSection.deleteMany({ assessmentId: existingDef._id });
      await AssessmentDefinition.deleteOne({ _id: existingDef._id });
    }

    const definition = await AssessmentDefinition.create({
      title: ipipData.name,
      code: definitionCode,
      category: "personality",
      description: "120-item IPIP representation of the Revised NEO Personality Inventory measuring the Five-Factor Model of Personality.",
      instructions: "Please rate how accurately each statement describes you.",
      estimatedDuration: 5,
      version: 1,
      status: "active",
      scoringStrategy: "ipip_neo_120",
      scale: ipipData.scale,
      metadata: {
        citation: ipipData.citation,
        assessmentKey: ipipData.assessmentKey,
        domains: ipipData.domains,
        facets: ipipData.facets,
      },
    });

    console.log(`✅ Created AssessmentDefinition: ${definition.title} (${definition._id})`);
    console.log(`   Embedded Scale: Min ${definition.scale.min}, Max ${definition.scale.max}, ${Object.keys(definition.scale.labels).length} Labels`);

    // 2. Create AssessmentSections
    const sectionRanges = [
      { order: 1, title: "Part 1 (Questions 1-30)", questionStart: 1, questionEnd: 30 },
      { order: 2, title: "Part 2 (Questions 31-60)", questionStart: 31, questionEnd: 60 },
      { order: 3, title: "Part 3 (Questions 61-90)", questionStart: 61, questionEnd: 90 },
      { order: 4, title: "Part 4 (Questions 91-120)", questionStart: 91, questionEnd: 120 },
    ];

    const sections = [];
    for (const range of sectionRanges) {
      const section = await AssessmentSection.create({
        assessmentId: definition._id,
        title: range.title,
        description: `Questions ${range.questionStart} through ${range.questionEnd}`,
        order: range.order,
        questionStart: range.questionStart,
        questionEnd: range.questionEnd,
      });
      sections.push(section);
    }
    console.log(`✅ Created ${sections.length} AssessmentSections`);

    const domainMap = Object.fromEntries(ipipData.domains.map((d) => [d.code, d.name]));
    const facetMap = Object.fromEntries(ipipData.facets.map((f) => [f.code, f.name]));

    let totalQuestionsCreated = 0;
    let reverseScoredCount = 0;
    const facetCounts = {};

    // 3. Create AssessmentQuestions
    for (const qData of ipipData.questions) {
      const section = sections.find(
        (s) => qData.id >= s.questionStart && qData.id <= s.questionEnd
      );

      const facetName = facetMap[qData.facet] || qData.facet;
      facetCounts[facetName] = (facetCounts[facetName] || 0) + 1;
      if (qData.reverseScored) reverseScoredCount++;

      await AssessmentQuestion.create({
        assessmentId: definition._id,
        sectionId: section ? section._id : null,
        questionNumber: qData.id,
        text: qData.text,
        domain: domainMap[qData.domain] || qData.domain,
        facet: facetName,
        reverseScored: qData.reverseScored,
        questionType: "likert",
        required: true,
        weight: 1,
      });
      totalQuestionsCreated++;
    }

    console.log(`✅ Created ${totalQuestionsCreated} AssessmentQuestions`);
    console.log(`   Facet Count Verification: ${Object.keys(facetCounts).length} facets (expected 30), 4 items per facet`);
    console.log(`   Reverse-Scored Count Verification: ${reverseScoredCount} items (expected 55)`);

    if (totalQuestionsCreated !== 120 || Object.keys(facetCounts).length !== 30 || reverseScoredCount !== 55) {
      throw new Error("Question integrity verification failed! Question or facet counts do not match expected scoring key.");
    }

    console.log("\n🎉 IPIP-NEO-120 Seeder & Verification Completed Successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedIpipNeo120();
