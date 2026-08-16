const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "../../.env") });

const mongoose = require("mongoose");
const connectDB = require("./connectDB");
const AssessmentDefinition = require("../modules/assessments/assessmentDefinition.model");
const AssessmentQuestion = require("../modules/assessments/assessmentQuestion.model");
const onetData = require("./data/onet-interest-profiler.json");

const seedOnetInterestProfiler = async () => {
  try {
    await connectDB();
    console.log("\n🌱 Starting O*NET Interest Profiler Seeder...");

    const definitionCode = "ONET_INTEREST_PROFILER_SHORT";

    // Clean existing data for this assessment code
    const existingDef = await AssessmentDefinition.findOne({ code: definitionCode });
    if (existingDef) {
      console.log(`🧹 Removing existing data for assessment code: ${definitionCode}...`);
      await AssessmentQuestion.deleteMany({ assessmentId: existingDef._id });
      await AssessmentDefinition.deleteOne({ _id: existingDef._id });
    }

    // 1. Create AssessmentDefinition
    const definition = await AssessmentDefinition.create({
      title: onetData.name,
      code: definitionCode,
      category: "interest",
      responseType: "checkbox",
      description: "60-item O*NET Interest Profiler measuring the 6 Holland RIASEC interest categories.",
      instructions: "Please select each activity that you would like to do. Uncheck activities you would not like to do.",
      estimatedDuration: 5,
      version: 1,
      status: "active",
      scoringStrategy: "riasec_holland",
      scale: onetData.scale,
      metadata: {
        citation: onetData.citation,
        assessmentKey: onetData.assessmentKey,
        categories: onetData.categories,
      },
    });

    console.log(`✅ Created AssessmentDefinition: ${definition.title} (${definition._id})`);

    // 2. Create 60 AssessmentQuestions
    const questionsToInsert = onetData.questions.map((q) => ({
      assessmentId: definition._id,
      questionNumber: q.id,
      questionType: "checkbox",
      text: q.text,
      domain: q.category, // R, I, A, S, E, C
      facet: q.category,
      reverseScored: false,
      options: [],
      metadata: { category: q.category, onetId: q.id },
    }));

    const createdQuestions = await AssessmentQuestion.insertMany(questionsToInsert);
    console.log(`✅ Created ${createdQuestions.length} questions for O*NET Interest Profiler.`);

    console.log("\n✨ O*NET Interest Profiler Seeding Complete!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedOnetInterestProfiler();
}

module.exports = seedOnetInterestProfiler;
