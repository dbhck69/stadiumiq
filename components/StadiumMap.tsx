"use client";

/**
 * Interactive SVG stadium bowl — pure code, no images.
 * Fan mode: highlights a destination; tap any gate/sector to ask about it.
 * Ops mode: paints sectors as an occupancy heatmap; tap to inspect.
 */

import { useState } from "react";
import { motion } from "framer-motion";

const CX = 200;
const CY = 150;
const KX = 1.35; // elliptical stretch

interface SectorGeom {
  id: string;
  a0: number;
  a1: number;
  r0: number;
  r1: number;
}

// Angles: 0 = east, 90 = south (SVG y-down), 180 = west, 270 = north.
const SECTOR_GEOMS: SectorGeom[] = [
  { id: "N1", a0: 229, a1: 311, r0: 58, r1: 82 },
  { id: "E1", a0: -41, a1: 41, r0: 58, r1: 82 },
  { id: "S1", a0: 49, a1: 131, r0: 58, r1: 82 },
  { id: "W1", a0: 139, a1: 221, r0: 58, r1: 82 },
  { id: "N2", a0: 229, a1: 311, r0: 88, r1: 112 },
  { id: "E2", a0: -41, a1: 41, r0: 88, r1: 112 },
  { id: "S2", a0: 49, a1: 131, r0: 88, r1: 112 },
  { id: "W2", a0: 139, a1: 221, r0: 88, r1: 112 },
];

const GATE_POS: Record<string, { angle: number; label: string }> = {
  A: { angle: 270, label: "Gate A" },
  B: { angle: 0, label: "Gate B" },
  C: { angle: 90, label: "Gate C" },
  D: { angle: 180, label: "Gate D" },
  E: { angle: 315, label: "Gate E · VIP" },
};

function pt(angle: number, r: number): [number, number] {
  const rad = (angle * Math.PI) / 180;
  // Round to 2 decimals so server/client SVG serialization is byte-identical (avoids hydration mismatch).
  return [Math.round((CX + Math.cos(rad) * r * KX) * 100) / 100, Math.round((CY + Math.sin(rad) * r) * 100) / 100];
}

function sectorPath(g: SectorGeom): string {
  const [x0, y0] = pt(g.a0, g.r1);
  const [x1, y1] = pt(g.a1, g.r1);
  const [x2, y2] = pt(g.a1, g.r0);
  const [x3, y3] = pt(g.a0, g.r0);
  const large = g.a1 - g.a0 > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${g.r1 * KX} ${g.r1} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${g.r0 * KX} ${g.r0} 0 ${large} 0 ${x3} ${y3} Z`;
}

function heatColor(pct: number): string {
  if (pct >= 90) return "#ff4d5e";
  if (pct >= 80) return "#ff8a3d";
  if (pct >= 60) return "#ffc247";
  return "#00e07a";
}

export interface StadiumMapProps {
  /** gate id (A-E) or sector id (N1..W2) to spotlight */
  highlight?: string | null;
  /** sector id -> percent full; enables heatmap mode */
  occupancy?: Record<string, number>;
  /** show gate markers */
  showGates?: boolean;
  /** tap/click handler — makes the map interactive */
  onSelect?: (id: string, kind: "gate" | "sector") => void;
  className?: string;
}

export default function StadiumMap({ highlight, occupancy, showGates = true, onSelect, className }: StadiumMapProps) {
  const hl = highlight?.toUpperCase() ?? null;
  const [hover, setHover] = useState<string | null>(null);
  const interactive = Boolean(onSelect);

  return (
    <svg viewBox="0 0 400 300" className={className} role="img" aria-label="Interactive stadium map">
      {/* pitch */}
      <rect x={CX - 52} y={CY - 33} width={104} height={66} rx={6} fill="#0a5c38" stroke="#00e07a55" />
      <rect x={CX - 52} y={CY - 33} width={104} height={66} rx={6} fill="url(#pitchStripes)" opacity={0.5} />
      <circle cx={CX} cy={CY} r={11} fill="none" stroke="#00e07a66" />
      <line x1={CX} y1={CY - 33} x2={CX} y2={CY + 33} stroke="#00e07a66" />
      <rect x={CX - 52} y={CY - 14} width={12} height={28} fill="none" stroke="#00e07a66" />
      <rect x={CX + 40} y={CY - 14} width={12} height={28} fill="none" stroke="#00e07a66" />
      <defs>
        <pattern id="pitchStripes" width="13" height="66" patternUnits="userSpaceOnUse" x={CX - 52} y={CY - 33}>
          <rect width="6.5" height="66" fill="#0d6b42" />
        </pattern>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* sectors */}
      {SECTOR_GEOMS.map((g) => {
        const pct = occupancy?.[g.id];
        const isHl = hl === g.id;
        const isHover = hover === g.id;
        const fill = pct !== undefined ? heatColor(pct) : "#1b2946";
        const opacity = pct !== undefined ? 0.28 + (pct / 100) * 0.6 : 1;
        return (
          <g
            key={g.id}
            onClick={onSelect ? () => onSelect(g.id, "sector") : undefined}
            onMouseEnter={() => setHover(g.id)}
            onMouseLeave={() => setHover(null)}
            style={interactive ? { cursor: "pointer" } : undefined}
            role={interactive ? "button" : undefined}
            aria-label={interactive ? `Sector ${g.id}${pct !== undefined ? `, ${pct}% full` : ""}` : undefined}
          >
            <motion.path
              d={sectorPath(g)}
              fill={fill}
              fillOpacity={isHl ? 0.95 : isHover && interactive ? Math.min(opacity + 0.25, 1) : opacity}
              stroke={isHl ? "#00e07a" : isHover && interactive ? "#8ba3d8" : "#2c3f6b"}
              strokeWidth={isHl ? 2.5 : isHover && interactive ? 2 : 1}
              filter={isHl ? "url(#glow)" : undefined}
              animate={pct !== undefined && pct >= 90 ? { fillOpacity: [opacity, 0.45, opacity] } : undefined}
              transition={pct !== undefined && pct >= 90 ? { repeat: Infinity, duration: 1.4 } : undefined}
            />
            {(() => {
              const mid = (g.a0 + g.a1) / 2;
              const [lx, ly] = pt(mid, (g.r0 + g.r1) / 2);
              return (
                <text x={lx} y={ly + 3.5} textAnchor="middle" fontSize={10} fill="#eef2fb" opacity={0.95} fontWeight={700} pointerEvents="none">
                  {g.id}
                  {pct !== undefined ? ` · ${pct}%` : ""}
                </text>
              );
            })()}
          </g>
        );
      })}

      {/* gates */}
      {showGates &&
        Object.entries(GATE_POS).map(([id, g]) => {
          const [gx, gy] = pt(g.angle, 124);
          const isHl = hl === id;
          const isHover = hover === `G${id}`;
          return (
            <g
              key={id}
              onClick={onSelect ? () => onSelect(id, "gate") : undefined}
              onMouseEnter={() => setHover(`G${id}`)}
              onMouseLeave={() => setHover(null)}
              style={interactive ? { cursor: "pointer" } : undefined}
              role={interactive ? "button" : undefined}
              aria-label={interactive ? g.label : undefined}
            >
              {isHl && (
                <motion.circle
                  cx={gx}
                  cy={gy}
                  r={9}
                  fill="none"
                  stroke="#00e07a"
                  strokeWidth={2}
                  animate={{ r: [9, 17], opacity: [0.9, 0] }}
                  transition={{ repeat: Infinity, duration: 1.4, ease: "easeOut" }}
                />
              )}
              {/* generous invisible touch target */}
              <circle cx={gx} cy={gy} r={14} fill="transparent" />
              <circle
                cx={gx}
                cy={gy}
                r={isHover ? 7.5 : 6.5}
                fill={isHl ? "#00e07a" : isHover ? "#233457" : "#101a30"}
                stroke={isHl ? "#00e07a" : isHover ? "#8ba3d8" : "#4a5f8f"}
                strokeWidth={1.5}
                filter={isHl ? "url(#glow)" : undefined}
                style={{ transition: "all .15s ease" }}
              />
              <text x={gx} y={gy + 3} textAnchor="middle" fontSize={8} fontWeight={700} fill={isHl ? "#05080f" : "#c5d1ee"} pointerEvents="none">
                {id}
              </text>
              <text x={gx} y={gy + (gy > CY ? 20 : -13)} textAnchor="middle" fontSize={8} fill={isHl ? "#00e07a" : "#8296bd"} pointerEvents="none">
                {g.label}
              </text>
            </g>
          );
        })}
    </svg>
  );
}
