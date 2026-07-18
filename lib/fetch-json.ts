/** POSTs JSON with a hard timeout so a slow/hanging server call can never freeze
 * the UI indefinitely — it fails fast instead, which also makes it eligible for
 * TanStack Query's retry-with-backoff (a plain throw, same as a network failure). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchJson<T = any>(url: string, body: unknown, timeoutMs = 20000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
