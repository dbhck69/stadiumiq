"use client";

import CountUp from "@/components/CountUp";
import type { SimState } from "@/lib/simulation";

export default function StatTiles({ state }: { state: SimState }) {
  const openIncidents = state.incidents.filter((i) => i.status !== "resolved").length;
  const throughput = state.gates.reduce((n, g) => n + g.throughput, 0);
  const maxSector = state.sectors.reduce((a, b) => (a.occupancy / a.capacity > b.occupancy / b.capacity ? a : b));
  const maxPct = Math.round((maxSector.occupancy / maxSector.capacity) * 100);
  const filling = state.sectors.reduce((n, s) => n + s.trend, 0);

  const tiles = [
    {
      label: "Fans inside",
      node: <CountUp value={state.totalInside} />,
      sub: filling !== 0 ? (filling > 0 ? `▲ filling ${filling}/min` : `▼ emptying ${-filling}/min`) : "steady",
      subClass: filling > 0 ? "text-cyanx" : filling < 0 ? "text-gold" : "text-white/40",
      accent: "text-white",
    },
    {
      label: "Gate throughput",
      node: <><CountUp value={throughput} /><span className="text-sm font-semibold text-white/50">/min</span></>,
      sub: `${state.gates.filter((g) => g.open).length}/5 gates open`,
      subClass: "text-white/40",
      accent: "text-cyanx",
    },
    {
      label: "Open incidents",
      node: <CountUp value={openIncidents} />,
      sub: openIncidents > 2 ? "⚠ attention needed" : "under control",
      subClass: openIncidents > 2 ? "text-danger" : "text-pitch",
      accent: openIncidents > 2 ? "text-danger" : "text-pitch",
    },
    {
      label: "Busiest sector",
      node: <span>{maxSector.id} · <CountUp value={maxPct} />%</span>,
      sub: maxPct >= 90 ? "🔴 critical density" : maxPct >= 80 ? "🟠 watch closely" : "🟢 nominal",
      subClass: maxPct >= 90 ? "text-danger" : maxPct >= 80 ? "text-warn" : "text-pitch",
      accent: maxPct >= 90 ? "text-danger" : maxPct >= 80 ? "text-warn" : "text-pitch",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="card-hover glass rounded-2xl px-4 py-3.5">
          <div className="text-[10px] font-semibold tracking-wider text-white/45">{t.label.toUpperCase()}</div>
          <div className={`font-[family-name:var(--font-display)] text-2xl font-bold ${t.accent}`}>{t.node}</div>
          <div className={`mt-0.5 text-[11px] font-medium ${t.subClass}`}>{t.sub}</div>
        </div>
      ))}
    </div>
  );
}
