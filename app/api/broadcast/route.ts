import { NextResponse } from "next/server";
import { broadcastPrompt } from "@/lib/gemini";
import { generateJson } from "@/lib/ai-utils";
import { getLanguage } from "@/lib/languages";
import { parseBody } from "@/lib/api-validation";
import { BroadcastBodySchema } from "@/lib/api-schemas";

interface BroadcastOutput {
  announcements: Array<{ code: string; language: string; text: string }>;
}

export async function POST(request: Request) {
  const parsed = await parseBody(request, BroadcastBodySchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const languages = body.languageCodes
    .map((code) => getLanguage(code))
    .filter((l): l is NonNullable<typeof l> => Boolean(l))
    .map((l) => ({ code: l.code, name: l.name }));

  const result = await generateJson<BroadcastOutput>(broadcastPrompt(body.situation, languages));

  if (!result.ok) {
    return NextResponse.json({
      fallback: true,
      announcements: [
        {
          code: "en-US",
          language: "English",
          text: "Attention please: stadium staff are attending to a situation. Please follow steward directions and use the nearest open concourse. Thank you for your cooperation.",
        },
      ],
    });
  }

  return NextResponse.json({ fallback: false, announcements: result.data!.announcements });
}
