"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Incident } from "@/lib/simulation";
import AiText from "@/components/AiText";

interface Triage {
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  summary: string;
  riskFactors: string[];
  escalate: boolean;
}
interface Resource {
  allocations: Array<{ unitId: string; count: number; task: string; etaMinutes: number }>;
  gateActions: string[];
  rationale: string;
}
interface Comms {
  staffRadioMessage: string;
  publicAnnouncement: string | null;
  signageUpdate: string | null;
  tone: string;
}

const SEVERITY_STYLE: Record<Triage["severity"], string> = {
  low: "bg-pitch/15 text-pitch border-pitch/40",
  medium: "bg-gold/15 text-gold border-gold/40",
  high: "bg-[#ff8a3d]/15 text-[#ff8a3d] border-[#ff8a3d]/40",
  critical: "bg-danger/15 text-danger border-danger/40",
};

type Stage = "idle" | "triage" | "resource" | "comms" | "done" | "error";

export default function PipelinePanel({
  incident,
  liveState,
  onBroadcast,
  onClose,
}: {
  incident: Incident;
  liveState: string;
  onBroadcast: (situation: string) => void;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<Stage>("idle");
  const [triage, setTriage] = useState<Triage | null>(null);
  const [resource, setResource] = useState<Resource | null>(null);
  const [comms, setComms] = useState<Comms | null>(null);

  async function run() {
    setStage("triage");
    setTriage(null);
    setResource(null);
    setComms(null);
    try {
      const res = await fetch("/api/ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pipeline", incident: `[${incident.type}] at sector ${incident.sector}: ${incident.description}`, liveState }),
      });
      const data = await res.json();
      // Stagger the reveal so the agent handoff is visible.
      setTriage(data.triage);
      setStage("resource");
      await new Promise((r) => setTimeout(r, 900));
      setResource(data.resource);
      setStage("comms");
      await new Promise((r) => setTimeout(r, 900));
      setComms(data.comms);
      setStage("done");
    } catch {
      setStage("error");
    }
  }

  const agentCard = "glass rounded-xl p-4";
  const agentHeader = "mb-2 flex items-center gap-2 text-xs font-bold tracking-wide";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold tracking-widest text-electric">AGENTIC RESPONSE PIPELINE</div>
          <div className="mt-1 text-sm text-white/80">
            #{incident.id} · {incident.type} @ sector {incident.sector} — {incident.description}
          </div>
        </div>
        <button onClick={onClose} aria-label="Close pipeline" className="btn-press shrink-0 rounded-full border border-white/15 px-2.5 py-1 text-xs text-white/60 hover:text-white">
          ✕
        </button>
      </div>

      {/* Stepper */}
      <div className="mb-4 flex items-center gap-1.5" aria-hidden>
        {[
          { n: 1, label: "Triage", on: stage !== "idle" && stage !== "error", color: "bg-pitch text-night" },
          { n: 2, label: "Resource", on: stage === "resource" || stage === "comms" || stage === "done", color: "bg-cyanx text-night" },
          { n: 3, label: "Comms", on: stage === "comms" || stage === "done", color: "bg-gold text-night" },
        ].map((s, i) => (
          <div key={s.n} className="flex flex-1 items-center gap-1.5">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-500 ${
                s.on ? s.color : "bg-white/8 text-white/40"
              }`}
            >
              {s.n}
            </span>
            <span className={`text-[10px] font-semibold transition-colors ${s.on ? "text-white/85" : "text-white/35"}`}>{s.label}</span>
            {i < 2 && <span className={`h-px flex-1 transition-colors duration-500 ${s.on ? "bg-white/30" : "bg-white/8"}`} />}
          </div>
        ))}
      </div>

      {stage === "idle" && (
        <button onClick={run} className="btn-glow-violet w-full rounded-full bg-electric py-3 text-sm font-bold transition hover:brightness-110">
          🤖 Run 3-agent response — Triage → Resource → Comms
        </button>
      )}
      {stage === "error" && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          Pipeline failed — check connectivity and retry.
          <button onClick={run} className="ml-3 underline">Retry</button>
        </div>
      )}

      <div className="space-y-3">
        {/* Agent 1 — Triage */}
        {stage !== "idle" && stage !== "error" && (
          <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} className={agentCard}>
            <div className={`${agentHeader} text-pitch`}>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pitch/15">1</span>
              TRIAGE AGENT
              {!triage && <span className="shimmer ml-2 h-3 w-24 rounded bg-white/10" />}
            </div>
            {triage && (
              <div className="space-y-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase ${SEVERITY_STYLE[triage.severity] ?? SEVERITY_STYLE.medium}`}>
                    {triage.severity}
                  </span>
                  <span className="text-white/60">{triage.category}</span>
                  {triage.escalate && <span className="rounded-full border border-danger/40 bg-danger/15 px-2.5 py-0.5 text-[11px] font-bold text-danger">⬆ ESCALATE</span>}
                </div>
                <p className="text-white/85"><AiText text={triage.summary} /></p>
                <ul className="space-y-1 text-xs text-white/55">
                  {triage.riskFactors.map((r, i) => (
                    <li key={i}>⚠ <AiText text={r} /></li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        {/* Handoff arrow */}
        {(stage === "resource" || stage === "comms" || stage === "done") && (
          <div className="pl-3 text-xs text-white/35">↓ handing off to resource allocation…</div>
        )}

        {/* Agent 2 — Resource */}
        {(stage === "resource" || stage === "comms" || stage === "done") && (
          <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} className={agentCard}>
            <div className={`${agentHeader} text-cyanx`}>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyanx/15">2</span>
              RESOURCE AGENT
              {!resource && <span className="shimmer ml-2 h-3 w-24 rounded bg-white/10" />}
            </div>
            {resource && (
              <div className="space-y-2 text-sm">
                {resource.allocations.map((a, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs">
                    <span className="font-semibold text-white/85">{a.unitId} × {a.count}</span>
                    <span className="flex-1 px-3 text-white/60"><AiText text={a.task} /></span>
                    <span className="text-cyanx">ETA {a.etaMinutes}m</span>
                  </div>
                ))}
                {resource.gateActions.length > 0 && (
                  <div className="text-xs text-warn">🚧 {resource.gateActions.join(" · ")}</div>
                )}
                <p className="text-xs italic text-white/45"><AiText text={resource.rationale} /></p>
              </div>
            )}
          </motion.div>
        )}

        {(stage === "comms" || stage === "done") && (
          <div className="pl-3 text-xs text-white/35">↓ handing off to communications…</div>
        )}

        {/* Agent 3 — Comms */}
        {(stage === "comms" || stage === "done") && (
          <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} className={agentCard}>
            <div className={`${agentHeader} text-gold`}>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/15">3</span>
              COMMS AGENT
              {!comms && <span className="shimmer ml-2 h-3 w-24 rounded bg-white/10" />}
            </div>
            {comms && (
              <div className="space-y-2 text-sm">
                <div className="rounded-lg bg-white/5 px-3 py-2">
                  <div className="text-[10px] font-bold text-white/40">STAFF RADIO</div>
                  <div className="font-mono text-xs text-white/85">📻 <AiText text={comms.staffRadioMessage} /></div>
                </div>
                {comms.publicAnnouncement && (
                  <div className="rounded-lg bg-white/5 px-3 py-2">
                    <div className="text-[10px] font-bold text-white/40">PUBLIC PA · tone: {comms.tone}</div>
                    <div className="text-xs text-white/85">📢 <AiText text={comms.publicAnnouncement} /></div>
                  </div>
                )}
                {comms.signageUpdate && (
                  <div className="rounded-lg bg-white/5 px-3 py-2">
                    <div className="text-[10px] font-bold text-white/40">CONCOURSE SIGNAGE</div>
                    <div className="text-xs text-white/85">🖥 <AiText text={comms.signageUpdate} /></div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        <AnimatePresence>
          {stage === "done" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => onBroadcast(`[${incident.type}] at sector ${incident.sector}: ${incident.description}`)}
                className="rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-semibold text-gold transition hover:bg-gold/20"
              >
                📢 Broadcast in 24 languages →
              </button>
              <button onClick={run} className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/60 hover:text-white">
                ↻ Re-run pipeline
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
