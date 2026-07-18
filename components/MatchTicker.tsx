"use client";

/**
 * Live scoreboard strip shared by every page — deterministic goal events
 * driven by the simulation clock so fan and ops views always agree.
 */

import { useEffect, useRef, useState } from "react";
import { clockLabel } from "@/lib/simulation";

const KICKOFF = 180;
// [sim minute, scorer] — deterministic match script
const GOALS: Array<[number, "BRA" | "FRA"]> = [
  [KICKOFF + 23, "BRA"],
  [KICKOFF + 41, "FRA"],
  [KICKOFF + 78, "BRA"],
];

export default function MatchTicker({ minute, attendance }: { minute: number; attendance?: number }) {
  const bra = GOALS.filter(([m, t]) => m <= minute && t === "BRA").length;
  const fra = GOALS.filter(([m, t]) => m <= minute && t === "FRA").length;
  const score = bra + fra;
  const prevScore = useRef(score);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (score > prevScore.current) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 3800);
      prevScore.current = score;
      return () => clearTimeout(t);
    }
    prevScore.current = score;
  }, [score]);

  return (
    <div className={`glass-strong border-x-0 border-t-0 ${flash ? "goal-flash" : ""}`} role="status" aria-label="Match score">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-1 px-3 py-2 text-xs sm:justify-between sm:px-6">
        <span className="hidden items-center gap-2 text-white/50 sm:flex">
          <span className="relative flex h-2 w-2">
            <span className="pulse-ring absolute h-2 w-2 rounded-full bg-danger" />
            <span className="h-2 w-2 rounded-full bg-danger" />
          </span>
          LIVE · SEMI FINAL
        </span>

        <span className="flex items-center gap-2.5 font-[family-name:var(--font-display)]">
          <span className="font-bold">🇧🇷 BRA</span>
          <span className="rounded-lg bg-white/10 px-2.5 py-0.5 text-sm font-bold tabular-nums tracking-wider">
            {bra} – {fra}
          </span>
          <span className="font-bold">FRA 🇫🇷</span>
          {flash && <span className="ml-1 animate-bounce font-bold text-pitch">⚽ GOAL!</span>}
        </span>

        <span className="flex items-center gap-4 text-white/50">
          <span className="tabular-nums">{clockLabel(minute)}</span>
          {attendance !== undefined && (
            <span className="hidden tabular-nums md:inline">👥 {attendance.toLocaleString()}</span>
          )}
        </span>
      </div>
    </div>
  );
}
