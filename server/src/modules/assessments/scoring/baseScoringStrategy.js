/**
 * BaseScoringStrategy — Abstract Base Class for Assessment Scoring Strategies
 * All concrete scoring strategies must implement the `calculateScore` method.
 */

class BaseScoringStrategy {
  constructor(name) {
    if (new.target === BaseScoringStrategy) {
      throw new TypeError("Cannot instantiate abstract class BaseScoringStrategy directly.");
    }
    this.name = name;
  }

  /**
   * Main calculation entrypoint
   * @param {Object} context
   * @param {Object} context.session - AssessmentSession document
   * @param {Object} context.definition - AssessmentDefinition document
   * @param {Array}  context.questions - Array of AssessmentQuestion documents
   * @param {Object} context.responseDoc - AssessmentResponse document
   * @returns {Object} Score payload formatted for AssessmentScore creation
   */
  async calculateScore(_context) {
    throw new Error("Method 'calculateScore()' must be implemented by concrete subclass.");
  }

  /**
   * Helper: Reverse score calculation
   * For 1-5 scale: (1 + 5) - raw = 6 - raw (1->5, 2->4, 3->3, 4->2, 5->1)
   */
  computeReverseScore(rawValue, minScale = 1, maxScale = 5) {
    const numVal = Number(rawValue);
    if (isNaN(numVal)) return rawValue;
    return minScale + maxScale - numVal;
  }

  /**
   * Helper: Qualitative level classification
   */
  getQualitativeLevel(normalizedScore) {
    if (normalizedScore >= 70) return "High";
    if (normalizedScore >= 35) return "Medium";
    return "Low";
  }
}

module.exports = BaseScoringStrategy;
