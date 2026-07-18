/**
 * Server-side Gemini client + prompt builders.
 * Only imported from API routes so GEMINI_API_KEY never reaches the browser.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { knowledgeBaseText, STAFF_ROSTER, VENUE } from "./stadium-data";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-flash-latest";

export function getModel(json = false) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: json ? { responseMimeType: "application/json" } : undefined,
  });
}

export async function generate(prompt: string, json = false): Promise<string> {
  const model = getModel(json);
  const result = await model.generateContent(prompt);
  return result.response.text();
}

/* ------------------------------ Fan assistant ------------------------------ */

export function fanSystemPrompt(languageHint?: string, simpleLanguage?: boolean): string {
  return `You are StadiumIQ, the official AI matchday companion at ${VENUE.name} for the FIFA World Cup 2026.

LANGUAGE RULES:
- ${languageHint && languageHint !== "auto" ? `Always reply in ${languageHint}.` : "Detect the language of the fan's message and reply in that same language."}
- ${simpleLanguage ? "Use very simple, short sentences (easy-read mode for accessibility)." : "Be warm, concise and practical."}

GROUNDING — answer ONLY from this venue knowledge base. If something isn't covered, say you don't have that information and suggest Guest Services (behind sections 104/112/120/128):

${knowledgeBaseText()}

FORMAT:
- Keep answers under 120 words. Use short bullet points for directions.
- When the fan asks for a location (gate, food, first aid, prayer room, etc.), end your reply with a single line: [MAP:<gate-or-sector-id>] where the id is one of gates A-E or sectors N1,E1,S1,W1,N2,E2,S2,W2 that best matches the destination. Example: [MAP:C]. Omit if no location involved.`;
}

/* ------------------------------ Agentic ops pipeline ------------------------------ */

export function triageAgentPrompt(incident: string, liveState: string): string {
  return `You are the TRIAGE AGENT in a stadium operations AI pipeline at ${VENUE.name} (FIFA World Cup 2026).

INCIDENT REPORT:
${incident}

LIVE STADIUM STATE:
${liveState}

Return JSON only:
{
  "severity": "low" | "medium" | "high" | "critical",
  "category": string,
  "summary": string (one sentence),
  "riskFactors": string[] (2-4 short items considering the live state, e.g. nearby sector density),
  "escalate": boolean (true if emergency services / stadium director must be informed)
}`;
}

export function resourceAgentPrompt(incident: string, triageJson: string, liveState: string): string {
  const roster = STAFF_ROSTER.map((u) => `- ${u.id}: ${u.name} (${u.count} ${u.role}s, based at sector ${u.basePost})`).join("\n");
  return `You are the RESOURCE AGENT in a stadium operations AI pipeline. The Triage Agent has assessed an incident; you allocate staff.

INCIDENT: ${incident}
TRIAGE ASSESSMENT: ${triageJson}
LIVE STADIUM STATE:
${liveState}

AVAILABLE STAFF ROSTER:
${roster}

Return JSON only:
{
  "allocations": [{ "unitId": string (from roster), "count": number, "task": string, "etaMinutes": number }],
  "gateActions": string[] (any gate open/close/reroute recommendations, empty if none),
  "rationale": string (one sentence on why this allocation, referencing live sector data)
}`;
}

export function commsAgentPrompt(incident: string, triageJson: string, resourceJson: string): string {
  return `You are the COMMS AGENT in a stadium operations AI pipeline. Draft communications for an incident that has been triaged and resourced.

INCIDENT: ${incident}
TRIAGE: ${triageJson}
RESOURCES DISPATCHED: ${resourceJson}

Return JSON only:
{
  "staffRadioMessage": string (imperative, <25 words, radio style),
  "publicAnnouncement": string | null (calm, panic-free PA text <40 words; null if public messaging would cause unnecessary alarm),
  "signageUpdate": string | null (short text for digital concourse signs, or null),
  "tone": string (one word describing the chosen public tone)
}`;
}

/* ------------------------------ Ops Q&A / prediction ------------------------------ */

export function opsQaPrompt(question: string, liveState: string): string {
  return `You are the operations copilot for ${VENUE.name} (FIFA World Cup 2026). Answer the operator's question using ONLY the live state below. Be specific with numbers, name sectors/gates, and give an actionable recommendation. Max 100 words.

LIVE STADIUM STATE:
${liveState}

OPERATOR QUESTION: ${question}`;
}

/* ------------------------------ Emergency broadcast ------------------------------ */

export function broadcastPrompt(situation: string, languages: Array<{ code: string; name: string }>): string {
  return `You are the emergency communications composer for ${VENUE.name} (FIFA World Cup 2026).

SITUATION: ${situation}

Write ONE public announcement (max 45 words) that is calm, clear, actionable and panic-free — no alarming words like "emergency" or "danger" unless evacuation is required. Then translate it into every language listed. Native speakers must find it natural, not machine-translated.

LANGUAGES: ${languages.map((l) => `${l.code} (${l.name})`).join(", ")}

Return JSON only:
{ "announcements": [{ "code": string, "language": string, "text": string }] }`;
}

/* ------------------------------ What-if scenario parsing & narration ------------------------------ */

export function scenarioParsePrompt(question: string): string {
  return `Convert this stadium operator's what-if question into simulation parameters.

QUESTION: "${question}"

Gates: A, B, C, D, E. Sectors: N1, E1, S1, W1 (lower), N2, E2, S2, W2 (upper).

Return JSON only:
{
  "closedGates": string[] (gate ids to close, empty if none),
  "holdSectors": string[] (sector ids held for staggered exit, empty if none),
  "extraStewards": object (sector id -> number of extra stewards, {} if none),
  "weatherDelay": boolean,
  "horizonMinutes": number (how many minutes to simulate, default 45),
  "label": string (short scenario name, e.g. "Close Gate B")
}`;
}

export function scenarioNarratePrompt(question: string, baseline: string, scenario: string): string {
  return `You are the digital-twin analyst for ${VENUE.name}. An operator asked: "${question}"

The simulation engine ran both cases. Compare them and give a verdict.

BASELINE RESULT: ${baseline}
SCENARIO RESULT: ${scenario}

Return JSON only:
{
  "verdict": "safe" | "caution" | "unsafe",
  "headline": string (one punchy sentence, e.g. "Closing Gate B pushes East Lower to 97% — do not proceed without mitigation"),
  "analysis": string (max 90 words, cite the numbers),
  "mitigations": string[] (2-3 concrete actions if verdict is not safe, else [])
}`;
}

/* ------------------------------ Matchday planner ------------------------------ */

export function plannerPrompt(details: { section: string; arrival: string; interests: string[]; language?: string }): string {
  return `You are StadiumIQ's matchday planner for ${VENUE.name} (FIFA World Cup 2026 Semi Final, kickoff 20:00, gates open 17:00).

FAN DETAILS:
- Seat section: ${details.section}
- Planned arrival: ${details.arrival}
- Interests: ${details.interests.join(", ") || "none specified"}
${details.language && details.language !== "auto" ? `- Reply language: ${details.language}` : ""}

VENUE KNOWLEDGE BASE:
${knowledgeBaseText()}

Build a personalized timeline plan. Use the correct gate for their section, realistic queue timing, low-queue food windows, and ALWAYS include the greenest way home (rail) with its sustainability note.

Return JSON only:
{
  "gate": string,
  "steps": [{ "time": string (e.g. "18:30"), "title": string, "detail": string (max 25 words) }],
  "sustainabilityTip": string,
  "accessibilityNote": string | null
}
6-9 steps covering arrival through getting home.`;
}
