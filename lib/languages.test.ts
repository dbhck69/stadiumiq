import { describe, it, expect } from "vitest";
import { WORLD_CUP_LANGUAGES, BROADCAST_DEFAULTS, getLanguage } from "./languages";

describe("WORLD_CUP_LANGUAGES", () => {
  it("has no duplicate BCP-47 codes", () => {
    const codes = WORLD_CUP_LANGUAGES.map((l) => l.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("gives every language a code, name, and native name", () => {
    for (const lang of WORLD_CUP_LANGUAGES) {
      expect(lang.code).toBeTruthy();
      expect(lang.name).toBeTruthy();
      expect(lang.native).toBeTruthy();
    }
  });

  it("marks Arabic and Persian as RTL", () => {
    expect(getLanguage("ar-SA")?.rtl).toBe(true);
    expect(getLanguage("fa-IR")?.rtl).toBe(true);
  });

  it("does not mark English as RTL", () => {
    expect(getLanguage("en-US")?.rtl).toBeFalsy();
  });
});

describe("BROADCAST_DEFAULTS", () => {
  it("only references codes that exist in the language list", () => {
    for (const code of BROADCAST_DEFAULTS) {
      expect(getLanguage(code)).toBeDefined();
    }
  });
});

describe("getLanguage", () => {
  it("returns undefined for an unknown code", () => {
    expect(getLanguage("xx-XX")).toBeUndefined();
  });
});
