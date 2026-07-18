import { describe, it, expect } from "vitest";
import { isRateLimitError, isInvalidKeyError } from "./gemini-keys";

describe("isRateLimitError", () => {
  it("recognizes quota/rate-limit signals", () => {
    expect(isRateLimitError(new Error("429 Too Many Requests"))).toBe(true);
    expect(isRateLimitError(new Error("RESOURCE_EXHAUSTED: quota exceeded"))).toBe(true);
    expect(isRateLimitError(new Error("daily quota exceeded"))).toBe(true);
  });

  it("does not misclassify an unrelated error", () => {
    expect(isRateLimitError(new Error("network timeout"))).toBe(false);
  });
});

describe("isInvalidKeyError", () => {
  it("recognizes dead/invalid-key signals", () => {
    expect(isInvalidKeyError(new Error("API_KEY_INVALID"))).toBe(true);
    expect(isInvalidKeyError(new Error("403 PERMISSION_DENIED"))).toBe(true);
    expect(isInvalidKeyError(new Error("401 UNAUTHENTICATED"))).toBe(true);
  });

  it("does not misclassify a rate-limit error as an invalid key", () => {
    expect(isInvalidKeyError(new Error("429 RESOURCE_EXHAUSTED: quota"))).toBe(false);
  });

  it("does not misclassify an unrelated error", () => {
    expect(isInvalidKeyError(new Error("network timeout"))).toBe(false);
  });
});
