"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/", label: "Home", short: "🏠", icon: "🏠" },
  { href: "/fan", label: "Fan Companion", short: "Fan", icon: "🙋" },
  { href: "/ops", label: "Ops Command", short: "Ops", icon: "🎛️" },
];

const HC_STORAGE_KEY = "stadiumiq_high_contrast";

export default function Nav() {
  const pathname = usePathname();
  const [hc, setHc] = useState(false);

  // Restore the saved preference once on mount (survives full page reloads,
  // not just client-side navigation).
  useEffect(() => {
    if (localStorage.getItem(HC_STORAGE_KEY) === "1") setHc(true);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("hc", hc);
    localStorage.setItem(HC_STORAGE_KEY, hc ? "1" : "0");
  }, [hc]);

  return (
    <nav className="sticky top-0 z-50 glass-strong">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5" aria-label="StadiumIQ home">
          <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pitch to-cyanx text-sm font-bold text-night sm:h-8 sm:w-8">
            ⚽
          </span>
          <span className="truncate font-[family-name:var(--font-display)] text-base font-bold tracking-tight sm:text-lg">
            Stadium<span className="text-gradient">IQ</span>
          </span>
          <span className="ml-1 hidden shrink-0 rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/60 lg:inline">
            FIFA World Cup 2026
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href ? "page" : undefined}
              className={`btn-press rounded-full px-2.5 py-1.5 text-xs font-medium transition sm:px-3 sm:text-sm ${
                pathname === l.href
                  ? "bg-pitch/15 text-pitch"
                  : "text-white/65 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="sm:hidden" aria-hidden>{l.icon}</span>
              <span className="hidden sm:inline">{l.label}</span>
            </Link>
          ))}
          <button
            onClick={() => setHc((v) => !v)}
            aria-pressed={hc}
            aria-label="Toggle high-contrast, high-visibility mode for accessibility"
            title="High-contrast mode — for low vision / bright sunlight"
            className={`btn-press ml-0.5 shrink-0 rounded-full border px-2 py-1.5 text-[10px] transition sm:px-2.5 sm:text-xs ${
              hc ? "border-pitch/60 bg-pitch/15 text-pitch" : "border-white/15 text-white/65 hover:bg-white/10 hover:text-white"
            }`}
          >
            ◐ HC
          </button>
        </div>
      </div>
    </nav>
  );
}
