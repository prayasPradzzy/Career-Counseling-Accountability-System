/**
 * testInterviewFixes.js
 * Verifies two things from the "Interview Tab Fixes" prompt:
 *
 *   A) Duplicate-cluster normalization — feeding normalizeQuestionsByCluster
 *      a synthetic LLM response that lists the SAME cluster twice (the exact
 *      reported bug: "Identity & Direction" as Medium AND as Light with the
 *      same question) must produce ONE authoritative entry, using the
 *      deterministic priority, with questions merged.
 *
 *   D) Groq provider routing — with LLM_PROVIDER=groq + GROQ_API_KEY set,
 *      aiService.generate() must call https://api.groq.com/openai/v1 with the
 *      Groq key and model, with ZERO feature-code changes (the provider is a
 *      config swap inside the AI Services Layer). Uses a stubbed fetch so no
 *      real key is needed. Also asserts the no-key fallback still works.
 *
 * Usage (from the server directory): node scripts/testInterviewFixes.js
 */
const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

const connectDB = require("../src/database/connectDB");
const aiService = require("../src/modules/ai/ai.service");
const AIRequestLog = require("../src/modules/ai/aiRequestLog.model");
const {
  normalizeQuestionsByCluster,
} = require("../src/modules/interviews/interviewQuestion.service");

let failures = 0;
function assert(cond, label, extra) {
  const ok = Boolean(cond);
  if (!ok) failures += 1;
  console.log(`  ${ok ? "✔" : "✘"} ${label}${extra ? ` — ${extra}` : ""}`);
  return ok;
}

// Deterministic priorities as the score-grounded service would compute them.
const PRIORITIES = {
  motivation_drive: "medium",
  identity_direction: "medium", // the authoritative priority for this student
  cognitive_decision: "high",
  social_relational: "light",
  emotional_adaptive: "light",
  future_initiative: "light",
};

async function main() {
  // ── Part A: duplicate-cluster normalization (pure function, no DB) ──────
  console.log("\n=== Part A: duplicate cluster normalization ===");

  // The EXACT reported scenario: the model lists identity_direction twice —
  // once as Medium with a question, once as Light with the SAME question.
  const syntheticAiResponse = JSON.stringify({
    questionsByCluster: [
      {
        cluster: "identity_direction",
        priority: "medium",
        questions: ["How would you describe yourself to someone who has never met you?"],
        rationale: "worth a focused conversation",
      },
      {
        cluster: "identity_direction",
        priority: "light", // conflicting claim — must be ignored
        questions: ["How would you describe yourself to someone who has never met you?"],
        rationale: "keep light",
      },
      { cluster: "cognitive_decision", priority: "high", questions: ["When you face a big decision, how do you usually go about making it?"], rationale: "priority area" },
      { cluster: "motivation_drive", priority: "medium", questions: ["Tell me about a time you worked hard at something even when it was difficult."], rationale: "focused conversation" },
      { cluster: "social_relational", priority: "light", questions: ["How do you feel about working in a team versus alone?"], rationale: "not strongly indicated" },
      { cluster: "emotional_adaptive", priority: "light", questions: ["How do you typically handle stress?"], rationale: "keep light" },
      { cluster: "future_initiative", priority: "light", questions: ["Where do you see yourself five years from now?"], rationale: "keep light" },
    ],
  });

  const normalized = normalizeQuestionsByCluster(syntheticAiResponse, PRIORITIES);

  const identityEntries = normalized.filter((c) => c.cluster === "identity_direction");
  assert(identityEntries.length === 1, "identity_direction appears EXACTLY once", `count=${identityEntries.length}`);
  assert(identityEntries[0]?.priority === "medium", "priority comes from the deterministic map (medium), not the LLM's 'light' claim", `priority=${identityEntries[0]?.priority}`);
  assert(identityEntries[0]?.questions.length === 1, "duplicate question deduped (no doubled rows)", `questions=${identityEntries[0]?.questions.length}`);

  assert(normalized.length === 6, "all six clusters present, one entry each", `count=${normalized.length}`);
  const codes = normalized.map((c) => c.cluster);
  assert(new Set(codes).size === 6, "no duplicate cluster codes in the output");

  const ranks = { high: 0, medium: 1, light: 2 };
  const sortedOk = normalized.every(
    (c, i) => i === 0 || ranks[normalized[i - 1].priority] <= ranks[c.priority]
  );
  assert(sortedOk, "output sorted High → Medium → Light", normalized.map((c) => `${c.cluster}:${c.priority}`).join(", "));

  // ── Part D: Groq routing through the AI Services Layer (stubbed fetch) ──
  console.log("\n=== Part D: Groq provider routing ===");
  await connectDB();
  // Capture a watermark so cleanup below only touches logs THIS script wrote.
  const logWatermark = new Date();

  let captured = null;
  const originalFetch = global.fetch;
  global.fetch = async (url, opts) => {
    captured = { url: String(url), opts };
    return {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ questionsByCluster: [] }) } }],
      }),
    };
  };

  process.env.LLM_PROVIDER = "groq";
  process.env.GROQ_API_KEY = "test-groq-key-123";
  process.env.LLM_MODEL = "llama-3.3-70b-versatile";
  delete process.env.OPENAI_API_KEY;

  const variables = {
    clusterPriorities: Object.entries(PRIORITIES).map(([cluster, priority]) => ({ cluster, priority })),
    psychometricSummary: { "ipip-neo-120": { domainBands: { N: "Moderate" } } },
  };

  let result = null;
  try {
    result = await aiService.generate({
      promptKey: "interview-question-generator-candidate",
      variables,
      requestType: "interview-questions",
    });
  } catch (err) {
    console.log("  generate() threw:", err.message);
  }

  assert(Boolean(captured), "fetch was called (provider path taken)");
  assert(
    captured?.url === "https://api.groq.com/openai/v1/chat/completions",
    "request routed to Groq's OpenAI-compatible endpoint",
    captured?.url
  );
  const authHeader = captured?.opts?.headers?.Authorization;
  assert(authHeader === "Bearer test-groq-key-123", "Groq API key sent as Bearer token", authHeader);
  const body = JSON.parse(captured?.opts?.body || "{}");
  assert(body?.model === "llama-3.3-70b-versatile", "Groq model selected (llama-3.3-70b-versatile)", body?.model);
  assert(result?.source === "llm", "result marked as LLM source", result?.source);

  const groqLog = await AIRequestLog.findOne({ promptKey: "interview-question-generator-candidate" }).sort({ createdAt: -1 });
  assert(groqLog?.source === "llm" && groqLog?.model === "llama-3.3-70b-versatile", "AIRequestLog records the Groq call (source + model)");

  // No-key fallback still works after the provider switch
  global.fetch = originalFetch;
  delete process.env.GROQ_API_KEY;
  delete process.env.LLM_PROVIDER;
  const fallbackResult = await aiService.generate({
    promptKey: "interview-question-generator-candidate",
    variables,
    requestType: "interview-questions",
  });
  assert(fallbackResult?.source === "fallback", "no-key path still falls back to the deterministic generator", fallbackResult?.source);

  // ── Cleanup ──────────────────────────────────────────────────────────────
  // Delete only the AIRequestLog rows this script wrote (created after the
  // watermark) — never the user's own generation history.
  await AIRequestLog.deleteMany({
    promptKey: "interview-question-generator-candidate",
    createdAt: { $gt: logWatermark },
  });
  await mongoose.disconnect();

  if (failures > 0) {
    console.error(`\n❌ testInterviewFixes FAILED with ${failures} assertion(s).`);
    process.exit(1);
  }
  console.log("\n=== testInterviewFixes PASSED ✅ ===");
  process.exit(0);
}

main().catch(async (e) => {
  console.error("❌ Test failed:", e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
