"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/fan", label: "Fan Companion" },
  { href: "/ops", label: "Ops Command" },
];

export default function Nav() {
  const pathname = usePathname();
  const [hc, setHc] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("hc", hc);
  }, [hc]);

  return (
    <nav className="sticky top-0 z-50 glass-strong">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="StadiumIQ home">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pitch to-cyanx font-bold text-night">
            ⚽
          </span>
          <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
            Stadium<span className="text-gradient">IQ</span>
          </span>
          <span className="ml-1 hidden rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/60 sm:inline">
            FIFA World Cup 2026
          </span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
                pathname === l.href
                  ? "bg-pitch/15 text-pitch"
                  : "text-white/65 hover:bg-white/5 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={() => setHc((v) => !v)}
            aria-pressed={hc}
            title="Toggle high-contrast mode"
            className="ml-1 rounded-full border border-white/15 px-2.5 py-1.5 text-xs text-white/65 transition hover:bg-white/10 hover:text-white"
          >
            HC
          </button>
        </div>
      </div>
    </nav>
  );
}
