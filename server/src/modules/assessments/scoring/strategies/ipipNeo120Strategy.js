const LikertSumStrategy = require("./likertSumStrategy");

/**
 * IPIPNEO120Strategy
 * Specialized strategy for 120-item IPIP Big Five Personality Assessment.
 * Inherits core Likert sum, facet, and domain aggregation from LikertSumStrategy.
 * Enhances overall code output with OCEAN profile domain summary.
 */
class IPIPNEO120Strategy extends LikertSumStrategy {
  constructor() {
    super("ipip_neo_120");
  }

  async calculateScore(context) {
    const baseResult = await super.calculateScore(context);

    // Order by standard Big Five OCEAN order: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism
    const oceanOrder = ["Openness", "Conscientiousness", "Extraversion", "Agreeableness", "Neuroticism"];
    
    // Sort dimensionScores to follow OCEAN sequence
    baseResult.dimensionScores.sort((a, b) => {
      const idxA = oceanOrder.indexOf(a.dimensionName);
      const idxB = oceanOrder.indexOf(b.dimensionName);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return 0;
    });

    // Build Big Five OCEAN Profile Code (e.g. "O-HIGH|C-HIGH|E-MED|A-HIGH|N-LOW")
    const profileCodeParts = baseResult.dimensionScores.map((d) => {
      const char = d.dimensionName.charAt(0).toUpperCase();
      const level = d.qualitativeLevel.toUpperCase();
      return `${char}:${level}`;
    });

    baseResult.overallCode = profileCodeParts.join(" | ");
    baseResult.metadata.instrument = "IPIP-NEO-120";

    return baseResult;
  }
}

module.exports = IPIPNEO120Strategy;
