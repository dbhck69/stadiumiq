/**
 * Deterministic crowd simulation engine ("digital twin").
 * Runs client-side: one tick = one simulated minute of matchday.
 * Seeded RNG keeps demos reproducible; the what-if simulator re-runs the
 * same engine with modified parameters and compares against the baseline.
 */

import { SECTORS, GATES } from "./stadium-data";

export type MatchPhase = "ingress" | "first-half" | "halftime" | "second-half" | "egress";

export interface SectorState {
  id: string;
  occupancy: number; // people currently in sector
  capacity: number;
  trend: number; // people/min, + filling, - emptying
}

export interface GateState {
  id: string;
  open: boolean;
  throughput: number; // people/min through gate
  queue: number; // people waiting
}

export interface Incident {
  id: number;
  minute: number;
  type: "medical" | "crowd-surge" | "lost-child" | "gate-fault" | "security" | "spill";
  sector: string;
  description: string;
  status: "new" | "handling" | "resolved";
}

export interface SimState {
  minute: number; // minutes since gates open (0 = 17:00, kickoff = 180)
  phase: MatchPhase;
  sectors: SectorState[];
  gates: GateState[];
  incidents: Incident[];
  totalInside: number;
  seed: number;
  nextIncidentId: number;
}

export interface ScenarioParams {
  closedGates?: string[]; // gate ids forced closed
  extraStewards?: Record<string, number>; // sector id -> stewards added (boosts flow)
  holdSectors?: string[]; // sectors held back during egress (staggered exit)
  weatherDelay?: boolean; // slows ingress/egress 25%
}

const KICKOFF = 180; // minutes after gates open
const HALFTIME = KICKOFF + 45;
const SECOND_HALF = HALFTIME + 15;
const FULL_TIME = SECOND_HALF + 45;

// Mulberry32 — tiny deterministic PRNG.
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function phaseFor(minute: number): MatchPhase {
  if (minute < KICKOFF) return "ingress";
  if (minute < HALFTIME) return "first-half";
  if (minute < SECOND_HALF) return "halftime";
  if (minute < FULL_TIME) return "second-half";
  return "egress";
}

export function clockLabel(minute: number): string {
  if (minute < KICKOFF) return `Gates open — kickoff in ${KICKOFF - minute} min`;
  if (minute < HALFTIME) return `First half ${minute - KICKOFF}'`;
  if (minute < SECOND_HALF) return "Halftime";
  if (minute < FULL_TIME) return `Second half ${minute - SECOND_HALF + 45}'`;
  return `Full time +${minute - FULL_TIME} min`;
}

/** Start the matchday 30 min before kickoff with the stadium ~72% full. */
export function initialState(seed = 2026): SimState {
  const rand = rng(seed);
  const sectors: SectorState[] = SECTORS.map((s) => ({
    id: s.id,
    capacity: s.capacity,
    occupancy: Math.round(s.capacity * (0.66 + rand() * 0.12)),
    trend: 0,
  }));
  const gates: GateState[] = GATES.map((g) => ({
    id: g.id,
    open: true,
    throughput: 0,
    queue: Math.round(120 + rand() * 400),
  }));
  return {
    minute: KICKOFF - 30,
    phase: "ingress",
    sectors,
    gates,
    incidents: [],
    totalInside: sectors.reduce((n, s) => n + s.occupancy, 0),
    seed,
    nextIncidentId: 1,
  };
}

const INCIDENT_TEMPLATES: Array<{ type: Incident["type"]; description: (sector: string) => string; weight: number }> = [
  { type: "medical", weight: 3, description: (s) => `Fan reported feeling faint in sector ${s}; conscious, needs assessment.` },
  { type: "crowd-surge", weight: 2, description: (s) => `Density spike detected at sector ${s} concourse — flow slowing at stair access.` },
  { type: "lost-child", weight: 1, description: (s) => `Child (approx. 7) separated from guardians near sector ${s} food court.` },
  { type: "gate-fault", weight: 1, description: (s) => `Turnstile bank fault near sector ${s} — 2 of 6 lanes offline.` },
  { type: "security", weight: 1, description: (s) => `Unattended bag reported at sector ${s} concourse bench.` },
  { type: "spill", weight: 2, description: (s) => `Liquid spill on stairway in sector ${s} — slip hazard.` },
];

function maybeSpawnIncident(state: SimState, rand: () => number): void {
  // ~1 incident every 6-10 minutes, more likely at halftime/egress.
  const busy = state.phase === "halftime" || state.phase === "egress";
  if (rand() > (busy ? 0.2 : 0.12)) return;
  const totalWeight = INCIDENT_TEMPLATES.reduce((n, t) => n + t.weight, 0);
  let pick = rand() * totalWeight;
  const tmpl = INCIDENT_TEMPLATES.find((t) => (pick -= t.weight) <= 0) ?? INCIDENT_TEMPLATES[0];
  const sector = state.sectors[Math.floor(rand() * state.sectors.length)];
  state.incidents.unshift({
    id: state.nextIncidentId++,
    minute: state.minute,
    type: tmpl.type,
    sector: sector.id,
    description: tmpl.description(sector.id),
    status: "new",
  });
  if (state.incidents.length > 12) state.incidents.pop();
}

/** Advance the simulation by one minute. Pure: returns a new state. */
export function tick(prev: SimState, params: ScenarioParams = {}): SimState {
  const state: SimState = structuredClone(prev);
  state.minute += 1;
  state.phase = phaseFor(state.minute);
  const rand = rng(state.seed + state.minute * 7919);

  const weather = params.weatherDelay ? 0.75 : 1;

  for (const gate of state.gates) {
    gate.open = !(params.closedGates ?? []).includes(gate.id);
  }
  const openGates = state.gates.filter((g) => g.open);

  if (state.phase === "ingress") {
    // Arrivals ramp up toward kickoff.
    const urgency = 1 + (state.minute / KICKOFF) * 1.5;
    const arrivals = Math.round((260 + rand() * 120) * urgency * weather);
    const perGate = Math.ceil(arrivals / Math.max(openGates.length, 1));
    for (const gate of state.gates) {
      if (!gate.open) {
        // Queued fans redistribute to open gates.
        const moved = Math.min(gate.queue, 80);
        gate.queue -= moved;
        for (const og of openGates) og.queue += Math.round(moved / openGates.length);
        gate.throughput = 0;
        continue;
      }
      gate.queue += perGate;
      const capacity = Math.round((90 + rand() * 30) * weather);
      gate.throughput = Math.min(gate.queue, capacity);
      gate.queue -= gate.throughput;
      // Entrants distribute into sectors this gate serves.
      const gateSectors = state.sectors.filter((s) => SECTORS.find((x) => x.id === s.id)!.gates.includes(gate.id));
      for (const s of gateSectors) {
        const share = Math.round(gate.throughput / gateSectors.length);
        const before = s.occupancy;
        s.occupancy = Math.min(s.capacity, s.occupancy + share);
        s.trend = s.occupancy - before;
      }
    }
  } else if (state.phase === "halftime") {
    // Concourse churn: occupancy jitters, queues at food/restrooms modeled as sector "pressure".
    for (const s of state.sectors) {
      const churn = Math.round((rand() - 0.5) * 120);
      const before = s.occupancy;
      s.occupancy = Math.max(0, Math.min(s.capacity, s.occupancy + churn));
      s.trend = s.occupancy - before;
    }
    for (const gate of state.gates) { gate.throughput = 0; gate.queue = Math.max(0, gate.queue - 20); }
  } else if (state.phase === "egress") {
    for (const s of state.sectors) {
      if ((params.holdSectors ?? []).includes(s.id)) { s.trend = 0; continue; } // staggered-exit hold
      const sectorGates = SECTORS.find((x) => x.id === s.id)!.gates.filter((g) => openGates.some((og) => og.id === g));
      const stewardBoost = 1 + ((params.extraStewards?.[s.id] ?? 0) / 20) * 0.3;
      const flow = Math.round((150 + rand() * 60) * sectorGates.length * stewardBoost * weather);
      const leaving = Math.min(s.occupancy, flow);
      s.occupancy -= leaving;
      s.trend = -leaving;
      for (const gid of sectorGates) {
        const gate = state.gates.find((g) => g.id === gid)!;
        gate.throughput += Math.round(leaving / sectorGates.length);
      }
    }
    // No open gate serving a sector -> dangerous build-up signal (trend 0 but stuck).
  } else {
    // In play: minor drift, late arrivals in first half.
    for (const s of state.sectors) {
      const drift = state.phase === "first-half" ? Math.round(rand() * 25) : Math.round((rand() - 0.5) * 10);
      const before = s.occupancy;
      s.occupancy = Math.max(0, Math.min(s.capacity, s.occupancy + drift));
      s.trend = s.occupancy - before;
    }
    for (const gate of state.gates) { gate.throughput = Math.round(rand() * 15); gate.queue = Math.max(0, gate.queue - 30); }
  }

  maybeSpawnIncident(state, rand);
  // Auto-progress incident lifecycle.
  for (const inc of state.incidents) {
    if (inc.status === "handling" && state.minute - inc.minute > 6 && rand() > 0.5) inc.status = "resolved";
  }

  state.totalInside = state.sectors.reduce((n, s) => n + s.occupancy, 0);
  return state;
}

export interface ScenarioResult {
  label: string;
  series: Array<{ minute: number; phase: MatchPhase; sectors: Record<string, number>; maxUtilization: number; totalInside: number }>;
  peakSector: { id: string; utilization: number; minute: number };
  clearedAtMinute: number | null; // egress only: when stadium < 10% full
}

/** Fast-forward `minutes` from `start` under `params`; used for what-if comparisons. */
export function runScenario(start: SimState, minutes: number, params: ScenarioParams, label: string): ScenarioResult {
  let state = start;
  const series: ScenarioResult["series"] = [];
  let peak = { id: "", utilization: 0, minute: 0 };
  let clearedAtMinute: number | null = null;
  const initialTotal = start.totalInside;

  for (let i = 0; i < minutes; i++) {
    state = tick(state, params);
    const sectors: Record<string, number> = {};
    let maxUtil = 0;
    for (const s of state.sectors) {
      const util = s.occupancy / s.capacity;
      sectors[s.id] = Math.round(util * 100);
      if (util > maxUtil) maxUtil = util;
      if (util > peak.utilization) peak = { id: s.id, utilization: util, minute: state.minute };
    }
    series.push({ minute: state.minute, phase: state.phase, sectors, maxUtilization: Math.round(maxUtil * 100), totalInside: state.totalInside });
    if (clearedAtMinute === null && initialTotal > 0 && state.totalInside < initialTotal * 0.1) clearedAtMinute = state.minute;
  }
  return { label, series, peakSector: { id: peak.id, utilization: Math.round(peak.utilization * 100), minute: peak.minute }, clearedAtMinute };
}

/** Compact live-state serialization injected into ops AI prompts. */
export function stateSummary(state: SimState): string {
  const sectors = state.sectors
    .map((s) => `${s.id}: ${Math.round((s.occupancy / s.capacity) * 100)}% full (${s.occupancy.toLocaleString()}/${s.capacity.toLocaleString()}), trend ${s.trend >= 0 ? "+" : ""}${s.trend}/min`)
    .join("\n");
  const gates = state.gates
    .map((g) => `Gate ${g.id}: ${g.open ? "OPEN" : "CLOSED"}, throughput ${g.throughput}/min, queue ${g.queue}`)
    .join("\n");
  const incidents = state.incidents.length
    ? state.incidents.slice(0, 6).map((i) => `#${i.id} [${i.status}] ${i.type} @ ${i.sector} (min ${i.minute}): ${i.description}`).join("\n")
    : "none";
  return `MATCH CLOCK: ${clockLabel(state.minute)} (phase: ${state.phase})
TOTAL INSIDE: ${state.totalInside.toLocaleString()}

SECTORS:
${sectors}

GATES:
${gates}

ACTIVE INCIDENTS:
${incidents}`;
}
