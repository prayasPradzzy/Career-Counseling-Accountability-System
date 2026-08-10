const BaseScoringStrategy = require("../baseScoringStrategy");

/**
 * OnetWilStrategy
 * Concrete scoring strategy for the O*NET Work Importance Locator (Version 3.0).
 *
 * Source: U.S. Department of Labor, Employment and Training Administration.
 *   O*NET Work Importance Locator, Version 3.0. Retired June 3, 2024.
 *   O*NET™ is a trademark of USDOL/ETA. Used under CC-BY 4.0.
 *
 * Pipeline:
 * 1. Read responses: each questionId maps to a selectedValue of 1–5 (the column the student placed the card in).
 * 2. Group by work value (via question.domain = work value code).
 * 3. For each work value:
 *    rawSum = sum of selectedValues for all cards in that value
 *    weightedScore = rawSum × multiplier (stored in question.weight)
 * 4. Band conversion on the 6–30 scale:
 *    6–13  → "Low"
 *    14–21 → "Moderate"
 *    22–30 → "High"
 * 5. topWorkValues = top 2 codes by weightedScore (ties broken alphabetically)
 *
 * Score validation: every work value normalizes to the 6–30 range regardless of card count,
 * because the multiplier compensates for the number of cards per value.
 */
class OnetWilStrategy extends BaseScoringStrategy {
  constructor() {
    super("onet_wil");

    // Work value definitions — order used for consistent output ordering
    this.workValueOrder = [
      { code: "achievement",      name: "Achievement" },
      { code: "recognition",      name: "Recognition" },
      { code: "relationships",    name: "Relationships" },
      { code: "support",          name: "Support" },
      { code: "independence",     name: "Independence" },
      { code: "workingConditions", name: "Working Conditions" },
    ];
  }

  /**
   * Band conversion for the 6–30 score range.
   * Roughly equal thirds: Low (6–13), Moderate (14–21), High (22–30).
   */
  getBand(weightedScore) {
    if (weightedScore <= 13) return "Low";
    if (weightedScore <= 21) return "Moderate";
    return "High";
  }

  async calculateScore({ session, definition, questions, responseDoc }) {
    const rawResponses = responseDoc ? responseDoc.responses : [];

    // Build answer maps (by questionId string and by questionNumber)
    const answerMapById = new Map();
    const answerMapByNum = new Map();

    for (const r of rawResponses) {
      if (r.questionId) {
        answerMapById.set(r.questionId.toString(), r.selectedValue);
      }
      if (typeof r.questionNumber === "number" && r.questionNumber > 0) {
        answerMapByNum.set(r.questionNumber, r.selectedValue);
      }
    }

    // Accumulate rawSums and multipliers per work value code
    const valueBuckets = {};
    for (const wv of this.workValueOrder) {
      valueBuckets[wv.code] = { rawSum: 0, multiplier: 1, cardCount: 0 };
    }

    let totalCardsScored = 0;

    for (const q of questions) {
      const qIdStr = q._id ? q._id.toString() : "";
      let rawVal = null;

      if (qIdStr && answerMapById.has(qIdStr)) {
        rawVal = answerMapById.get(qIdStr);
      } else if (typeof q.questionNumber === "number" && answerMapByNum.has(q.questionNumber)) {
        rawVal = answerMapByNum.get(q.questionNumber);
      }

      if (rawVal === null || rawVal === undefined) continue;

      const columnValue = Number(rawVal);
      if (isNaN(columnValue) || columnValue < 1 || columnValue > 5) continue;

      const valueCode = q.domain || "";
      if (!valueCode || !valueBuckets[valueCode]) continue;

      // multiplier: prefer question.weight (set by seeder), fall back to 1
      const multiplier = typeof q.weight === "number" && q.weight > 0 ? q.weight : 1;
      valueBuckets[valueCode].rawSum += columnValue;
      valueBuckets[valueCode].multiplier = multiplier; // same multiplier for all cards in a value
      valueBuckets[valueCode].cardCount += 1;
      totalCardsScored++;
    }

    // Build workValueScores array in canonical order
    const workValueScores = this.workValueOrder.map((wv) => {
      const bucket = valueBuckets[wv.code] || { rawSum: 0, multiplier: 1, cardCount: 0 };
      const weightedScore = bucket.rawSum * bucket.multiplier;
      const band = this.getBand(weightedScore);

      return {
        code: wv.code,
        name: wv.name,
        rawSum: bucket.rawSum,
        weightedScore,
        band,
        cardCount: bucket.cardCount,
        multiplier: bucket.multiplier,
      };
    });

    // Identify top 2 work values (ties broken by canonical order)
    const sorted = [...workValueScores].sort((a, b) => {
      if (b.weightedScore !== a.weightedScore) return b.weightedScore - a.weightedScore;
      // Alphabetical tie-break for determinism
      return a.code.localeCompare(b.code);
    });

    const topWorkValues = sorted.slice(0, 2).map((wv) => wv.code);
    const topWorkValueNames = sorted.slice(0, 2).map((wv) => wv.name);

    // Overall code: top 2 names joined (e.g. "Achievement · Independence")
    const overallCode = topWorkValueNames.join(" · ");

    return {
      sessionId: session._id,
      studentId: session.clientId,
      clientId: session.clientId,
      assessmentDefinitionId: definition._id,
      category: definition.category || "values",
      assessmentKey: "onet-work-importance-locator",
      scoringStrategy: this.name,
      workValueScores,
      topWorkValues,
      overallCode,
      overallScore: null, // no single numeric overall score for this instrument
      metadata: {
        totalCardsScored,
        topWorkValues,
        topWorkValueNames,
        rankedValues: sorted.map((wv) => ({
          code: wv.code,
          name: wv.name,
          weightedScore: wv.weightedScore,
          band: wv.band,
        })),
        scoringNote:
          "weightedScore = rawSum × multiplier. All values normalize to the 6–30 range. Top 2 values are the primary result.",
      },
    };
  }
}

module.exports = OnetWilStrategy;
