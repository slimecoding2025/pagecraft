// lib/json-repair.ts
// OpenRouter's "openrouter/auto" model can land on any underlying model, and
// free-tier models frequently ignore "return raw JSON" instructions: they
// wrap output in ```json fences, prepend a sentence of preamble, truncate
// trailing braces, or use trailing commas. This module makes a best-effort
// attempt to recover valid JSON from whatever text comes back.

/**
 * Strip common wrapping artifacts (markdown code fences, leading/trailing
 * prose) from a raw LLM text response.
 */
function stripCodeFences(raw: string): string {
  let text = raw.trim();

  // Remove ```json ... ``` or ``` ... ``` fences.
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    text = fenceMatch[1].trim();
  }

  return text;
}

/**
 * Extract the substring that looks like the outermost JSON object, in case
 * the model added commentary before or after the JSON payload.
 */
function extractOutermostObject(text: string): string {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    return text;
  }

  return text.slice(firstBrace, lastBrace + 1);
}

/**
 * Fix a small set of common, mechanically-recoverable JSON syntax issues:
 * trailing commas, single-quoted strings, unquoted keys, and smart quotes.
 * This is intentionally conservative — it does not attempt to fix deeply
 * malformed JSON, only the patterns models commonly produce.
 */
function repairCommonIssues(text: string): string {
  let repaired = text;

  // Smart quotes -> straight quotes.
  repaired = repaired
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');

  // Trailing commas before a closing brace/bracket.
  repaired = repaired.replace(/,(\s*[}\]])/g, "$1");

  // Unquoted object keys: { key: "value" } -> { "key": "value" }
  repaired = repaired.replace(
    /([{,]\s*)([A-Za-z0-9_]+)(\s*:)/g,
    '$1"$2"$3'
  );

  return repaired;
}

/**
 * Attempt a series of increasingly aggressive strategies to turn arbitrary
 * model output into a parsed JSON object. Throws only if every strategy
 * fails.
 */
export function repairAndParseJson<T = unknown>(rawInput: string): T {
  const attempts: Array<() => T> = [
    () => JSON.parse(rawInput) as T,
    () => JSON.parse(stripCodeFences(rawInput)) as T,
    () => JSON.parse(extractOutermostObject(stripCodeFences(rawInput))) as T,
    () =>
      JSON.parse(
        repairCommonIssues(extractOutermostObject(stripCodeFences(rawInput)))
      ) as T,
    () => JSON.parse(repairCommonIssues(rawInput)) as T,
  ];

  let lastError: unknown = null;

  for (const attempt of attempts) {
    try {
      return attempt();
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(
    `Unable to parse JSON from model output after all repair strategies. Last error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}
