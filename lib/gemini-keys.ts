/**
 * Multi-key rotation for the Gemini free tier.
 *
 * Free-tier keys have very small daily/per-minute request quotas — easy to
 * exhaust during demos or judging. Supply several keys (comma-separated in
 * GEMINI_API_KEYS) and this rotates to the next one whenever the current key
 * comes back rate-limited (429 / RESOURCE_EXHAUSTED), so a single exhausted
 * key never takes the whole app down.
 *
 * Falls back to the single GEMINI_API_KEY var if GEMINI_API_KEYS isn't set,
 * so nothing breaks for anyone running with just one key.
 */

function loadKeys(): string[] {
  const multi = process.env.GEMINI_API_KEYS;
  if (multi && multi.trim()) {
    // Split on commas OR whitespace/newlines — dashboards make it easy to
    // paste keys on separate lines, which must not fuse into one giant key.
    return multi.split(/[\s,]+/).map((k) => k.trim()).filter(Boolean);
  }
  const single = process.env.GEMINI_API_KEY;
  return single ? [single] : [];
}

const KEYS = loadKeys();

// Points at the key we currently believe is good; persists for the life of
// this server process (warm serverless instance / dev server), so once a
// working key is found we keep using it instead of always starting at 0.
let currentIndex = 0;

export function keyCount(): number {
  return KEYS.length;
}

export function currentKey(): string {
  if (KEYS.length === 0) throw new Error("No Gemini API key configured (set GEMINI_API_KEY or GEMINI_API_KEYS)");
  return KEYS[currentIndex % KEYS.length];
}

export function advanceKey(): void {
  currentIndex = (currentIndex + 1) % Math.max(KEYS.length, 1);
}

export function isRateLimitError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /429|RESOURCE_EXHAUSTED|quota/i.test(message);
}

/** A key that is malformed, revoked, or restricted — dead for every request,
 * unlike a rate-limited key which recovers. Both warrant trying the next key.
 * Google reports these variously as 400 API_KEY_INVALID, 401 UNAUTHENTICATED /
 * ACCESS_TOKEN_TYPE_UNSUPPORTED, or 403 PERMISSION_DENIED. */
export function isInvalidKeyError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /API key|API_KEY_INVALID|PERMISSION_DENIED|UNAUTHENTICATED|ACCESS_TOKEN_TYPE_UNSUPPORTED|invalid authentication|unauthorized|\b40[13]\b/i.test(message);
}

/**
 * Runs `fn` with the current key; on a rate-limit or invalid-key error,
 * advances to the next key and retries, up to once per configured key.
 * Throws the last error only once every key has been tried — so one bad
 * key in the list can never take the whole app down.
 */
export async function withKeyRotation<T>(fn: (apiKey: string) => Promise<T>): Promise<T> {
  const attempts = Math.max(KEYS.length, 1);
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    const key = currentKey();
    try {
      return await fn(key);
    } catch (err) {
      lastError = err;
      if ((isRateLimitError(err) || isInvalidKeyError(err)) && attempts > 1) {
        advanceKey();
        continue;
      }
      throw err;
    }
  }
  throw lastError ?? new Error("All Gemini API keys failed (rate-limited or invalid)");
}
