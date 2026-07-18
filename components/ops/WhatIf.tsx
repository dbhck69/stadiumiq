"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { SimState } from "@/lib/simulation";

interface ScenarioResult {
  label: string;
  series: Array<{ minute: number; maxUtilization: number; totalInside: number }>;
  peakSector: { id: string; utilization: number; minute: number };
  clearedAtMinute: number | null;
}

interface WhatIfResponse {
  fallback: boolean;
  params: { label: string; closedGates?: string[]; holdSectors?: string[]; weatherDelay?: boolean };
  baseline: ScenarioResult;
  scenario: ScenarioResult;
  narration: { verdict: "safe" | "caution" | "unsafe"; headline: string; analysis: string; mitigations: string[] };
}

const EXAMPLES = [
  "What if we close Gate B at halftime?",
  "What if we hold upper-level sectors for 15 minutes at full time?",
  "What if heavy rain slows everything down during egress?",
  "What if we add 20 extra stewards to East Lower?",
];

const VERDICT_STYLE = {
  safe: "border-pitch/40 bg-pitch/10 text-pitch",
  caution: "border-gold/40 bg-gold/10 text-gold",
  unsafe: "border-danger/40 bg-danger/10 text-danger",
} as const;

function Sparkline({ result, color }: { result: ScenarioResult; color: string }) {
  const pts = result.series;
  if (!pts.length) return null;
  const w = 260;
  const h = 72;
  const min0 = pts[0].minute;
  const span = Math.max(pts[pts.length - 1].minute - min0, 1);
  const path = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${((p.minute - min0) / span) * w} ${h - (p.maxUtilization / 100) * h}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label={`${result.label} utilization curve`}>
      <line x1={0} y1={h - 0.9 * h} x2={w} y2={h - 0.9 * h} stroke="#ff4d5e44" strokeDasharray="4 3" />
      <text x={2} y={h - 0.9 * h - 3} fontSize={7} fill="#ff4d5e88">90% danger line</text>
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}

export default function WhatIf({ state }: { state: SimState }) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<WhatIfResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(q: string) {
    const text = q.trim();
    if (!text || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/whatif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, state }),
      });
      setResult(await res.json());
    } catch {
      // keep result null; the retry button remains
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-5">
        <div className="mb-1 text-xs font-semibold tracking-widest text-electric">WHAT-IF DIGITAL TWIN</div>
        <p className="mb-4 text-sm text-white/55">
          Ask a counterfactual — the simulation engine re-runs the matchday under your scenario and the AI compares both timelines before you commit.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(question);
          }}
          className="flex gap-2"
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder='e.g. "What if we close Gate B at halftime?"'
            aria-label="What-if scenario"
            className="min-w-0 flex-1 rounded-full border border-white/15 bg-night-2 px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-electric/60"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="btn-glow-violet shrink-0 rounded-full bg-electric px-6 py-3 text-sm font-bold transition hover:brightness-110 disabled:opacity-40 disabled:shadow-none"
          >
            {loading ? "Simulating…" : "🔮 Simulate"}
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setQuestion(ex);
                run(ex);
              }}
              className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-white/50 transition hover:border-electric/40 hover:text-white"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="glass rounded-2xl p-5">
          <div className="mb-3 text-xs text-white/50">Running both timelines through the digital twin…</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="shimmer h-28 rounded-xl bg-white/5" />
            <div className="shimmer h-28 rounded-xl bg-white/5" />
          </div>
        </div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className={`rounded-2xl border p-5 ${VERDICT_STYLE[result.narration.verdict]}`}>
            <div className="mb-1 text-[10px] font-bold tracking-widest">
              VERDICT: {result.narration.verdict.toUpperCase()}
              {result.fallback && <span className="ml-2 font-normal opacity-60">(AI narration offline — raw twin numbers)</span>}
            </div>
            <div className="font-[family-name:var(--font-display)] text-lg font-bold text-white">{result.narration.headline}</div>
            <p className="mt-2 text-sm leading-relaxed text-white/75">{result.narration.analysis}</p>
            {result.narration.mitigations.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-white/85">
                {result.narration.mitigations.map((m, i) => (
                  <li key={i}>🛠 {m}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { r: result.baseline, color: "#7487ad", tag: "BASELINE" },
              { r: result.scenario, color: "#6d5cff", tag: "SCENARIO" },
            ].map(({ r, color, tag }) => (
              <div key={tag} className="glass rounded-2xl p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-widest text-white/45">{tag}</span>
                  <span className="text-xs text-white/70">{r.label}</span>
                </div>
                <Sparkline result={r} color={color} />
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-white/5 px-2.5 py-1.5">
                    <div className="text-[9px] text-white/40">PEAK SECTOR</div>
                    <div className={`font-bold ${r.peakSector.utilization >= 90 ? "text-danger" : r.peakSector.utilization >= 80 ? "text-warn" : "text-pitch"}`}>
                      {r.peakSector.id} · {r.peakSector.utilization}%
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/5 px-2.5 py-1.5">
                    <div className="text-[9px] text-white/40">{r.clearedAtMinute ? "90% CLEARED BY" : "STILL INSIDE AT END"}</div>
                    <div className="font-bold text-white/85">
                      {r.clearedAtMinute ? `min ${r.clearedAtMinute}` : r.series[r.series.length - 1]?.totalInside.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
