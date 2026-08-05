const BaseScoringStrategy = require("../baseScoringStrategy");

class LikertSumStrategy extends BaseScoringStrategy {
  constructor(name = "likert_sum") {
    super(name);
  }

  /**
   * Calculates score for Likert-scale assessments with domain & facet aggregation
   */
  async calculateScore({ session, definition, questions, responseDoc }) {
    const scaleConfig = definition.scale || {};
    const minScale = Number(scaleConfig.min) || 1;
    const maxScale = Number(scaleConfig.max) || 5;

    // Index questions by ID
    const questionMap = new Map();
    for (const q of questions) {
      questionMap.set(q._id.toString(), q);
    }

    // Build raw responses map: questionId -> raw answer
    const rawResponses = responseDoc ? responseDoc.responses : [];
    const answerMap = new Map();
    for (const r of rawResponses) {
      answerMap.set(r.questionId.toString(), r.selectedValue);
    }

    // Pipeline Stage 1: Reverse Scoring & Item Weighting
    // Map: questionId -> { scoredValue, maxPossible, domain, facet, weight }
    const itemScores = [];

    for (const q of questions) {
      const qIdStr = q._id.toString();
      const rawValue = answerMap.has(qIdStr) ? answerMap.get(qIdStr) : null;

      if (rawValue === null || rawValue === undefined) continue;

      let numericVal = Number(rawValue);
      if (isNaN(numericVal)) continue;

      // Handle Reverse Scoring if flagged
      if (q.reverseScored) {
        numericVal = this.computeReverseScore(numericVal, minScale, maxScale);
      }

      // Apply Weighting (default 1)
      const weight = q.weight || 1;
      const weightedScore = numericVal * weight;
      const weightedMax = maxScale * weight;
      const weightedMin = minScale * weight;

      itemScores.push({
        questionId: q._id,
        domain: q.domain || "General",
        facet: q.facet || "General",
        rawScore: weightedScore,
        minScore: weightedMin,
        maxScore: weightedMax,
      });
    }

    // Pipeline Stage 2: Facet Aggregation
    const facetBuckets = new Map();
    for (const item of itemScores) {
      const key = `${item.domain}:::${item.facet}`;
      if (!facetBuckets.has(key)) {
        facetBuckets.set(key, {
          domain: item.domain,
          facet: item.facet,
          sumRaw: 0,
          sumMin: 0,
          sumMax: 0,
          count: 0,
        });
      }
      const b = facetBuckets.get(key);
      b.sumRaw += item.rawScore;
      b.sumMin += item.minScore;
      b.sumMax += item.maxScore;
      b.count += 1;
    }

    const facetScoresMap = new Map(); // domain -> list of facet scores
    for (const [key, b] of facetBuckets.entries()) {
      const range = b.sumMax - b.sumMin;
      const normalizedScore = range > 0
        ? Math.round(((b.sumRaw - b.sumMin) / range) * 100)
        : 0;

      const facetResult = {
        facetName: b.facet,
        rawScore: b.sumRaw,
        normalizedScore,
        percentile: normalizedScore, // 0-100 scale approximation
        qualitativeLevel: this.getQualitativeLevel(normalizedScore),
      };

      if (!facetScoresMap.has(b.domain)) {
        facetScoresMap.set(b.domain, []);
      }
      facetScoresMap.get(b.domain).push(facetResult);
    }

    // Pipeline Stage 3: Domain Aggregation
    const domainBuckets = new Map();
    for (const item of itemScores) {
      if (!domainBuckets.has(item.domain)) {
        domainBuckets.set(item.domain, {
          domainName: item.domain,
          sumRaw: 0,
          sumMin: 0,
          sumMax: 0,
          count: 0,
        });
      }
      const b = domainBuckets.get(item.domain);
      b.sumRaw += item.rawScore;
      b.sumMin += item.minScore;
      b.sumMax += item.maxScore;
      b.count += 1;
    }

    const dimensionScores = [];
    for (const [domainName, b] of domainBuckets.entries()) {
      const range = b.sumMax - b.sumMin;
      const normalizedScore = range > 0
        ? Math.round(((b.sumRaw - b.sumMin) / range) * 100)
        : 0;

      const facets = facetScoresMap.get(domainName) || [];

      dimensionScores.push({
        dimensionName: b.domainName,
        rawScore: b.sumRaw,
        normalizedScore,
        percentile: normalizedScore,
        qualitativeLevel: this.getQualitativeLevel(normalizedScore),
        facetScores: facets,
      });
    }

    // Pipeline Stage 4: Overall Summary Code Generation
    // Sort domains by normalized score descending
    const sortedDomains = [...dimensionScores].sort((a, b) => b.normalizedScore - a.normalizedScore);
    const overallCode = sortedDomains.map((d) => d.dimensionName.charAt(0).toUpperCase()).join("");

    const totalRaw = dimensionScores.reduce((acc, d) => acc + d.rawScore, 0);
    const avgNormalized = dimensionScores.length > 0
      ? Math.round(dimensionScores.reduce((acc, d) => acc + d.normalizedScore, 0) / dimensionScores.length)
      : 0;

    return {
      sessionId: session._id,
      clientId: session.clientId,
      assessmentDefinitionId: definition._id,
      category: definition.category,
      scoringStrategy: this.name,
      dimensionScores,
      overallCode,
      overallScore: avgNormalized,
      metadata: {
        totalItemsScored: itemScores.length,
        totalRawScore: totalRaw,
        calculatedByStrategy: this.name,
      },
    };
  }
}

module.exports = LikertSumStrategy;
