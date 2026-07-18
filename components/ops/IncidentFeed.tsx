"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Incident } from "@/lib/simulation";

const TYPE_ICON: Record<Incident["type"], string> = {
  medical: "🚑",
  "crowd-surge": "👥",
  "lost-child": "🧒",
  "gate-fault": "🚧",
  security: "🛡️",
  spill: "💧",
};

const STATUS_STYLE: Record<Incident["status"], string> = {
  new: "bg-danger/15 text-danger",
  handling: "bg-gold/15 text-gold",
  resolved: "bg-pitch/15 text-pitch",
};

export default function IncidentFeed({
  incidents,
  selectedId,
  onSelect,
}: {
  incidents: Incident[];
  selectedId: number | null;
  onSelect: (incident: Incident) => void;
}) {
  return (
    <div data-tour="ops-incident-feed" className="glass flex h-full flex-col rounded-2xl">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <span className="text-xs font-semibold tracking-widest text-white/70">INCIDENT FEED</span>
        <span className="text-[10px] text-white/40">{incidents.filter((i) => i.status !== "resolved").length} active</span>
      </div>
      <div className="scroll-thin max-h-[420px] flex-1 space-y-2 overflow-y-auto p-3">
        {incidents.length === 0 && (
          <p className="py-8 text-center text-xs text-white/35">No incidents — telemetry nominal ✓</p>
        )}
        <AnimatePresence initial={false}>
          {incidents.map((inc) => (
            <motion.button
              key={inc.id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={() => onSelect(inc)}
              className={`block w-full rounded-xl border p-3 text-left transition ${
                selectedId === inc.id ? "border-electric/60 bg-electric/10" : "border-white/8 bg-white/3 hover:border-white/20"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{TYPE_ICON[inc.type]}</span>
                <span className="text-xs font-semibold text-white/85">
                  #{inc.id} · {inc.type} · sector {inc.sector}
                </span>
                <span className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${STATUS_STYLE[inc.status]}`}>
                  {inc.status}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-white/55">{inc.description}</p>
              <div className="mt-1.5 text-[10px] font-semibold text-electric">
                {selectedId === inc.id ? "▸ pipeline open below" : "🤖 Click to run AI response pipeline"}
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
