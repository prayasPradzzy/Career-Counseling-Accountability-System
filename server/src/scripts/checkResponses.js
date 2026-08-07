const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

async function checkReverseQuestions() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const reverseQuestions = await db.collection("assessmentquestions").find({ reverseScored: true }).toArray();
  console.log("Total reverse-scored questions:", reverseQuestions.length);
  reverseQuestions.slice(0, 5).forEach(q => {
    console.log({
      num: q.questionNumber,
      text: q.text,
      containsR: q.text.includes("(R)"),
      domain: q.domain,
      facet: q.facet,
    });
  });

  // Check for ANY question text containing (R) in the DB
  const rQuestions = await db.collection("assessmentquestions").find({ text: { $regex: "\\(R\\)" } }).toArray();
  console.log("Questions with (R) in text field:", rQuestions.length);
  if (rQuestions.length > 0) {
    rQuestions.slice(0, 3).forEach(q => console.log("  Example:", q.questionNumber, q.text));
  }

  // Now check Prayas Singh's raw responses for the suspicious Part 2 pattern
  const session = await db.collection("assessmentsessions").findOne({ _id: new mongoose.Types.ObjectId("6a73d5537e40c2a6519882a1") });
  if (session) {
    const responseDoc = await db.collection("assessmentresponses").findOne({ sessionId: session._id });
    if (responseDoc) {
      // Items 31-60 (Part 2)
      const part2 = responseDoc.responses.filter(r => r.questionNumber >= 31 && r.questionNumber <= 60);
      const part2Values = part2.map(r => r.selectedValue);
      const uniqueVals = [...new Set(part2Values)];
      console.log("\n--- Part 2 (Q31-Q60) Analysis ---");
      console.log("Total items:", part2.length);
      console.log("Unique values:", uniqueVals);
      console.log("All same?", uniqueVals.length === 1);

      // Check timestamps for timing pattern
      const part2Sorted = part2.sort((a, b) => a.questionNumber - b.questionNumber);
      console.log("First item answeredAt:", part2Sorted[0]?.answeredAt);
      console.log("Last item answeredAt:", part2Sorted[part2Sorted.length - 1]?.answeredAt);

      // Items 91-120 (Part 4) 
      const part4 = responseDoc.responses.filter(r => r.questionNumber >= 91 && r.questionNumber <= 120);
      const part4Values = part4.map(r => r.selectedValue);
      const part4UniqueVals = [...new Set(part4Values)];
      console.log("\n--- Part 4 (Q91-Q120) Analysis ---");
      console.log("Total items:", part4.length);
      console.log("Unique values:", part4UniqueVals);
      console.log("All same?", part4UniqueVals.length === 1);
    }
  }

  process.exit(0);
}
checkReverseQuestions();
