const BaseScoringStrategy = require("../baseScoringStrategy");

/**
 * RIASECHollandStrategy
 * Concrete scoring strategy for the O*NET Interest Profiler Short Form (60 items).
 * 
 * Pipeline:
 * 1. Evaluate responses: boolean true or numeric 1/5 = checked, false or 0 = not checked
 * 2. Category score: count of checked items per RIASEC category (0-10 scale)
 * 3. Band conversion: 0-3 => "Low", 4-6 => "Moderate", 7-10 => "High"
 * 4. Holland Code: Top 3 category codes ranked by rawScore descending
 */
class RIASECHollandStrategy extends BaseScoringStrategy {
  constructor() {
    super("riasec_holland");

    this.categoryDefinitions = [
      { code: "R", name: "Realistic" },
      { code: "I", name: "Investigative" },
      { code: "A", name: "Artistic" },
      { code: "S", name: "Social" },
      { code: "E", name: "Enterprising" },
      { code: "C", name: "Conventional" },
    ];
  }

  getBand(rawScore) {
    if (rawScore <= 3) return "Low";
    if (rawScore <= 6) return "Moderate";
    return "High";
  }

  async calculateScore({ session, definition, questions, responseDoc }) {
    const rawResponses = responseDoc ? responseDoc.responses : [];

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

    // Category counts map (R, I, A, S, E, C)
    const categoryCounts = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    let totalItemsScored = 0;
    let totalChecked = 0;

    for (const q of questions) {
      const qIdStr = q._id ? q._id.toString() : "";
      let rawVal = null;

      if (qIdStr && answerMapById.has(qIdStr)) {
        rawVal = answerMapById.get(qIdStr);
      } else if (typeof q.questionNumber === "number" && answerMapByNum.has(q.questionNumber)) {
        rawVal = answerMapByNum.get(q.questionNumber);
      }

      if (rawVal === null || rawVal === undefined) continue;

      totalItemsScored++;

      // Checked if true, 1, "true", or >= 4
      const isChecked =
        rawVal === true ||
        rawVal === 1 ||
        rawVal === "1" ||
        rawVal === "true" ||
        Number(rawVal) >= 4;

      if (isChecked) {
        totalChecked++;
        const catCode = q.domain || q.category || q.facet;
        if (catCode && categoryCounts[catCode] !== undefined) {
          categoryCounts[catCode]++;
        }
      }
    }

    // Build categoryScores array
    const categoryScores = this.categoryDefinitions.map((cat) => {
      const rawScore = categoryCounts[cat.code] || 0;
      const band = this.getBand(rawScore);
      const normalizedScore = Math.round((rawScore / 10) * 100);

      return {
        code: cat.code,
        name: cat.name,
        rawScore,
        band,
        normalizedScore,
      };
    });

    // Compute Holland Code: Sort by rawScore desc, break ties by RIASEC definition order
    const sortedCategories = [...categoryScores].sort((a, b) => {
      if (b.rawScore !== a.rawScore) {
        return b.rawScore - a.rawScore;
      }
      const order = { R: 1, I: 2, A: 3, S: 4, E: 5, C: 6 };
      return (order[a.code] || 99) - (order[b.code] || 99);
    });

    const top3Codes = sortedCategories.slice(0, 3).map((c) => c.code);
    const hollandCode = top3Codes.join("");

    return {
      sessionId: session._id,
      studentId: session.clientId,
      clientId: session.clientId,
      assessmentDefinitionId: definition._id,
      category: definition.category || "interest",
      assessmentKey: "onet-interest-profiler-short",
      scoringStrategy: this.name,
      categoryScores,
      hollandCode,
      overallCode: `HOLLAND: ${hollandCode}`,
      overallScore: Math.round((totalChecked / 60) * 100),
      metadata: {
        totalItemsScored,
        totalChecked,
        hollandCode,
        top3Categories: top3Codes,
        rankedCategories: sortedCategories.map((c) => ({ code: c.code, name: c.name, score: c.rawScore })),
      },
    };
  }
}

module.exports = RIASECHollandStrategy;
