import { NextResponse } from "next/server";
import { triageAgentPrompt, resourceAgentPrompt, commsAgentPrompt, opsQaPrompt } from "@/lib/gemini";
import { generateJson, generateText } from "@/lib/ai-utils";

interface OpsBody {
  action: "pipeline" | "qa";
  incident?: string; // for pipeline
  question?: string; // for qa
  liveState: string; // stateSummary() from the client simulation
}

export interface TriageOutput {
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  summary: string;
  riskFactors: string[];
  escalate: boolean;
}

export interface ResourceOutput {
  allocations: Array<{ unitId: string; count: number; task: string; etaMinutes: number }>;
  gateActions: string[];
  rationale: string;
}

export interface CommsOutput {
  staffRadioMessage: string;
  publicAnnouncement: string | null;
  signageUpdate: string | null;
  tone: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as OpsBody;

  if (body.action === "qa") {
    if (!body.question?.trim()) return NextResponse.json({ error: "question is required" }, { status: 400 });
    const result = await generateText(opsQaPrompt(body.question, body.liveState));
    if (!result.ok) {
      return NextResponse.json({
        answer: "AI copilot unreachable — falling back to raw telemetry. Check the sector heatmap and gate table for current utilization; sectors above 85% need steward attention.",
        fallback: true,
      });
    }
    return NextResponse.json({ answer: result.data, fallback: false });
  }

  if (body.action === "pipeline") {
    if (!body.incident?.trim()) return NextResponse.json({ error: "incident is required" }, { status: 400 });

    // Agent 1 — Triage
    const triage = await generateJson<TriageOutput>(triageAgentPrompt(body.incident, body.liveState));
    if (!triage.ok) {
      return NextResponse.json({
        fallback: true,
        triage: {
          severity: "medium",
          category: "unclassified",
          summary: body.incident,
          riskFactors: ["AI triage unreachable — manual assessment required"],
          escalate: false,
        },
        resource: {
          allocations: [{ unitId: "ST-R", count: 4, task: "Investigate and report (standard protocol)", etaMinutes: 4 }],
          gateActions: [],
          rationale: "Default rapid-response protocol applied while AI is unavailable.",
        },
        comms: {
          staffRadioMessage: "Rapid response team: investigate reported incident and report status.",
          publicAnnouncement: null,
          signageUpdate: null,
          tone: "neutral",
        },
      });
    }

    // Agent 2 — Resource allocation (sees triage output)
    const triageJson = JSON.stringify(triage.data);
    const resource = await generateJson<ResourceOutput>(resourceAgentPrompt(body.incident, triageJson, body.liveState));

    // Agent 3 — Comms (sees both)
    const resourceJson = JSON.stringify(resource.ok ? resource.data : {});
    const comms = await generateJson<CommsOutput>(commsAgentPrompt(body.incident, triageJson, resourceJson));

    return NextResponse.json({
      fallback: false,
      triage: triage.data,
      resource: resource.ok
        ? resource.data
        : { allocations: [], gateActions: [], rationale: "Resource agent unavailable — allocate manually." },
      comms: comms.ok
        ? comms.data
        : { staffRadioMessage: "Manual comms required.", publicAnnouncement: null, signageUpdate: null, tone: "neutral" },
    });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
