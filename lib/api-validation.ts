import { NextResponse } from "next/server";
import type { ZodType } from "zod";

type ParseResult<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

/** Parses a request body as JSON and validates it against a zod schema, returning a
 * ready-to-send 400 response on either a JSON parse failure or a schema mismatch. */
export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<ParseResult<T>> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return { ok: false, response: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }) };
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid request body";
    return { ok: false, response: NextResponse.json({ error: message }, { status: 400 }) };
  }

  return { ok: true, data: result.data };
}
