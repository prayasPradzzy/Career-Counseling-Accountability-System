const BaseScoringStrategy = require("../baseScoringStrategy");
const interpretationsConfig = require("../../../../config/ipipNeoInterpretations.json");
const ipipSeedData = require("../../../../database/data/ipip-neo-120.json");

/**
 * IPIPNEO120Strategy
 * Specialized strategy for the 120-item IPIP-NEO Big Five Personality Assessment.
 * 
 * Pipeline:
 * 1. Normalized value: question.reverseScored ? (6 - rawAnswer) : rawAnswer (1-5 scale)
 * 2. Facet Score: average of 4 normalized items per facet (30 facets total)
 * 3. Domain Score: average of 6 facet scores per domain (5 domains: O, C, E, A, N)
 * 4. Band Conversion: score < 2.5 => "Low", 2.5 <= score <= 3.5 => "Moderate", score > 3.5 => "High"
 * 5. Attach static counselor interpretation text per domain
 */
class IPIPNEO120Strategy extends BaseScoringStrategy {
  constructor() {
    super("ipip_neo_120");

    // Build lookup maps for domain and facet metadata
    this.domainCodeToName = Object.fromEntries(
      ipipSeedData.domains.map((d) => [d.code, d.name])
    );
    this.domainNameToCode = Object.fromEntries(
      ipipSeedData.domains.map((d) => [d.name, d.code])
    );
    this.facetCodeToObj = Object.fromEntries(
      ipipSeedData.facets.map((f) => [f.code, f])
    );
    this.facetNameToCode = Object.fromEntries(
      ipipSeedData.facets.map((f) => [f.name, f.code])
    );
  }

  /**
   * Determine descriptive band from numeric score (1.0 - 5.0 scale)
   * score < 2.5  -> "Low"
   * 2.5 - 3.5    -> "Moderate"
   * > 3.5        -> "High"
   */
  getBand(score) {
    if (score < 2.5) return "Low";
    if (score <= 3.5) return "Moderate";
    return "High";
  }

  async calculateScore({ session, definition, questions, responseDoc }) {
    const rawResponses = responseDoc ? responseDoc.responses : [];
    const answerMap = new Map();
    const answerMapByNum = new Map();
    for (const r of rawResponses) {
      if (r.questionId) {
        answerMap.set(r.questionId.toString(), r.selectedValue);
      }
      if (typeof r.questionNumber === "number" && r.questionNumber > 0) {
        answerMapByNum.set(r.questionNumber, r.selectedValue);
      }
    }

    // Step 1 — Normalize each answer
    const itemScores = [];
    for (const q of questions) {
      const qIdStr = q._id ? q._id.toString() : "";
      let rawAnswer = null;

      if (qIdStr && answerMap.has(qIdStr)) {
        rawAnswer = Number(answerMap.get(qIdStr));
      } else if (typeof q.questionNumber === "number" && answerMapByNum.has(q.questionNumber)) {
        rawAnswer = Number(answerMapByNum.get(q.questionNumber));
      }

      if (rawAnswer === null || isNaN(rawAnswer)) continue;

      const normalizedValue = q.reverseScored ? 6 - rawAnswer : rawAnswer;

      // Resolve domain code & facet code
      const domainName = this.domainCodeToName[q.domain] || q.domain;
      const domainCode = this.domainNameToCode[domainName] || q.domain;
      
      const facetName = this.facetCodeToObj[q.facet] ? this.facetCodeToObj[q.facet].name : q.facet;
      const facetCode = this.facetNameToCode[facetName] || q.facet;

      itemScores.push({
        questionId: q._id,
        questionNumber: q.questionNumber,
        domainCode,
        domainName,
        facetCode,
        facetName,
        normalizedValue,
      });
    }

    // Step 2 — Facet score (30 facets, 4 items each)
    const facetBuckets = new Map();
    for (const item of itemScores) {
      const key = item.facetCode;
      if (!facetBuckets.has(key)) {
        facetBuckets.set(key, {
          facetCode: item.facetCode,
          facetName: item.facetName,
          domainCode: item.domainCode,
          domainName: item.domainName,
          values: [],
        });
      }
      facetBuckets.get(key).values.push(item.normalizedValue);
    }

    const allFacetScores = [];
    const facetScoresByDomain = new Map();

    for (const [fCode, bucket] of facetBuckets.entries()) {
      const sum = bucket.values.reduce((a, b) => a + b, 0);
      const avg = bucket.values.length > 0 ? sum / bucket.values.length : 0;
      const rawScore = Number(avg.toFixed(2));
      const band = this.getBand(rawScore);
      const normalizedScore = Math.round(((rawScore - 1) / 4) * 100);

      const facetObj = {
        facet: bucket.facetCode,
        facetName: bucket.facetName,
        domain: bucket.domainCode,
        rawScore,
        band,
        normalizedScore,
        percentile: normalizedScore,
        qualitativeLevel: band,
      };

      allFacetScores.push(facetObj);

      if (!facetScoresByDomain.has(bucket.domainCode)) {
        facetScoresByDomain.set(bucket.domainCode, []);
      }
      facetScoresByDomain.get(bucket.domainCode).push(facetObj);
    }

    // Step 3 — Domain score (5 domains, 6 facets each)
    const domainOrder = [
      { code: "O", name: "Openness" },
      { code: "C", name: "Conscientiousness" },
      { code: "E", name: "Extraversion" },
      { code: "A", name: "Agreeableness" },
      { code: "N", name: "Neuroticism" },
    ];

    const domainScores = [];
    for (const dom of domainOrder) {
      const facetsForDomain = facetScoresByDomain.get(dom.code) || [];
      const sumFacetScores = facetsForDomain.reduce((acc, f) => acc + f.rawScore, 0);
      const avgDomainScore = facetsForDomain.length > 0 ? sumFacetScores / facetsForDomain.length : 0;
      const score = Number(avgDomainScore.toFixed(2));
      const band = this.getBand(score);

      // Step 4 — Static Counselor Interpretation Lookup
      const domainInterps = interpretationsConfig[dom.name] || {};
      const interpretation = domainInterps[band] || `Score is ${band} for ${dom.name}.`;

      const normalizedScore = Math.round(((score - 1) / 4) * 100);

      domainScores.push({
        domain: dom.code,
        dimensionName: dom.name,
        domainName: dom.name,
        score,
        rawScore: score,
        band,
        interpretation,
        normalizedScore,
        percentile: normalizedScore,
        qualitativeLevel: band,
        facetScores: facetsForDomain,
      });
    }

    // Step 5 — Overall Profile Code (e.g. "O:HIGH | C:MODERATE | E:HIGH | A:MODERATE | N:LOW")
    const profileCodeParts = domainScores.map((d) => `${d.domain}:${d.band.toUpperCase()}`);
    const overallCode = profileCodeParts.join(" | ");

    const avgDomainNormalized = Math.round(
      domainScores.reduce((acc, d) => acc + d.normalizedScore, 0) / domainScores.length
    );

    return {
      sessionId: session._id,
      studentId: session.clientId,
      clientId: session.clientId,
      assessmentDefinitionId: definition._id,
      category: definition.category || "personality",
      assessmentKey: "ipip-neo-120",
      scoringStrategy: this.name,
      facetScores: allFacetScores,
      domainScores,
      dimensionScores: domainScores,
      overallCode,
      overallScore: avgDomainNormalized,
      metadata: {
        totalItemsScored: itemScores.length,
        totalFacetsScored: allFacetScores.length,
        totalDomainsScored: domainScores.length,
        calculatedByStrategy: this.name,
        interpretations: Object.fromEntries(domainScores.map(d => [d.domain, d.interpretation])),
      },
    };
  }
}

module.exports = IPIPNEO120Strategy;
