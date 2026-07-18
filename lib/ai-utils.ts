/** Shared helpers for API routes: JSON parsing + graceful degradation. */

import { generate } from "./gemini";

export interface AiResult<T> {
  ok: boolean;
  data?: T;
  fallback?: boolean;
  error?: string;
}

/** Parse Gemini JSON output, tolerating stray code fences. */
export function parseJson<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?/m, "").replace(/```\s*$/m, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in response");
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

/** Run a JSON-mode generation; returns ok=false instead of throwing. */
export async function generateJson<T>(prompt: string): Promise<AiResult<T>> {
  try {
    const text = await generate(prompt, true);
    return { ok: true, data: parseJson<T>(text) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "AI request failed" };
  }
}

/** Run a plain-text generation; returns ok=false instead of throwing. */
export async function generateText(prompt: string): Promise<AiResult<string>> {
  try {
    const text = await generate(prompt, false);
    return { ok: true, data: text };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "AI request failed" };
  }
}
