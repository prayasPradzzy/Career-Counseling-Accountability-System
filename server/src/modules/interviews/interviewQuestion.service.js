const ApiError = require("../../shared/utils/ApiError");
const aiService = require("../ai/ai.service");
const InterviewQuestionSet = require("./interviewQuestionSet.model");
const clusterPriorityService = require("./clusterPriorityService");
const clusterConfig = require("../../config/interviewClusters.json");

const { ALL_CLUSTERS, CLUSTER_NAMES } = clusterPriorityService;

const PRIORITY_ORDER = { high: 0, medium: 1, light: 2 };
const QUESTIONS_BY_PRIORITY = { high: 3, medium: 2, light: 1 };

// ── Local fallback question banks (deterministic, no LLM needed) ──────────
// Candidate sessions ask the student directly about their own experience.
const CANDIDATE_BANK = {
  motivation_drive: [
    "Tell me about a time you worked hard at something even when it was difficult — what kept you going?",
    "When you think about the future you want, what part of it excites you the most?",
    "How do you usually respond when a goal takes longer to achieve than you expected?",
  ],
  identity_direction: [
    "How would you describe yourself to someone who has never met you?",
    "What kinds of roles or activities feel most like 'you' — and why?",
    "When did you first start thinking about what you want your career to be?",
  ],
  cognitive_decision: [
    "When you face a big decision, how do you usually go about making it?",
    "What kind of tasks do you find easy to focus on, and which ones drain you?",
    "How do you prefer to learn something new — reading, doing, or watching others?",
  ],
  social_relational: [
    "How do you usually feel about working in a team versus working alone?",
    "Tell me about a time you had to cooperate with people you didn't know well.",
    "Do you naturally take charge in groups, or do you prefer to support others?",
  ],
  emotional_adaptive: [
    "How do you typically handle stress or uncertainty in your life?",
    "When a plan falls through, what does your recovery usually look like?",
    "What kinds of situations make you feel most confident, and which make you feel unsure?",
  ],
  future_initiative: [
    "Where do you see yourself five years from now, and what would you need to get there?",
    "Have you ever started something on your own without being asked? What happened?",
    "When you imagine an ideal day of work, what does it look like?",
  ],
};

function buildFallbackQuestionSetJson(variables) {
  const bank = CANDIDATE_BANK;
  const { clusterPriorities = [], psychometricSummary = {} } = variables;

  const priorities = {};
  for (const entry of clusterPriorities) {
    priorities[entry.cluster] = entry.priority;
  }

  const byCluster = [];
  for (const cluster of clusterConfig.clusters) {
    const priority = priorities[cluster.code] || "light";
    const count = QUESTIONS_BY_PRIORITY[priority] || 1;
    const pool = bank[cluster.code] || [];
    const questions = pool.slice(0, count);
    byCluster.push({
      cluster: cluster.code,
      priority,
      questions,
      rationale: buildRationale(cluster, priority, psychometricSummary),
    });
  }

  return JSON.stringify({ questionsByCluster: byCluster });
}

function buildRationale(cluster, priority, psychometricSummary) {
  if (priority === "high") {
    return `This is a priority area for this student based on their assessment profile — explore it in depth.`;
  }
  if (priority === "medium") {
    return `Relevant to this student's profile — worth a focused conversation.`;
  }
  return `Not strongly indicated by this student's assessment profile — keep light.`;
}

/** Strip markdown fences if the model wrapped the JSON in them. */
function extractJson(text) {
  const trimmed = String(text || "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  return trimmed;
}

/**
 * Normalize the AI's raw output into a validated questionsByCluster
 * array. Guarantees every cluster appears EXACTLY once, ordered
 * high → medium → light.
 *
 * Two properties make a "cluster rendered under two priority values"
 * impossible by construction:
 *   1. Priority is ALWAYS taken from the deterministic `priorities`
 *      map (the score-grounded clusterPriorities) — the LLM's claimed
 *      priority is ignored. One cluster → one authoritative priority.
 *   2. If the model returns the same cluster twice (a real failure
 *      mode with LLMs), the entries MERGE — questions union together
 *      — instead of producing two rows for the same cluster.
 */
function normalizeQuestionsByCluster(raw, priorities) {
  let parsed = null;
  try {
    parsed = JSON.parse(extractJson(raw));
  } catch {
    parsed = null;
  }

  const fromAi = Array.isArray(parsed?.questionsByCluster)
    ? parsed.questionsByCluster
    : [];

  const byCluster = new Map();
  for (const entry of fromAi) {
    const cluster = String(entry?.cluster || "").trim();
    if (!cluster || !ALL_CLUSTERS.includes(cluster)) continue;

    const questions = (Array.isArray(entry.questions) ? entry.questions : [])
      .filter((q) => typeof q === "string" && q.trim().length > 0)
      .map((q) => q.trim());
    const rationale =
      typeof entry.rationale === "string" && entry.rationale.trim()
        ? entry.rationale.trim()
        : "";

    const existing = byCluster.get(cluster);
    byCluster.set(cluster, {
      cluster,
      // Deterministic, score-grounded priority — never the LLM's claim.
      priority: priorities[cluster] || "light",
      // Merge duplicate entries AND dedupe identical question strings.
      questions: existing
        ? [...new Set([...existing.questions, ...questions])]
        : questions,
      rationale: existing?.rationale || rationale,
    });
  }

  // Guarantee all six clusters are present, even if the model skipped one
  for (const cluster of clusterConfig.clusters) {
    if (byCluster.has(cluster.code)) continue;
    const priority = priorities[cluster.code] || "light";
    byCluster.set(cluster.code, {
      cluster: cluster.code,
      priority,
      questions: [],
      rationale: "Not prioritized for this student.",
    });
  }

  return [...byCluster.values()].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  );
}

/**
 * Generate (or regenerate) the question set for a session.
 * Grounded in the student's actual scores via clusterPriorityService —
 * the AI is given the priorities, it does not choose them.
 */
async function generateQuestionSet({ session, studentId }) {
  const { priorities, completedAssessmentCount } =
    await clusterPriorityService.computeClusterPriorities(studentId);

  if (completedAssessmentCount === 0) {
    throw new ApiError(
      400,
      "This student has no completed assessments yet. Assign and complete at least one assessment before generating interview questions."
    );
  }

  const scores = await clusterPriorityService.getStudentCurrentScores(studentId);
  const psychometricSummary = clusterPriorityService.buildPsychometricSummary(scores);

  const clusterPriorities = clusterConfig.clusters
    .map((c) => ({ cluster: c.code, priority: priorities[c.code] }))
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  // Parent sessions are not currently available; both Candidate and
  // Professional sessions use the candidate prompt template.
  const promptKey = "interview-question-generator-candidate";

  const aiResponse = await aiService.generate({
    promptKey,
    variables: { clusterPriorities, psychometricSummary },
    requestType: "interview-questions",
  });

  const questionsByCluster = normalizeQuestionsByCluster(aiResponse.text, priorities);

  // Regeneration replaces the previous set for this session
  await InterviewQuestionSet.deleteMany({ sessionId: session._id });

  const questionSet = await InterviewQuestionSet.create({
    sessionId: session._id,
    clusterPriorities: clusterPriorities.map((c) => ({
      cluster: c.cluster,
      priority: c.priority,
    })),
    questionsByCluster,
    reviewedByCounselor: false,
    generatedAt: new Date(),
  });

  session.status = "questions_generated";
  await session.save();

  return { questionSet, source: aiResponse.source };
}

/** Fetch the latest question set for a session. */
async function getLatestQuestionSet(sessionId) {
  const questionSet = await InterviewQuestionSet.findOne({ sessionId }).sort({
    generatedAt: -1,
  });
  if (!questionSet) {
    throw new ApiError(
      404,
      "No question set has been generated for this session yet."
    );
  }
  return questionSet;
}

/**
 * Apply counselor edits and/or approve the latest question set.
 * Sets the session to 'approved' when reviewedByCounselor is true.
 */
async function saveQuestionSetEdits({ session, questionsByCluster, reviewedByCounselor }) {
  const questionSet = await getLatestQuestionSet(session._id);

  if (Array.isArray(questionsByCluster)) {
    const priorities = {};
    for (const cp of questionSet.clusterPriorities || []) {
      priorities[cp.cluster] = cp.priority;
    }
    questionSet.questionsByCluster = normalizeQuestionsByCluster(
      JSON.stringify({ questionsByCluster }),
      priorities
    );
  }

  if (reviewedByCounselor === true) {
    questionSet.reviewedByCounselor = true;
    session.status = "approved";
    await session.save();
  }

  await questionSet.save();
  return questionSet;
}

// Register the deterministic fallback so the pipeline works without an LLM key
aiService.registerFallback("interview-question-generator-candidate", (variables) =>
  buildFallbackQuestionSetJson(variables)
);

module.exports = {
  generateQuestionSet,
  getLatestQuestionSet,
  saveQuestionSetEdits,
  normalizeQuestionsByCluster,
  CLUSTER_NAMES,
};
