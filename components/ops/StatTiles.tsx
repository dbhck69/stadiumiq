"use client";

import type { SimState } from "@/lib/simulation";

export default function StatTiles({ state }: { state: SimState }) {
  const openIncidents = state.incidents.filter((i) => i.status !== "resolved").length;
  const throughput = state.gates.reduce((n, g) => n + g.throughput, 0);
  const maxSector = state.sectors.reduce((a, b) => (a.occupancy / a.capacity > b.occupancy / b.capacity ? a : b));
  const maxPct = Math.round((maxSector.occupancy / maxSector.capacity) * 100);

  const tiles = [
    { label: "Fans inside", value: state.totalInside.toLocaleString(), accent: "text-white" },
    { label: "Gate throughput", value: `${throughput.toLocaleString()}/min`, accent: "text-cyanx" },
    { label: "Open incidents", value: String(openIncidents), accent: openIncidents > 2 ? "text-danger" : "text-pitch" },
    { label: "Busiest sector", value: `${maxSector.id} · ${maxPct}%`, accent: maxPct >= 90 ? "text-danger" : maxPct >= 80 ? "text-warn" : "text-pitch" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="glass rounded-xl px-4 py-3">
          <div className="text-[10px] font-semibold tracking-wider text-white/45">{t.label.toUpperCase()}</div>
          <div className={`font-[family-name:var(--font-display)] text-xl font-bold tabular-nums ${t.accent}`}>{t.value}</div>
        </div>
      ))}
    </div>
  );
}
