const LikertSumStrategy = require("./likertSumStrategy");

/**
 * RIASECStrategy
 * Specialized strategy for Holland Occupational Themes Interest Assessment.
 * Computes 6 RIASEC domain scores and extracts the Top 3 Holland Code (e.g. "RIA", "SEC").
 */
class RIASECStrategy extends LikertSumStrategy {
  constructor() {
    super("riasec_holland");
  }

  async calculateScore(context) {
    const baseResult = await super.calculateScore(context);

    // Extract top 3 highest scoring domains to form the Holland Code (e.g. "RIA")
    const sorted = [...baseResult.dimensionScores].sort((a, b) => b.normalizedScore - a.normalizedScore);
    const top3Code = sorted.slice(0, 3).map((d) => d.dimensionName.charAt(0).toUpperCase()).join("");

    baseResult.overallCode = top3Code;
    baseResult.metadata.instrument = "Holland RIASEC";

    return baseResult;
  }
}

module.exports = RIASECStrategy;
