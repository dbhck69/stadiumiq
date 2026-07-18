"use client";

import { useEffect, useRef, useState } from "react";
import { initialState, tick, stateSummary, clockLabel, type SimState } from "@/lib/simulation";

/** Client-side digital twin: advances one simulated minute every `intervalMs`. */
export function useSimulation(intervalMs = 3000) {
  const [state, setState] = useState<SimState>(() => initialState());
  const [running, setRunning] = useState(true);
  const runningRef = useRef(running);
  runningRef.current = running;

  useEffect(() => {
    const id = setInterval(() => {
      if (runningRef.current) setState((s) => tick(s));
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return {
    state,
    running,
    setRunning,
    /** Jump the matchday forward (e.g. to halftime or egress for demos). */
    jumpTo(minute: number) {
      setState((s) => {
        let next = s;
        const target = Math.max(minute, s.minute);
        while (next.minute < target) next = tick(next);
        return next;
      });
    },
    summary: () => stateSummary(state),
    clock: clockLabel(state.minute),
    occupancy: Object.fromEntries(state.sectors.map((s) => [s.id, Math.round((s.occupancy / s.capacity) * 100)])),
  };
}
