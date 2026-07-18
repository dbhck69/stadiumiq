"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Nav from "@/components/Nav";
import StadiumMap from "@/components/StadiumMap";
import StatTiles from "@/components/ops/StatTiles";
import IncidentFeed from "@/components/ops/IncidentFeed";
import PipelinePanel from "@/components/ops/PipelinePanel";
import OpsChat from "@/components/ops/OpsChat";
import WhatIf from "@/components/ops/WhatIf";
import Broadcast from "@/components/ops/Broadcast";
import { useSimulation } from "@/hooks/useSimulation";
import { stateSummary, type Incident } from "@/lib/simulation";

type Tab = "live" | "whatif" | "broadcast";

export default function OpsPage() {
  const sim = useSimulation(3000);
  const [tab, setTab] = useState<Tab>("live");
  const [selected, setSelected] = useState<Incident | null>(null);
  const [broadcastPrefill, setBroadcastPrefill] = useState<string | undefined>();

  const liveState = stateSummary(sim.state);

  function openBroadcast(situation: string) {
    setBroadcastPrefill(situation);
    setTab("broadcast");
  }

  return (
    <>
      <Nav />
      <main className="pitch-lines mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {/* Header + sim controls */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold sm:text-3xl">
              Ops <span className="text-gradient">Command Center</span>
            </h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-white/55">
              <span className="relative flex h-2 w-2">
                <span className="pulse-ring absolute h-2 w-2 rounded-full bg-pitch" />
                <span className="h-2 w-2 rounded-full bg-pitch" />
              </span>
              {sim.clock} · simulated sensor feed
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <button onClick={() => sim.setRunning(!sim.running)} className="glass rounded-full px-3.5 py-2 text-white/70 transition hover:text-white">
              {sim.running ? "⏸ Pause feed" : "▶ Resume feed"}
            </button>
            <button onClick={() => sim.jumpTo(225)} className="glass rounded-full px-3.5 py-2 text-white/70 transition hover:text-white" title="Jump the simulation to halftime">
              ⏭ Halftime
            </button>
            <button onClick={() => sim.jumpTo(286)} className="glass rounded-full px-3.5 py-2 text-white/70 transition hover:text-white" title="Jump the simulation to egress">
              ⏭ Full time
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Operations tools">
          {(
            [
              { id: "live", label: "📡 Live Operations" },
              { id: "whatif", label: "🔮 What-If Digital Twin" },
              { id: "broadcast", label: "📢 Emergency Broadcast" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                tab === t.id ? "bg-electric text-white" : "glass text-white/65 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "live" && (
          <div className="space-y-4">
            <StatTiles state={sim.state} />
            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              {/* Heatmap + gates */}
              <div className="space-y-4">
                <div className="glass rounded-2xl p-4">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <span className="text-xs font-semibold tracking-widest text-white/70">SECTOR HEATMAP</span>
                    <span className="flex gap-3 text-[10px] text-white/50">
                      <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-pitch" />&lt;60%</span>
                      <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-gold" />60-80</span>
                      <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#ff8a3d]" />80-90</span>
                      <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-danger" />&gt;90</span>
                    </span>
                  </div>
                  <StadiumMap occupancy={sim.occupancy} className="w-full" />
                </div>
                <div className="glass rounded-2xl p-4">
                  <div className="mb-2 text-xs font-semibold tracking-widest text-white/70">GATES</div>
                  <div className="grid grid-cols-5 gap-2">
                    {sim.state.gates.map((g) => (
                      <div key={g.id} className="rounded-xl bg-white/4 p-2.5 text-center">
                        <div className={`text-sm font-bold ${g.open ? "text-pitch" : "text-danger"}`}>{g.id}</div>
                        <div className="text-[9px] text-white/40">{g.open ? "OPEN" : "CLOSED"}</div>
                        <div className="mt-1 text-[10px] tabular-nums text-white/70">{g.throughput}/min</div>
                        <div className="text-[9px] tabular-nums text-white/40">q: {g.queue}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <OpsChat liveState={liveState} />
              </div>

              {/* Incidents + pipeline */}
              <div className="space-y-4">
                <IncidentFeed
                  incidents={sim.state.incidents}
                  selectedId={selected?.id ?? null}
                  onSelect={(inc) => setSelected(inc)}
                />
                {selected && (
                  <PipelinePanel
                    key={selected.id}
                    incident={selected}
                    liveState={liveState}
                    onBroadcast={openBroadcast}
                    onClose={() => setSelected(null)}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "whatif" && <WhatIf state={sim.state} />}
        {tab === "broadcast" && <Broadcast prefill={broadcastPrefill} />}
      </main>
    </>
  );
}
