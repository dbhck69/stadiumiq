"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { WORLD_CUP_LANGUAGES } from "@/lib/languages";
import AiText from "@/components/AiText";

interface Plan {
  gate: string;
  steps: Array<{ time: string; title: string; detail: string }>;
  sustainabilityTip: string;
  accessibilityNote: string | null;
}

const INTERESTS = ["🍔 Food & drinks", "🛍️ Official merch", "♿ Accessible routes", "🙏 Prayer room", "📸 Photo spots", "🚆 Public transit", "🌱 Lowest-carbon options"];

export default function Planner() {
  const [section, setSection] = useState("");
  const [arrival, setArrival] = useState("18:00");
  const [interests, setInterests] = useState<string[]>([]);
  const [language, setLanguage] = useState("auto");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [fallback, setFallback] = useState(false);

  function toggleInterest(i: string) {
    setInterests((v) => (v.includes(i) ? v.filter((x) => x !== i) : [...v, i]));
  }

  const planMutation = useMutation({
    mutationFn: async () => {
      const langName = language === "auto" ? undefined : WORLD_CUP_LANGUAGES.find((l) => l.code === language)?.name;
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, arrival, interests: interests.map((i) => i.replace(/^\S+\s/, "")), language: langName }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setPlan(data.plan);
      setFallback(Boolean(data.fallback));
    },
    onError: () => setFallback(true),
  });
  const loading = planMutation.isPending;

  function generate() {
    if (!section.trim() || loading) return;
    setPlan(null);
    planMutation.mutate();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
      {/* Form */}
      <div className="glass h-fit rounded-2xl p-5">
        <h3 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold">🎫 Your matchday</h3>
        <label className="mb-1 block text-xs text-white/60" htmlFor="seat-section">Seat section (e.g. 214)</label>
        <input
          id="seat-section"
          value={section}
          onChange={(e) => setSection(e.target.value)}
          placeholder="Check your ticket — e.g. 108, 214, 327"
          className="mb-4 w-full rounded-lg border border-white/15 bg-night-2 px-3 py-2.5 text-sm outline-none placeholder:text-white/25 focus:border-pitch/50"
        />
        <label className="mb-1 block text-xs text-white/60" htmlFor="arrival-time">Planned arrival (kickoff 20:00, gates open 17:00)</label>
        <input
          id="arrival-time"
          type="time"
          value={arrival}
          onChange={(e) => setArrival(e.target.value)}
          className="mb-4 w-full rounded-lg border border-white/15 bg-night-2 px-3 py-2.5 text-sm outline-none focus:border-pitch/50"
        />
        <p className="mb-2 text-xs text-white/60">What matters to you?</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {INTERESTS.map((i) => (
            <button
              key={i}
              onClick={() => toggleInterest(i)}
              aria-pressed={interests.includes(i)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                interests.includes(i) ? "border-pitch/60 bg-pitch/15 text-pitch" : "border-white/12 text-white/60 hover:text-white"
              }`}
            >
              {i}
            </button>
          ))}
        </div>
        <label className="mb-1 block text-xs text-white/60" htmlFor="plan-lang">Plan language</label>
        <select
          id="plan-lang"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="mb-5 w-full rounded-lg border border-white/15 bg-night-2 px-3 py-2.5 text-xs text-white/80 outline-none focus:border-pitch/50"
        >
          <option value="auto">🌐 English (default)</option>
          {WORLD_CUP_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.native} ({l.name})</option>
          ))}
        </select>
        <button
          onClick={generate}
          disabled={!section.trim() || loading}
          className="btn-glow w-full rounded-full bg-pitch py-3 text-sm font-bold text-night transition hover:brightness-110 disabled:opacity-40 disabled:shadow-none"
        >
          {loading ? "Building your plan…" : "✨ Generate my matchday plan"}
        </button>
      </div>

      {/* Timeline */}
      <div className="glass min-h-[400px] rounded-2xl p-5">
        {!plan && !loading && (
          <div className="flex h-full flex-col items-center justify-center text-center text-white/35">
            <div className="mb-3 text-4xl">🗓️</div>
            <p className="max-w-xs text-sm">Enter your seat section and the AI will plan your entire matchday — gate, queues, food windows, and the greenest way home.</p>
          </div>
        )}
        {loading && (
          <div className="space-y-3 pt-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="shimmer h-14 rounded-xl bg-white/5" />
            ))}
          </div>
        )}
        <AnimatePresence>
          {plan && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
                  Your plan — enter at <span className="text-pitch">Gate {plan.gate}</span>
                </h3>
                {fallback && <span className="text-[10px] text-white/40">⚠ offline plan</span>}
              </div>
              <ol className="relative ml-3 space-y-4 border-l border-white/10 pl-6">
                {plan.steps.map((s, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="relative"
                  >
                    <span className="absolute -left-[31px] flex h-2.5 w-2.5 items-center justify-center rounded-full bg-pitch ring-4 ring-pitch/15" />
                    <div className="text-xs font-semibold text-pitch">{s.time}</div>
                    <div className="text-sm font-semibold">{s.title}</div>
                    <div className="text-xs leading-relaxed text-white/55"><AiText text={s.detail} /></div>
                  </motion.li>
                ))}
              </ol>
              <div className="mt-5 rounded-xl border border-pitch/25 bg-pitch/8 p-3.5 text-xs leading-relaxed text-white/75">
                🌱 <span className="font-semibold text-pitch">Sustainability:</span> <AiText text={plan.sustainabilityTip} />
              </div>
              {plan.accessibilityNote && (
                <div className="mt-2 rounded-xl border border-cyanx/25 bg-cyanx/8 p-3.5 text-xs leading-relaxed text-white/75">
                  ♿ <span className="font-semibold text-cyanx">Accessibility:</span> <AiText text={plan.accessibilityNote} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
