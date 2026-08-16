const PromptTemplate = require("./promptTemplate.model");
const AIRequestLog = require("./aiRequestLog.model");
const ApiError = require("../../shared/utils/ApiError");

// ============================================================
// aiService — Single Entry Point for Every AI / LLM Call
// ============================================================
// Features NEVER call an LLM API directly. They call:
//
//   aiService.generate({ promptKey, variables, requestType })
//
// which: fetches the active PromptTemplate, validates the
// variables against expectedVariables, interpolates the
// template, calls the configured provider, and logs the call
// to AIRequestLog. When no provider key is configured (local
// dev, demo, or degraded production), a feature can register
// a deterministic local fallback so the pipeline still works.
// ============================================================

// promptKey -> (variables) => string  (deterministic local fallback)
const fallbackGenerators = new Map();

/** Register a local fallback generator for a prompt key. */
function registerFallback(promptKey, generatorFn) {
  fallbackGenerators.set(promptKey, generatorFn);
}

/**
 * Read LLM provider config from the environment.
 *
 * Supported providers (select with LLM_PROVIDER):
 *   openai — OPENAI_API_KEY (+ optional OPENAI_BASE_URL override)
 *   groq   — GROQ_API_KEY (OpenAI-compatible endpoint, free tier)
 *   gemini — GEMINI_API_KEY
 *
 * LLM_MODEL overrides the per-provider default model.
 * This is the ONLY place provider specifics live — features call
 * aiService.generate() and never know which provider is configured.
 */
function llmConfig() {
  const provider = (process.env.LLM_PROVIDER || "openai").toLowerCase();

  if (provider === "groq") {
    const apiKey = process.env.GROQ_API_KEY;
    return {
      provider,
      apiKey,
      baseUrl: (process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/+$/, ""),
      model: process.env.LLM_MODEL || "llama-3.3-70b-versatile",
      configured: Boolean(apiKey),
    };
  }

  if (provider === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;
    return {
      provider,
      apiKey,
      baseUrl: "",
      model: process.env.LLM_MODEL || "gemini-1.5-flash",
      configured: Boolean(apiKey),
    };
  }

  // Default: OpenAI-compatible
  const apiKey = process.env.OPENAI_API_KEY;
  return {
    provider: "openai",
    apiKey,
    baseUrl: (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, ""),
    model: process.env.LLM_MODEL || "gpt-4o-mini",
    configured: Boolean(apiKey),
  };
}

/** Interpolate {{variable}} placeholders into the template text. */
function interpolate(template, variables) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, name) => {
    if (!(name in variables)) return match;
    const value = variables[name];
    if (typeof value === "string") return value;
    return JSON.stringify(value, null, 2);
  });
}

/**
 * Call an OpenAI-compatible chat completions endpoint.
 * Used by both the `openai` and `groq` providers — Groq's API is
 * OpenAI-compatible, so pointing the base URL + key at Groq is the
 * entire provider switch.
 */
async function callOpenAI(prompt, { apiKey, baseUrl, model }) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You are a career counseling assistant. You always answer with strict JSON only, no markdown fences, no commentary.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`LLM request failed (${res.status}): ${(await res.text()).slice(0, 500)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("LLM response contained no content.");
  }
  return { text, model };
}

/** Call Google's Generative Language (Gemini) API. */
async function callGemini(prompt, { apiKey, model }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7 },
    }),
  });

  if (!res.ok) {
    throw new Error(`LLM request failed (${res.status}): ${(await res.text()).slice(0, 500)}`);
  }

  const data = await res.json();
  const text = (data?.candidates?.[0]?.content?.parts || [])
    .map((part) => part.text || "")
    .join("");
  if (!text) {
    throw new Error("LLM response contained no content.");
  }
  return { text, model };
}

/** Route to the configured LLM provider. */
async function callLlm(prompt) {
  const config = llmConfig();
  if (config.provider === "gemini") return callGemini(prompt, config);
  return callOpenAI(prompt, config);
}

/**
 * Generate a response for a prompt template.
 *
 * @param {Object} options
 * @param {string} options.promptKey   Unique key of the active PromptTemplate
 * @param {Object} options.variables   Must match template.expectedVariables exactly
 * @param {string} [options.requestType] Feature bucket for the AIRequestLog audit trail
 * @returns {Promise<{text: string, source: "llm"|"fallback", model: string, latencyMs: number}>}
 */
async function generate({ promptKey, variables = {}, requestType = "generic" }) {
  const template = await PromptTemplate.findOne({ key: promptKey, active: true });
  if (!template) {
    throw new ApiError(404, `No active prompt template found for key: ${promptKey}`);
  }

  // Validate variables match the template contract
  const expected = template.expectedVariables || [];
  const missing = expected.filter((v) => !(v in variables));
  const extra = Object.keys(variables).filter((v) => !expected.includes(v));
  if (missing.length > 0) {
    throw new ApiError(400, `Missing prompt variables: ${missing.join(", ")}`);
  }
  if (extra.length > 0) {
    throw new ApiError(400, `Unexpected prompt variables: ${extra.join(", ")}`);
  }

  const prompt = interpolate(template.template, variables);
  const startedAt = Date.now();

  let text = "";
  let source = "fallback";
  let model = "";
  let status = "success";
  let error = "";

  const { configured } = llmConfig();
  if (configured) {
    try {
      const result = await callLlm(prompt);
      text = result.text;
      model = result.model;
      source = "llm";
    } catch (err) {
      error = err.message;
      if (fallbackGenerators.has(promptKey)) {
        // Graceful degradation: provider failed, use the local generator
        status = "fallback_after_error";
        text = fallbackGenerators.get(promptKey)(variables);
        model = "local-fallback";
      } else {
        status = "error";
      }
    }
  } else if (fallbackGenerators.has(promptKey)) {
    text = fallbackGenerators.get(promptKey)(variables);
    model = "local-fallback";
  } else {
    status = "error";
    error = `No LLM configured and no local fallback registered for prompt key '${promptKey}'.`;
  }

  const latencyMs = Date.now() - startedAt;

  // Audit trail — every AI call is observable
  await AIRequestLog.create({
    requestType,
    promptKey,
    variables,
    prompt,
    response: text,
    source,
    model,
    latencyMs,
    status,
    error,
  });

  if (status === "error") {
    throw new ApiError(502, `AI generation failed: ${error || "Unknown error"}`);
  }

  return { text, source, model, latencyMs };
}

module.exports = {
  generate,
  registerFallback,
  llmConfig,
};
