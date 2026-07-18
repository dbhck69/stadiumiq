"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StadiumMap from "@/components/StadiumMap";
import ChatPanel from "@/components/ChatPanel";
import Planner from "@/components/Planner";
import MatchTicker from "@/components/MatchTicker";
import { useSimulation } from "@/hooks/useSimulation";
import { VENUE } from "@/lib/stadium-data";
import { useTour } from "@/components/Tour";

type Tab = "assistant" | "planner";

const TABS: Array<{ id: Tab; label: string; hint: string }> = [
  { id: "assistant", label: "💬 AI Assistant", hint: "Ask anything, any language" },
  { id: "planner", label: "🗓️ Matchday Planner", hint: "Your AI-built timeline" },
];

export default function FanPage() {
  const sim = useSimulation(3000);
  const [tab, setTab] = useState<Tab>("assistant");
  const [highlight, setHighlight] = useState<string | null>(null);
  const [injected, setInjected] = useState<{ text: string; id: number } | null>(null);
  const { active: tourActive, currentStep: tourStep } = useTour();

  useEffect(() => {
    // Syncing local tab state to the tour's external step data, not deriving it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tourActive && tourStep?.tab && tourStep.tab !== tab) setTab(tourStep.tab as Tab);
  }, [tourActive, tourStep, tab]);

  function onMapSelect(id: string, kind: "gate" | "sector") {
    setHighlight(id);
    setInjected({
      text: kind === "gate" ? `Tell me about Gate ${id} — what does it serve and what's nearby?` : `What's in and around sector ${id}? Food, restrooms, exits?`,
      id: Date.now(),
    });
  }

  return (
    <>
      <MatchTicker minute={sim.state.minute} attendance={sim.state.totalInside} />
      <main className="pitch-lines relative mx-auto w-full max-w-7xl flex-1 overflow-hidden px-4 py-6 sm:px-6">
        <div className="orb orb-b right-[-12%] top-[5%] h-[340px] w-[340px] bg-pitch/15" aria-hidden />

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative mb-5">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold sm:text-3xl">
            Fan <span className="text-gradient">Companion</span>
          </h1>
          <p className="mt-1 text-sm text-white/55">
            {VENUE.name} · {VENUE.match.fixture}
          </p>
        </motion.div>

        {/* Segmented tabs with animated pill */}
        <div className="relative mb-5 inline-flex gap-1 rounded-full glass p-1" role="tablist" aria-label="Fan tools">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`relative rounded-full px-4 py-2 text-sm font-medium transition ${tab === t.id ? "text-night" : "text-white/65 hover:text-white"}`}
            >
              {tab === t.id && (
                <motion.span layoutId="fan-tab-pill" className="absolute inset-0 rounded-full bg-pitch" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
              )}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "assistant" ? (
            <motion.div
              key="assistant"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="relative grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]"
            >
              <ChatPanel onMapHighlight={setHighlight} injected={injected} />
              <div data-tour="fan-stadium-map" className="glass h-fit min-w-0 rounded-2xl p-4">
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-xs font-semibold tracking-widest text-white/70">STADIUM MAP</span>
                  <AnimatePresence>
                    {highlight && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="rounded-full bg-pitch/15 px-2.5 py-1 text-[10px] font-semibold text-pitch"
                      >
                        📍 Showing: {highlight}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <StadiumMap highlight={highlight} onSelect={onMapSelect} className="w-full" />
                <p className="mt-2 rounded-lg bg-white/4 px-3 py-2 text-center text-[11px] leading-relaxed text-white/50">
                  👆 <span className="font-semibold text-white/70">Tap any gate or sector</span> to ask the assistant about it — or ask for a place and it lights up here.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="planner"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="relative"
            >
              <Planner />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
