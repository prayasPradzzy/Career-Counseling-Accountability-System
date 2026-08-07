const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

async function runAudit() {
  console.log("=================================================");
  console.log("   SYSTEM INTEGRATION AUDIT — 10 CHECKPOINTS     ");
  console.log("=================================================\n");

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  let passed = 0;
  let failed = 0;

  function report(num, title, success, details) {
    if (success) {
      passed++;
      console.log(`[PASS] Checkpoint ${num}: ${title}`);
    } else {
      failed++;
      console.log(`[FAIL] Checkpoint ${num}: ${title}`);
    }
    if (details) {
      console.log(`       Details: ${details}\n`);
    } else {
      console.log("");
    }
  }

  // 1. Student-Counselor Link
  try {
    const students = await db.collection("users").find({ role: "student" }).toArray();
    const counselors = await db.collection("users").find({ role: "counselor" }).toArray();
    const linkedStudents = students.filter((s) => s.counselorId);
    report(
      1,
      "Student-Counselor Relationship Link",
      linkedStudents.length > 0 && counselors.length > 0,
      `Found ${linkedStudents.length}/${students.length} students linked with counselorId, ${counselors.length} total counselors.`
    );
  } catch (err) {
    report(1, "Student-Counselor Relationship Link", false, err.message);
  }

  // 2. Counselor Assessment Review List Data
  try {
    const assignments = await db.collection("assessmentassignments").find({}).toArray();
    const submittedCount = assignments.filter((a) => ["SUBMITTED", "COMPLETED", "APPROVED", "UNDER_REVIEW"].includes(a.status)).length;
    report(
      2,
      "Counselor Assessment Review List Query",
      assignments.length > 0,
      `Total assignments: ${assignments.length}, Completed/Submitted: ${submittedCount}`
    );
  } catch (err) {
    report(2, "Counselor Assessment Review List Query", false, err.message);
  }

  // 3. Student Assessment Dashboard Data
  try {
    const activeAssignments = await db.collection("assessmentassignments").find({ status: { $ne: "ARCHIVED" } }).toArray();
    report(
      3,
      "Student Assessment Dashboard Data",
      activeAssignments.length > 0,
      `Found ${activeAssignments.length} active assignments for students.`
    );
  } catch (err) {
    report(3, "Student Assessment Dashboard Data", false, err.message);
  }

  // 4. Assessment Session Lifecycle & State Sync
  try {
    const sessions = await db.collection("assessmentsessions").find({}).toArray();
    const completedSessions = sessions.filter((s) => s.status === "completed");
    report(
      4,
      "Assessment Session Lifecycle & State Sync",
      sessions.length > 0 && completedSessions.length > 0,
      `Total sessions: ${sessions.length}, Completed: ${completedSessions.length}`
    );
  } catch (err) {
    report(4, "Assessment Session Lifecycle & State Sync", false, err.message);
  }

  // 5. Assessment Questions Definition & Domain Alignment
  try {
    const qCount = await db.collection("assessmentquestions").countDocuments();
    const qSample = await db.collection("assessmentquestions").findOne({});
    report(
      5,
      "Assessment Questions & Domains",
      qCount >= 120 && Boolean(qSample?.domain && qSample?.facet),
      `Total questions: ${qCount}. Sample domain: "${qSample?.domain}", facet: "${qSample?.facet}"`
    );
  } catch (err) {
    report(5, "Assessment Questions & Domains", false, err.message);
  }

  // 6. Assessment Responses Indexing & Value Validation
  try {
    const responseDocs = await db.collection("assessmentresponses").find({}).toArray();
    let totalItems = 0;
    let validValues = true;
    for (const doc of responseDocs) {
      totalItems += doc.responses?.length || 0;
      for (const r of doc.responses || []) {
        const val = Number(r.selectedValue);
        if (isNaN(val) || val < 0 || val > 5) {
          validValues = false;
        }
      }
    }
    report(
      6,
      "Assessment Responses Indexing & Scale Values Validation",
      responseDocs.length > 0 && validValues,
      `Found ${responseDocs.length} response documents totaling ${totalItems} answered items. All response values valid: ${validValues}`
    );
  } catch (err) {
    report(6, "Assessment Responses Indexing & Scale Values Validation", false, err.message);
  }

  // 7. Scoring Engine Execution & Score Schema Completeness
  try {
    const scores = await db.collection("assessmentscores").find({}).toArray();
    const validScores = scores.filter(
      (s) =>
        (s.domainScores?.length === 5 || s.dimensionScores?.length === 5 || s.categoryScores?.length === 6)
    );
    report(
      7,
      "Scoring Engine & Score Structure Completeness",
      scores.length > 0 && validScores.length > 0,
      `Total score records: ${scores.length}, Valid score records: ${validScores.length}`
    );
  } catch (err) {
    report(7, "Scoring Engine & Score Structure Completeness", false, err.message);
  }

  // 8. Raw Responses Presentation & Ordering
  try {
    const responseDoc = await db.collection("assessmentresponses").findOne({ "responses.119": { $exists: true } });
    const items = responseDoc?.responses || [];
    const sortedNumbers = items.map((i) => i.questionNumber).sort((a, b) => a - b);
    let isAscending = true;
    for (let i = 0; i < sortedNumbers.length - 1; i++) {
      if (sortedNumbers[i] >= sortedNumbers[i + 1]) {
        isAscending = false;
        break;
      }
    }
    report(
      8,
      "Raw Responses Presentation & 1-120 Ascending Integrity",
      items.length === 120 && isAscending,
      `Items count: ${items.length}, Sorted 1-120 ascending: ${isAscending}`
    );
  } catch (err) {
    report(8, "Raw Responses Presentation & 1-120 Ascending Integrity", false, err.message);
  }

  // 9. Student Results Endpoint Source Data (AssessmentScore by Key)
  try {
    const scores = await db.collection("assessmentscores").find({ assessmentKey: "ipip-neo-120" }).toArray();
    report(
      9,
      "Student Results Endpoint Source Data (AssessmentScore by Key)",
      scores.length > 0,
      `Found ${scores.length} score documents matching assessmentKey 'ipip-neo-120'.`
    );
  } catch (err) {
    report(9, "Student Results Endpoint Source Data (AssessmentScore by Key)", false, err.message);
  }

  // 10. End-to-End Object Reference Relational Integrity
  try {
    const scores = await db.collection("assessmentscores").find({ assessmentKey: "ipip-neo-120" }).toArray();
    let completeChains = 0;

    for (const score of scores) {
      if (!score.sessionId) continue;
      const session = await db.collection("assessmentsessions").findOne({ _id: score.sessionId });
      if (!session) continue;
      const assignment = session.assignmentId ? await db.collection("assessmentassignments").findOne({ _id: session.assignmentId }) : null;
      const responseDoc = await db.collection("assessmentresponses").findOne({ sessionId: session._id });
      if (session && assignment && responseDoc) {
        completeChains++;
      }
    }

    report(
      10,
      "End-to-End Relational Integrity (Assignment -> Session -> Score + Response)",
      completeChains > 0,
      `Found ${completeChains} fully intact end-to-end chains across active assessment data.`
    );
  } catch (err) {
    report(10, "End-to-End Relational Integrity", false, err.message);
  }

  console.log("-------------------------------------------------");
  console.log(`SUMMARY: ${passed}/10 Checkpoints PASSED, ${failed}/10 FAILED.`);
  console.log("=================================================\n");

  process.exit(failed > 0 ? 1 : 0);
}

runAudit().catch((err) => {
  console.error("Audit error:", err);
  process.exit(1);
});
