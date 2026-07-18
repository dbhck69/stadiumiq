import { describe, it, expect } from "vitest";
import { initialState, tick, phaseFor, clockLabel, runScenario } from "./simulation";

describe("initialState", () => {
  it("is deterministic for a given seed", () => {
    const a = initialState(2026);
    const b = initialState(2026);
    expect(a).toEqual(b);
  });

  it("differs for a different seed", () => {
    const a = initialState(2026);
    const b = initialState(1);
    expect(a).not.toEqual(b);
  });

  it("starts before kickoff with every gate open and no incidents", () => {
    const s = initialState();
    expect(s.phase).toBe("ingress");
    expect(s.incidents).toHaveLength(0);
    expect(s.gates.every((g) => g.open)).toBe(true);
  });
});

describe("tick", () => {
  it("advances the minute by exactly one and does not mutate the input", () => {
    const s = initialState();
    const next = tick(s);
    expect(next.minute).toBe(s.minute + 1);
    expect(s.minute).toBe(180 - 30);
  });

  it("is deterministic for the same input state", () => {
    const s = initialState();
    const a = tick(s);
    const b = tick(s);
    expect(a).toEqual(b);
  });

  it("keeps occupancy within each sector's capacity", () => {
    let s = initialState();
    for (let i = 0; i < 50; i++) s = tick(s);
    for (const sector of s.sectors) {
      expect(sector.occupancy).toBeGreaterThanOrEqual(0);
      expect(sector.occupancy).toBeLessThanOrEqual(sector.capacity);
    }
  });
});

describe("phaseFor", () => {
  it("classifies known matchday minutes correctly", () => {
    expect(phaseFor(0)).toBe("ingress");
    expect(phaseFor(180)).toBe("first-half");
    expect(phaseFor(225)).toBe("halftime");
    expect(phaseFor(240)).toBe("second-half");
    expect(phaseFor(400)).toBe("egress");
  });
});

describe("clockLabel", () => {
  it("renders a human-readable label for each phase", () => {
    expect(clockLabel(0)).toMatch(/kickoff in/i);
    expect(clockLabel(225)).toBe("Halftime");
  });
});

describe("runScenario", () => {
  it("produces a series covering the requested duration", () => {
    const start = initialState();
    const result = runScenario(start, 30, {}, "baseline");
    expect(result.label).toBe("baseline");
    expect(result.series.length).toBeGreaterThan(0);
    expect(result.series[result.series.length - 1].minute).toBe(start.minute + 30);
  });
});
