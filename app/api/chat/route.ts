import { NextResponse } from "next/server";
import { fanSystemPrompt } from "@/lib/gemini";
import { generateText } from "@/lib/ai-utils";
import { AMENITIES, GATES } from "@/lib/stadium-data";
import { parseBody } from "@/lib/api-validation";
import { ChatBodySchema } from "@/lib/api-schemas";

/** Keyword fallback when the AI is unreachable — the demo never dead-ends. */
function fallbackAnswer(message: string): { reply: string; map?: string } {
  const q = message.toLowerCase();
  if (/(first aid|medic|doctor|hurt|injur)/.test(q))
    return { reply: "First aid: Level 1 behind sections 104 (North), 112 (East — main medical center), and 120 (South). Staff at any Guest Services point can escort you.", map: "E1" };
  if (/(pray|prayer|mosque|salah)/.test(q))
    return { reply: "Multi-faith prayer rooms: Level 2 behind section 204 (North) and section 220 (South), open from gates-open to 1 hour post-match. Ablution facilities available.", map: "N2" };
  if (/(food|eat|hungry|halal|vegetarian)/.test(q))
    return { reply: "Food courts: World Kitchen Court (North, halal/veg/vegan), Taquería 26 (East), Brooklyn Grill (South, kosher stand adjacent), Upper Deck Eats (Level 3, shortest queues).", map: "N1" };
  if (/(gate|entrance|enter)/.test(q)) {
    const gates = GATES.map((g) => `${g.name}: sections ${g.serves.join(", ")}`).join(" · ");
    return { reply: `Gates and the sections they serve — ${gates}. Check your ticket's section number.`, map: "A" };
  }
  if (/(wheelchair|accessib|disab)/.test(q))
    return { reply: "Step-free access at Gates A, C and D, with elevators at every corner core. Free wheelchair loan at Guest Services behind section 104 (bring ID).", map: "A" };
  if (/(train|rail|metro|bus|taxi|uber|parking|home)/.test(q))
    return { reply: "Rail: Stadium Station, 5 min from Gate A (greenest option). Bus: Terminal East near Gate B. Rideshare: Zone W near Gate D. Post-match rail queues peak ~20 min after full time.", map: "A" };
  const amenity = AMENITIES.find((a) => q.includes(a.type));
  if (amenity) return { reply: `${amenity.name} — ${amenity.location}. ${amenity.notes ?? ""}` };
  return { reply: "I'm having trouble reaching the AI right now. Please try again in a moment, or visit Guest Services behind sections 104, 112, 120 or 128 for immediate help." };
}

export async function POST(request: Request) {
  const parsed = await parseBody(request, ChatBodySchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const historyText = (body.history ?? [])
    .slice(-6)
    .map((m) => `${m.role === "user" ? "FAN" : "STADIUMIQ"}: ${m.text}`)
    .join("\n");

  const prompt = `${fanSystemPrompt(body.language, body.simpleLanguage)}

CONVERSATION SO FAR:
${historyText || "(new conversation)"}

FAN: ${body.message}
STADIUMIQ:`;

  const result = await generateText(prompt);

  if (!result.ok) {
    const fb = fallbackAnswer(body.message);
    return NextResponse.json({ reply: fb.reply, map: fb.map ?? null, fallback: true });
  }

  // Extract optional [MAP:x] directive for the SVG map highlight.
  let reply = result.data!;
  let map: string | null = null;
  const mapMatch = reply.match(/\[MAP:([A-Za-z0-9]+)\]/);
  if (mapMatch) {
    map = mapMatch[1].toUpperCase();
    reply = reply.replace(mapMatch[0], "").trim();
  }

  return NextResponse.json({ reply, map, fallback: false });
}
