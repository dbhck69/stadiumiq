import { NextResponse } from "next/server";
import { scenarioParsePrompt, scenarioNarratePrompt } from "@/lib/gemini";
import { generateJson } from "@/lib/ai-utils";
import { runScenario, type ScenarioParams } from "@/lib/simulation";
import { parseBody } from "@/lib/api-validation";
import { WhatIfBodySchema } from "@/lib/api-schemas";

interface ParsedScenario extends ScenarioParams {
  horizonMinutes: number;
  label: string;
}

interface Narration {
  verdict: "safe" | "caution" | "unsafe";
  headline: string;
  analysis: string;
  mitigations: string[];
}

function summarizeResult(r: ReturnType<typeof runScenario>): string {
  const last = r.series[r.series.length - 1];
  return `${r.label}: peak sector ${r.peakSector.id} hit ${r.peakSector.utilization}% at minute ${r.peakSector.minute}; final max utilization ${last.maxUtilization}%; people inside at end ${last.totalInside.toLocaleString()}${r.clearedAtMinute ? `; stadium 90% cleared by minute ${r.clearedAtMinute}` : ""}.`;
}

export async function POST(request: Request) {
  const parsedBody = await parseBody(request, WhatIfBodySchema);
  if (!parsedBody.ok) return parsedBody.response;
  const body = parsedBody.data;

  // Step 1 — AI translates the natural-language scenario into sim parameters.
  const parsed = await generateJson<ParsedScenario>(scenarioParsePrompt(body.question));
  const params: ParsedScenario = parsed.ok
    ? parsed.data!
    : { closedGates: [], holdSectors: [], extraStewards: {}, weatherDelay: false, horizonMinutes: 45, label: "Scenario" };
  const horizon = Math.min(Math.max(params.horizonMinutes || 45, 15), 120);

  // Step 2 — deterministic digital twin runs both timelines.
  const baseline = runScenario(body.state, horizon, {}, "Baseline (no change)");
  const scenario = runScenario(body.state, horizon, params, params.label || "Scenario");

  // Step 3 — AI narrates the numeric comparison.
  const narration = await generateJson<Narration>(
    scenarioNarratePrompt(body.question, summarizeResult(baseline), summarizeResult(scenario))
  );

  return NextResponse.json({
    fallback: !parsed.ok || !narration.ok,
    params,
    baseline,
    scenario,
    narration: narration.ok
      ? narration.data
      : {
          verdict: scenario.peakSector.utilization > 92 ? "unsafe" : scenario.peakSector.utilization > 82 ? "caution" : "safe",
          headline: `Peak utilization ${scenario.peakSector.utilization}% in sector ${scenario.peakSector.id} vs ${baseline.peakSector.utilization}% baseline.`,
          analysis: "AI narration unavailable — showing raw digital-twin numbers. Compare the two curves for sector loading over the simulated horizon.",
          mitigations: [],
        },
  });
}
