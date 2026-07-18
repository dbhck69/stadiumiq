import { describe, it, expect } from "vitest";
import { z } from "zod";
import { parseBody } from "./api-validation";

const Schema = z.object({ message: z.string().min(1, "message is required") });

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("parseBody", () => {
  it("returns ok:true with the parsed data for a valid body", async () => {
    const result = await parseBody(jsonRequest({ message: "hello" }), Schema);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.message).toBe("hello");
  });

  it("returns a 400 response when the schema rejects the body", async () => {
    const result = await parseBody(jsonRequest({ message: "" }), Schema);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(400);
  });

  it("returns a 400 response for malformed JSON", async () => {
    const badRequest = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ not valid json",
    });
    const result = await parseBody(badRequest, Schema);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(400);
  });
});
