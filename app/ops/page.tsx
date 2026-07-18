"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StadiumMap from "@/components/StadiumMap";
import MatchTicker from "@/components/MatchTicker";
import StatTiles from "@/components/ops/StatTiles";
import IncidentFeed from "@/components/ops/IncidentFeed";
import PipelinePanel from "@/components/ops/PipelinePanel";
import OpsChat from "@/components/ops/OpsChat";
import WhatIf from "@/components/ops/WhatIf";
import Broadcast from "@/components/ops/Broadcast";
import { useSimulation } from "@/hooks/useSimulation";
import { stateSummary, type Incident } from "@/lib/simulation";
import { SECTORS, GATES } from "@/lib/stadium-data";

type Tab = "live" | "whatif" | "broadcast";

const TABS: Array<{ id: Tab; label: string; desc: string }> = [
  { id: "live", label: "📡 Live Operations", desc: "Heatmap, incidents & AI copilot" },
  { id: "whatif", label: "🔮 What-If Twin", desc: "Test decisions before you commit" },
  { id: "broadcast", label: "📢 Broadcast", desc: "One click, 24 languages" },
];

export default function OpsPage() {
  const sim = useSimulation(3000);
  const [tab, setTab] = useState<Tab>("live");
  const [selected, setSelected] = useState<Incident | null>(null);
  const [broadcastPrefill, setBroadcastPrefill] = useState<string | undefined>();
  const [inspect, setInspect] = useState<{ id: string; kind: "gate" | "sector" } | null>(null);

  const liveState = stateSummary(sim.state);

  function openBroadcast(situation: string) {
    setBroadcastPrefill(situation);
    setTab("broadcast");
  }

  const inspectData = (() => {
    if (!inspect) return null;
    if (inspect.kind === "sector") {
      const s = sim.state.sectors.find((x) => x.id === inspect.id);
      const meta = SECTORS.find((x) => x.id === inspect.id);
      if (!s || !meta) return null;
      const pct = Math.round((s.occupancy / s.capacity) * 100);
      return {
        title: `Sector ${s.id} — ${meta.label}`,
        rows: [
          ["Occupancy", `${s.occupancy.toLocaleString()} / ${s.capacity.toLocaleString()} (${pct}%)`],
          ["Trend", s.trend >= 0 ? `▲ +${s.trend}/min` : `▼ ${s.trend}/min`],
          ["Served by", meta.gates.map((g) => `Gate ${g}`).join(", ")],
        ] as Array<[string, string]>,
        status: pct >= 90 ? "🔴 Critical" : pct >= 80 ? "🟠 Watch" : "🟢 Nominal",
      };
    }
    const g = sim.state.gates.find((x) => x.id === inspect.id);
    const meta = GATES.find((x) => x.id === inspect.id);
    if (!g || !meta) return null;
    return {
      title: `${meta.name} (${meta.side})`,
      rows: [
        ["Status", g.open ? "OPEN" : "CLOSED"],
        ["Throughput", `${g.throughput}/min`],
        ["Queue", `${g.queue.toLocaleString()} waiting`],
        ["Serves", meta.serves.join(", ")],
      ] as Array<[string, string]>,
      status: g.open ? "🟢 Flowing" : "🔴 Closed",
    };
  })();

  return (
    <>
      <MatchTicker minute={sim.state.minute} attendance={sim.state.totalInside} />
      <main className="pitch-lines relative mx-auto w-full max-w-7xl flex-1 overflow-hidden px-4 py-6 sm:px-6">
        <div className="orb orb-a left-[-12%] top-[10%] h-[360px] w-[360px] bg-electric/20" aria-hidden />

        {/* Header + sim controls */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative mb-4 flex flex-wrap items-end justify-between gap-3">
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
            <button onClick={() => sim.setRunning(!sim.running)} className="btn-press glass rounded-full px-3.5 py-2 text-white/70 transition hover:text-white">
              {sim.running ? "⏸ Pause" : "▶ Resume"}
            </button>
            <button onClick={() => sim.jumpTo(225)} className="btn-press glass rounded-full px-3.5 py-2 text-white/70 transition hover:text-white" title="Jump the simulation to halftime">
              ⏭ Halftime
            </button>
            <button onClick={() => sim.jumpTo(286)} className="btn-press glass rounded-full px-3.5 py-2 text-white/70 transition hover:text-white" title="Jump the simulation to egress — watch the stadium drain">
              ⏭ Full time
            </button>
          </div>
        </motion.div>

        {/* Guide strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative mb-5 flex flex-wrap items-center gap-x-6 gap-y-1.5 rounded-2xl border border-electric/20 bg-electric/8 px-4 py-2.5 text-[11px] text-white/60 sm:text-xs"
        >
          <span className="font-bold text-electric">GET STARTED</span>
          <span><span className="font-bold text-white/85">1.</span> Watch the heatmap — red sectors pulse</span>
          <span><span className="font-bold text-white/85">2.</span> Click an incident → run the 3-agent AI response</span>
          <span><span className="font-bold text-white/85">3.</span> Test decisions in the What-If Twin before committing</span>
        </motion.div>

        {/* Segmented tabs */}
        <div className="relative mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Operations tools">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`relative rounded-2xl px-4 py-2.5 text-left transition ${tab === t.id ? "text-white" : "glass text-white/60 hover:text-white"}`}
            >
              {tab === t.id && (
                <motion.span
                  layoutId="ops-tab-pill"
                  className="absolute inset-0 rounded-2xl bg-electric shadow-[0_0_24px_rgba(109,92,255,0.4)]"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative block text-sm font-semibold">{t.label}</span>
              <span className={`relative block text-[10px] ${tab === t.id ? "text-white/75" : "text-white/40"}`}>{t.desc}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="relative"
          >
            {tab === "live" && (
              <div className="space-y-4">
                <StatTiles state={sim.state} />
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
                  {/* Heatmap + gates */}
                  <div className="min-w-0 space-y-4">
                    <div className="glass rounded-2xl p-4">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
                        <span className="text-xs font-semibold tracking-widest text-white/70">SECTOR HEATMAP</span>
                        <span className="flex gap-3 text-[10px] text-white/50">
                          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-pitch" />&lt;60%</span>
                          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-gold" />60-80</span>
                          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#ff8a3d]" />80-90</span>
                          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-danger" />&gt;90</span>
                        </span>
                      </div>
                      <StadiumMap occupancy={sim.occupancy} onSelect={(id, kind) => setInspect({ id, kind })} className="w-full" />
                      <AnimatePresence mode="wait">
                        {inspectData ? (
                          <motion.div
                            key={inspect!.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-2 rounded-xl border border-white/12 bg-white/4 p-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white/85">{inspectData.title}</span>
                              <span className="flex items-center gap-2">
                                <span className="text-[10px]">{inspectData.status}</span>
                                <button onClick={() => setInspect(null)} aria-label="Close details" className="text-xs text-white/40 hover:text-white">✕</button>
                              </span>
                            </div>
                            <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
                              {inspectData.rows.map(([k, v]) => (
                                <div key={k}>
                                  <div className="text-[9px] font-semibold tracking-wider text-white/35">{k.toUpperCase()}</div>
                                  <div className="text-[11px] font-medium text-white/80">{v}</div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        ) : (
                          <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-center text-[11px] text-white/40">
                            👆 Tap any sector or gate for live details
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="glass rounded-2xl p-4">
                      <div className="mb-2 text-xs font-semibold tracking-widest text-white/70">GATES</div>
                      <div className="grid grid-cols-5 gap-2">
                        {sim.state.gates.map((g) => (
                          <button
                            key={g.id}
                            onClick={() => setInspect({ id: g.id, kind: "gate" })}
                            className={`btn-press rounded-xl p-2.5 text-center transition hover:bg-white/8 ${inspect?.id === g.id && inspect.kind === "gate" ? "bg-white/10 ring-1 ring-white/25" : "bg-white/4"}`}
                          >
                            <div className={`text-sm font-bold ${g.open ? "text-pitch" : "text-danger"}`}>{g.id}</div>
                            <div className="text-[9px] text-white/40">{g.open ? "OPEN" : "CLOSED"}</div>
                            <div className="mt-1 text-[10px] tabular-nums text-white/70">{g.throughput}/min</div>
                            <div className="text-[9px] tabular-nums text-white/40">q: {g.queue}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <OpsChat liveState={liveState} />
                  </div>

                  {/* Incidents + pipeline */}
                  <div className="min-w-0 space-y-4">
                    <IncidentFeed
                      incidents={sim.state.incidents}
                      selectedId={selected?.id ?? null}
                      onSelect={(inc) => setSelected(inc)}
                    />
                    <AnimatePresence>
                      {selected && (
                        <PipelinePanel
                          key={selected.id}
                          incident={selected}
                          liveState={liveState}
                          onBroadcast={openBroadcast}
                          onClose={() => setSelected(null)}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}

            {tab === "whatif" && <WhatIf state={sim.state} />}
            {tab === "broadcast" && <Broadcast prefill={broadcastPrefill} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
}
