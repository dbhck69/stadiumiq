"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Nav from "@/components/Nav";
import StadiumMap from "@/components/StadiumMap";
import ChatPanel from "@/components/ChatPanel";
import Planner from "@/components/Planner";
import { VENUE } from "@/lib/stadium-data";

type Tab = "assistant" | "planner";

export default function FanPage() {
  const [tab, setTab] = useState<Tab>("assistant");
  const [highlight, setHighlight] = useState<string | null>(null);

  return (
    <>
      <Nav />
      <main className="pitch-lines mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold sm:text-3xl">
            Fan <span className="text-gradient">Companion</span>
          </h1>
          <p className="mt-1 text-sm text-white/55">
            {VENUE.name} · {VENUE.match.fixture} · Kickoff {VENUE.match.kickoff}
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="mb-5 flex gap-2" role="tablist" aria-label="Fan tools">
          {(
            [
              { id: "assistant", label: "💬 AI Assistant" },
              { id: "planner", label: "🗓️ Matchday Planner" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                tab === t.id ? "bg-pitch text-night" : "glass text-white/65 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "assistant" ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
            <ChatPanel onMapHighlight={setHighlight} />
            <div className="glass h-fit rounded-2xl p-4">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-white/70">STADIUM MAP</span>
                {highlight && (
                  <span className="rounded-full bg-pitch/15 px-2.5 py-1 text-[10px] font-semibold text-pitch">
                    📍 Showing: {highlight}
                  </span>
                )}
              </div>
              <StadiumMap highlight={highlight} className="w-full" />
              <p className="mt-2 px-1 text-[11px] leading-relaxed text-white/40">
                Ask for any location — a gate, food court, first aid, prayer room — and it lights up here.
              </p>
            </div>
          </div>
        ) : (
          <Planner />
        )}
      </main>
    </>
  );
}
