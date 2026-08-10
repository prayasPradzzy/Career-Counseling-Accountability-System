const LikertSumStrategy = require("./strategies/likertSumStrategy");
const IPIPNEO120Strategy = require("./strategies/ipipNeo120Strategy");
const RIASECHollandStrategy = require("./strategies/riasecHollandStrategy");
const OnetWilStrategy = require("./strategies/onetWilStrategy");

/**
 * ScoringRegistry — Strategy Pattern Registry for Assessment Scoring
 * Decouples scoring engine from concrete assessment implementations.
 * Allows runtime strategy registration and fallback resolution.
 */
class ScoringRegistry {
  constructor() {
    this.strategies = new Map();

    // Register built-in default strategies
    this.register(new LikertSumStrategy("likert_sum"));
    this.register(new IPIPNEO120Strategy());
    this.register(new RIASECHollandStrategy());
    this.register(new OnetWilStrategy());
  }

  /**
   * Register a new scoring strategy
   * @param {BaseScoringStrategy} strategyInstance
   */
  register(strategyInstance) {
    if (!strategyInstance || !strategyInstance.name) {
      throw new Error("Invalid scoring strategy instance. Must have a valid 'name' property.");
    }
    this.strategies.set(strategyInstance.name.toLowerCase(), strategyInstance);
    console.log(`📌 Registered scoring strategy: '${strategyInstance.name}'`);
  }

  /**
   * Resolve strategy by code identifier (e.g. "likert_sum", "ipip_neo_120", "riasec_holland")
   * Falls back to "likert_sum" if identifier is unmapped.
   */
  getStrategy(strategyName) {
    if (!strategyName) {
      return this.strategies.get("likert_sum");
    }

    const key = strategyName.toLowerCase();
    if (this.strategies.has(key)) {
      return this.strategies.get(key);
    }

    // Alias checks
    if (key.includes("ipip")) {
      return this.strategies.get("ipip_neo_120");
    }
    if (key.includes("riasec") || key.includes("holland")) {
      return this.strategies.get("riasec_holland");
    }
    if (key.includes("wil") || key.includes("work_importance") || key.includes("work-importance")) {
      return this.strategies.get("onet_wil");
    }

    // Fallback default
    console.warn(`⚠️  Unknown scoring strategy '${strategyName}'. Falling back to 'likert_sum'.`);
    return this.strategies.get("likert_sum");
  }

  /**
   * List all registered strategy names
   */
  listRegisteredStrategies() {
    return Array.from(this.strategies.keys());
  }
}

module.exports = new ScoringRegistry();
