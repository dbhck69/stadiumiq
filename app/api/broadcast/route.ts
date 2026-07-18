import { NextResponse } from "next/server";
import { broadcastPrompt } from "@/lib/gemini";
import { generateJson } from "@/lib/ai-utils";
import { getLanguage } from "@/lib/languages";

interface BroadcastBody {
  situation: string;
  languageCodes: string[];
}

interface BroadcastOutput {
  announcements: Array<{ code: string; language: string; text: string }>;
}

export async function POST(request: Request) {
  const body = (await request.json()) as BroadcastBody;
  if (!body.situation?.trim() || !body.languageCodes?.length) {
    return NextResponse.json({ error: "situation and languageCodes are required" }, { status: 400 });
  }

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
