const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "../../.env") });
const mongoose = require("mongoose");

const connectDB = require("./connectDB");
const PromptTemplate = require("../modules/ai/promptTemplate.model");

/**
 * seed-interview-prompts.js
 * Seeds the PromptTemplate documents consumed by the interview
 * question generator (aiService.generate with promptKey).
 *
 * Run: node src/database/seed-interview-prompts.js
 */
const TEMPLATES = [
  {
    key: "interview-question-generator-candidate",
    description:
      "Builds a cluster-organized interview guide for a candidate session, grounded in the student's deterministic cluster priorities.",
    expectedVariables: ["clusterPriorities", "psychometricSummary"],
    template: `You are a career counselor preparing an interview guide for a candidate (the student).

Cluster priorities for this student were computed deterministically from their psychometric scores — do not question or change them:
{{clusterPriorities}}

Band-level psychometric summary per assessment (bands only, no raw scores):
{{psychometricSummary}}

Generate an open-ended, conversational interview guide organized by cluster. Requirements:
- For each cluster, generate 2-3 open-ended, conversational questions addressed directly to the student.
- 'high' priority clusters get 3 questions, 'medium' get 2, 'light' get 1.
- Include a one-line rationale per cluster explaining why it is weighted that way for this student.
- Questions must be natural, non-clinical, and appropriate for a career counseling conversation with the student.

Respond with strict JSON only, no markdown fences, in this exact shape:
{
  "questionsByCluster": [
    {
      "cluster": "<cluster code>",
      "priority": "high|medium|light",
      "questions": ["question 1", "question 2"],
      "rationale": "one line"
    }
  ]
}`,
  },
  {
    // DISABLED: parent sessions are not currently available (the creation
    // endpoint rejects sessionType 'parent'). The template is retained with
    // active: false for audit history; nothing calls this key today.
    key: "interview-question-generator-parent",
    description:
      "[DISABLED] Builds a cluster-organized interview guide for a parent session. Parent sessions are not currently available.",
    expectedVariables: ["clusterPriorities", "psychometricSummary"],
    active: false,
    template: `You are a career counselor preparing an interview guide for a parent of the candidate (the student).

Cluster priorities for this student were computed deterministically from their psychometric scores — do not question or change them:
{{clusterPriorities}}

Band-level psychometric summary per assessment (bands only, no raw scores):
{{psychometricSummary}}

Generate an open-ended, conversational interview guide for the parent, organized by cluster. Requirements:
- For each cluster, generate 2-3 questions the parent can answer from observation.
- 'high' priority clusters get 3 questions, 'medium' get 2, 'light' get 1.
- Focus on financial/practical constraints, family context, social support, and the parent's observations of the student's behavior.
- Do NOT ask the parent to self-report the student's inner psychology (motivation, identity, emotions) — frame questions around what the parent has observed or knows.
- Include a one-line rationale per cluster explaining why it is weighted that way for this student.

Respond with strict JSON only, no markdown fences, in this exact shape:
{
  "questionsByCluster": [
    {
      "cluster": "<cluster code>",
      "priority": "high|medium|light",
      "questions": ["question 1", "question 2"],
      "rationale": "one line"
    }
  ]
}`,
  },
];

const seedPromptTemplates = async () => {
  try {
    await connectDB();
    console.log("\n🌱 Starting Interview Prompt Template Seeder...");

    for (const template of TEMPLATES) {
      const existing = await PromptTemplate.findOne({ key: template.key });
      if (existing) {
        await PromptTemplate.updateOne({ key: template.key }, { $set: template });
        console.log(`🔄 Updated prompt template: ${template.key}`);
      } else {
        await PromptTemplate.create(template);
        console.log(`✅ Created prompt template: ${template.key}`);
      }
    }

    console.log("🎉 Interview prompt templates seeded successfully.");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedPromptTemplates();
