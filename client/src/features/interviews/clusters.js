/**
 * Interview cluster display names.
 * Mirrors server/src/config/interviewClusters.json — the backend is
 * the source of truth for the cluster list; this map only supplies
 * human-readable labels for the UI.
 */
export const INTERVIEW_CLUSTERS = {
  motivation_drive: "Motivation & Drive",
  identity_direction: "Identity & Direction",
  cognitive_decision: "Cognitive & Decision Style",
  social_relational: "Social & Relational",
  emotional_adaptive: "Emotional & Adaptive Capacity",
  future_initiative: "Future & Initiative Orientation",
};

export default INTERVIEW_CLUSTERS;
