import { NextResponse } from "next/server";
import { plannerPrompt } from "@/lib/gemini";
import { generateJson } from "@/lib/ai-utils";
import { GATES } from "@/lib/stadium-data";
import { parseBody } from "@/lib/api-validation";
import { PlannerBodySchema } from "@/lib/api-schemas";

interface PlanOutput {
  gate: string;
  steps: Array<{ time: string; title: string; detail: string }>;
  sustainabilityTip: string;
  accessibilityNote: string | null;
}

function gateForSection(section: string): string {
  const n = parseInt(section, 10);
  if (Number.isNaN(n)) return "A";
  const level = n >= 300 ? n - 200 : n >= 200 ? n - 100 : n;
  for (const g of GATES) {
    for (const range of g.serves) {
      const m = range.match(/^(\d+)-(\d+)$/);
      if (m && level >= parseInt(m[1], 10) && level <= parseInt(m[2], 10)) return g.id;
    }
  }
  return "A";
}

export async function POST(request: Request) {
  const parsed = await parseBody(request, PlannerBodySchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const result = await generateJson<PlanOutput>(
    plannerPrompt({ section: body.section, arrival: body.arrival, interests: body.interests ?? [], language: body.language })
  );

  if (!result.ok) {
    const gate = gateForSection(body.section);
    return NextResponse.json({
      fallback: true,
      plan: {
        gate,
        steps: [
          { time: body.arrival, title: "Arrive via rail", detail: "Stadium Rail Station is 5 min from Gate A — greenest way in." },
          { time: "+15 min", title: `Enter at Gate ${gate}`, detail: `Gate ${gate} serves section ${body.section}. Have your ticket QR ready.` },
          { time: "+30 min", title: "Eat before the rush", detail: "Queues triple in the last 30 min before kickoff — eat early or use Upper Deck Eats." },
          { time: "19:45", title: "Be in your seat", detail: "Opening ceremony starts 15 min before kickoff." },
          { time: "Full time +20", title: "Smart exit", detail: "Wait 20 min or use Gate B/D to skip the worst rail queues." },
        ],
        sustainabilityTip: "Take the rail home — lowest CO2 per fan, and the stadium is a certified zero-waste venue.",
        accessibilityNote: null,
      },
    });
  }

  return NextResponse.json({ fallback: false, plan: result.data });
}
