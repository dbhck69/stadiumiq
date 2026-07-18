import { describe, it, expect } from "vitest";
import { ChatBodySchema, OpsBodySchema, WhatIfBodySchema, BroadcastBodySchema, PlannerBodySchema } from "./api-schemas";
import { initialState } from "./simulation";

describe("ChatBodySchema", () => {
  it("accepts a minimal valid body", () => {
    expect(ChatBodySchema.safeParse({ message: "hello" }).success).toBe(true);
  });

  it("rejects an empty message", () => {
    expect(ChatBodySchema.safeParse({ message: "" }).success).toBe(false);
  });

  it("rejects a missing message", () => {
    expect(ChatBodySchema.safeParse({}).success).toBe(false);
  });
});

describe("OpsBodySchema", () => {
  const liveState = "some live state summary";

  it("requires `incident` when action is pipeline", () => {
    expect(OpsBodySchema.safeParse({ action: "pipeline", liveState }).success).toBe(false);
    expect(OpsBodySchema.safeParse({ action: "pipeline", incident: "fire in E1", liveState }).success).toBe(true);
  });

  it("requires `question` when action is qa", () => {
    expect(OpsBodySchema.safeParse({ action: "qa", liveState }).success).toBe(false);
    expect(OpsBodySchema.safeParse({ action: "qa", question: "how many open gates?", liveState }).success).toBe(true);
  });

  it("rejects an unknown action", () => {
    expect(OpsBodySchema.safeParse({ action: "nonsense", liveState }).success).toBe(false);
  });
});

describe("WhatIfBodySchema", () => {
  it("accepts a real SimState produced by the simulation engine", () => {
    const result = WhatIfBodySchema.safeParse({ question: "What if we close Gate B?", state: initialState() });
    expect(result.success).toBe(true);
  });

  it("rejects an empty question", () => {
    const result = WhatIfBodySchema.safeParse({ question: "", state: initialState() });
    expect(result.success).toBe(false);
  });
});

describe("BroadcastBodySchema", () => {
  it("rejects an empty languageCodes array", () => {
    expect(BroadcastBodySchema.safeParse({ situation: "evacuation", languageCodes: [] }).success).toBe(false);
  });

  it("accepts a valid body", () => {
    expect(BroadcastBodySchema.safeParse({ situation: "evacuation", languageCodes: ["en", "es"] }).success).toBe(true);
  });
});

describe("PlannerBodySchema", () => {
  it("requires section and arrival", () => {
    expect(PlannerBodySchema.safeParse({ section: "", arrival: "17:00" }).success).toBe(false);
    expect(PlannerBodySchema.safeParse({ section: "Lower A", arrival: "17:00" }).success).toBe(true);
  });
});
