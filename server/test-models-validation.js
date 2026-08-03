/**
 * Mongoose Models Compilation & Schema Validation Script
 * Verifies that all 11 core domain schemas compile cleanly in Mongoose.
 */

const models = require("./src/database/models");

console.log("==================================================");
console.log("  MONGOOSE CORE DOMAIN SCHEMAS VALIDATION");
console.log("==================================================\n");

const expectedModels = [
  "User",
  "ClientProfile",
  "AssessmentDefinition",
  "AssessmentSession",
  "AssessmentResponse",
  "AssessmentScore",
  "Interview",
  "InterviewInsight",
  "CareerReference",
  "Recommendation",
  "Report",
];

let passCount = 0;

expectedModels.forEach((modelName) => {
  if (models[modelName] && models[modelName].modelName === modelName) {
    console.log(`✅ Model Compiled: ${modelName}`);
    passCount++;
  } else {
    console.error(`❌ Model Missing or Invalid: ${modelName}`);
  }
});

console.log(`\n==================================================`);
console.log(`  VALIDATION RESULT: ${passCount}/${expectedModels.length} SCHEMAS VALID`);
console.log(`==================================================\n`);
