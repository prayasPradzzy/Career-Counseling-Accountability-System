const AssessmentScore = require("../assessments/assessmentScore.model");
const clusterConfig = require("../../config/interviewClusters.json");
const weightingRules = require("../../config/clusterWeightingRules.json");

// ============================================================
// clusterPriorityService — Deterministic Priority Mapping
// ============================================================
// Decides which interview clusters matter most for a student by
// applying clusterWeightingRules.json to their actual scored
// assessments. This grounding is computed in code — the AI is
// told the priorities, it does not get to decide them itself.
// ============================================================

const ALL_CLUSTERS = clusterConfig.clusters.map((c) => c.code);
const CLUSTER_NAMES = Object.fromEntries(
  clusterConfig.clusters.map((c) => [c.code, c.name])
);

/**
 * Fetch the student's latest score document per assessment key.
 * Works whether they have completed 1, 2, 3, or 4 assessments —
 * never assumes a fixed count or set of keys.
 */
async function getStudentCurrentScores(studentId) {
  const scores = await AssessmentScore.find({
    $or: [{ studentId }, { clientId: studentId }],
  }).sort({ version: -1, calculatedAt: -1 });

  const latestByKey = new Map();
  for (const score of scores) {
    const key = (score.assessmentKey || "").toLowerCase().trim();
    if (key && !latestByKey.has(key)) {
      latestByKey.set(key, score);
    }
  }
  return [...latestByKey.values()];
}

/**
 * Evaluate one weighting rule's condition against a score document.
 * Conditions are the small, data-driven DSL from
 * clusterWeightingRules.json, e.g. `band === 'High' || band === 'Low'`,
 * `isTopTwo`, or `isInHollandCode`.
 */
function evaluateCondition(rule, score) {
  const key = (score.assessmentKey || "").toLowerCase().trim();

  // O*NET Work Importance Locator — is a value among the top two?
  if (key === "onet-work-importance-locator" && rule.condition === "isTopTwo") {
    return (score.topWorkValues || []).includes(rule.workValue);
  }

  // O*NET Interest Profiler — is a RIASEC category in the Holland code?
  if (key === "onet-interest-profiler-short" && rule.condition === "isInHollandCode") {
    const holland = (score.hollandCode || "").toUpperCase();
    return holland.includes((rule.category || "").toUpperCase());
  }

  // IPIP-NEO-120 — domain band comparison, e.g. `band === 'High' || band === 'Low'`
  const domainScores = score.domainScores || score.dimensionScores || [];
  const domain = domainScores.find(
    (d) => (d.domain || d.code || "") === (rule.domain || "")
  );
  if (!domain) return false;

  const band = domain.band || "";
  const clauses = String(rule.condition || "")
    .split("||")
    .map((c) => c.trim());
  return clauses.some((clause) => {
    const match = clause.match(/band\s*===\s*'([^']+)'/);
    return Boolean(match) && band === match[1];
  });
}

/**
 * Compute cluster priorities for a student.
 *
 * Every rule match increments a boost count for the listed
 * cluster(s). Counts >= 2 → 'high', === 1 → 'medium', 0 → 'light'.
 *
 * @returns {Promise<{priorities: Object<string,"high"|"medium"|"light">, boosts: Object<string,number>, completedAssessmentCount: number}>}
 */
async function computeClusterPriorities(studentId) {
  const scores = await getStudentCurrentScores(studentId);

  const boosts = {};
  for (const rule of weightingRules.rules) {
    const score = scores.find(
      (s) => (s.assessmentKey || "").toLowerCase().trim() === rule.assessmentKey.toLowerCase()
    );
    if (!score) continue;
    if (evaluateCondition(rule, score)) {
      for (const cluster of rule.boost) {
        boosts[cluster] = (boosts[cluster] || 0) + 1;
      }
    }
  }

  const priorities = {};
  for (const code of ALL_CLUSTERS) {
    const count = boosts[code] || 0;
    priorities[code] = count >= 2 ? "high" : count === 1 ? "medium" : "light";
  }

  return { priorities, boosts, completedAssessmentCount: scores.length };
}

/**
 * Build the band-level psychometric summary handed to the AI prompt.
 * Bands only (High/Moderate/Low) — never raw numeric scores.
 */
function buildPsychometricSummary(scores) {
  const summary = {};
  for (const score of scores) {
    const key = (score.assessmentKey || "").toLowerCase().trim();
    const domains = score.domainScores || score.dimensionScores || [];

    if (key === "ipip-neo-120") {
      const bands = {};
      for (const d of domains) {
        bands[d.domain || d.code] = d.band || "Moderate";
      }
      summary[key] = { type: "personality", domainBands: bands };
    } else if (key === "onet-work-importance-locator") {
      summary[key] = { type: "values", topWorkValues: score.topWorkValues || [] };
    } else if (key === "onet-interest-profiler-short") {
      summary[key] = {
        type: "interest",
        hollandCode: score.hollandCode || "",
        categoryBands: (score.categoryScores || []).map((c) => ({
          code: c.code,
          band: c.band || "",
        })),
      };
    } else {
      // Unknown future assessment — surface whatever bands exist
      summary[key] = {
        type: score.category || "unknown",
        domainBands: domains.map((d) => ({
          code: d.domain || d.code,
          band: d.band || "",
        })),
      };
    }
  }
  return summary;
}

module.exports = {
  ALL_CLUSTERS,
  CLUSTER_NAMES,
  getStudentCurrentScores,
  computeClusterPriorities,
  buildPsychometricSummary,
};
