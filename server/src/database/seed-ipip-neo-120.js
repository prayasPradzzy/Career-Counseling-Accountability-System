const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "../../.env") });

const connectDB = require("./connectDB");
const AssessmentDefinition = require("../modules/assessments/assessmentDefinition.model");
const AssessmentSection = require("../modules/assessments/assessmentSection.model");
const AssessmentQuestion = require("../modules/assessments/assessmentQuestion.model");
const AssessmentOption = require("../modules/assessments/assessmentOption.model");

const ipipData = require("./data/ipip-neo-120.json");

const seedIpipNeo120 = async () => {
  try {
    await connectDB();
    console.log("\n🌱 Starting IPIP-NEO-120 Seeder...");

    // 1. Create or Update AssessmentDefinition
    const definitionCode = "IPIP_NEO_120";

    // Clean existing data for this assessment to enable clean re-runs
    const existingDef = await AssessmentDefinition.findOne({ code: definitionCode });
    if (existingDef) {
      console.log(`🧹 Removing existing data for assessment code: ${definitionCode}...`);
      const existingSections = await AssessmentSection.find({ assessmentId: existingDef._id });
      const existingSectionIds = existingSections.map((s) => s._id);

      const existingQuestions = await AssessmentQuestion.find({ assessmentId: existingDef._id });
      const existingQuestionIds = existingQuestions.map((q) => q._id);

      await AssessmentOption.deleteMany({ questionId: { $in: existingQuestionIds } });
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
      estimatedDuration: 20,
      version: 1,
      status: "active",
      scoringStrategy: "likert_sum",
      scale: ipipData.scale,
      metadata: {
        citation: ipipData.citation,
        assessmentKey: ipipData.assessmentKey,
        domains: ipipData.domains,
        facets: ipipData.facets,
      },
    });

    console.log(`✅ Created AssessmentDefinition: ${definition.title} (${definition._id})`);

    // 2. Create AssessmentSections
    // Spec: 1-30, 31-60, 61-90, 91-120
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

    // Domain & Facet map for clean names if desired, or store codes
    const domainMap = Object.fromEntries(ipipData.domains.map((d) => [d.code, d.name]));
    const facetMap = Object.fromEntries(ipipData.facets.map((f) => [f.code, f.name]));

    // Likert Options template
    const optionLabels = ipipData.scale.labels;
    // scale: { "1": "Disagree Strongly", "2": "Disagree a little", ... }

    let totalQuestionsCreated = 0;
    let totalOptionsCreated = 0;

    // 3. Create AssessmentQuestions and AssessmentOptions
    for (const qData of ipipData.questions) {
      // Find matching section
      const section = sections.find(
        (s) => qData.id >= s.questionStart && qData.id <= s.questionEnd
      );

      const question = await AssessmentQuestion.create({
        assessmentId: definition._id,
        sectionId: section ? section._id : null,
        questionNumber: qData.id,
        text: qData.text,
        domain: domainMap[qData.domain] || qData.domain,
        facet: facetMap[qData.facet] || qData.facet,
        reverseScored: qData.reverseScored,
        questionType: "likert",
        required: true,
        weight: 1,
      });
      totalQuestionsCreated++;

      // Create 5 options for this question
      const optionsToCreate = Object.entries(optionLabels).map(([valueStr, label], index) => ({
        questionId: question._id,
        label: label,
        value: Number(valueStr),
        order: index + 1,
      }));

      await AssessmentOption.insertMany(optionsToCreate);
      totalOptionsCreated += optionsToCreate.length;
    }

    console.log(`✅ Created ${totalQuestionsCreated} AssessmentQuestions`);
    console.log(`✅ Created ${totalOptionsCreated} AssessmentOptions`);
    console.log("\n🎉 IPIP-NEO-120 Seeder Completed Successfully!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedIpipNeo120();
