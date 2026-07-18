import { describe, it, expect } from "vitest";
import { GATES, SECTORS, STAFF_ROSTER, knowledgeBaseText } from "./stadium-data";

describe("GATES", () => {
  it("has unique ids", () => {
    const ids = GATES.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("SECTORS", () => {
  it("has unique ids and a positive capacity", () => {
    const ids = SECTORS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SECTORS) expect(s.capacity).toBeGreaterThan(0);
  });

  it("only references gate ids that exist in GATES", () => {
    const gateIds = new Set(GATES.map((g) => g.id));
    for (const sector of SECTORS) {
      for (const gateId of sector.gates) {
        expect(gateIds.has(gateId)).toBe(true);
      }
    }
  });
});

describe("STAFF_ROSTER", () => {
  it("has unique unit ids and a positive headcount", () => {
    const ids = STAFF_ROSTER.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const unit of STAFF_ROSTER) expect(unit.count).toBeGreaterThan(0);
  });

  it("only posts units at sectors that exist in SECTORS", () => {
    const sectorIds = new Set(SECTORS.map((s) => s.id));
    for (const unit of STAFF_ROSTER) {
      expect(sectorIds.has(unit.basePost)).toBe(true);
    }
  });
});

describe("knowledgeBaseText", () => {
  it("produces non-empty grounding text mentioning every gate", () => {
    const text = knowledgeBaseText();
    expect(text.length).toBeGreaterThan(0);
    for (const gate of GATES) expect(text).toContain(gate.name);
  });
});
