"use client";

import { useEffect, useRef, useState } from "react";

/** Animates a number toward `value` whenever it changes. */
export default function CountUp({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const raf = useRef(0);

  useEffect(() => {
    const from = display;
    const diff = value - from;
    if (diff === 0) return;
    const start = performance.now();
    const dur = 600;
    const step = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + diff * eased));
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className={`tabular-nums ${className ?? ""}`}>{display.toLocaleString()}</span>;
}
