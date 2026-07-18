"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { TOUR_STEPS, TOUR_SEEN_KEY, type TourStep } from "@/lib/tour-steps";

interface TourContextValue {
  active: boolean;
  hasSteps: boolean;
  currentStep: TourStep | null;
  stepIndex: number;
  stepCount: number;
  start: () => void;
  next: () => void;
  prev: () => void;
  skip: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}

const FIND_RETRY_MS = 120;
const FIND_MAX_ATTEMPTS = 25;

export default function TourProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const steps = useMemo(() => TOUR_STEPS[pathname] ?? [], [pathname]);

  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const attemptRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  const stop = useCallback(() => {
    setActive(false);
    setRect(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const start = useCallback(() => {
    if (!steps.length) return;
    localStorage.setItem(TOUR_SEEN_KEY, "1");
    setStepIndex(0);
    setActive(true);
  }, [steps.length]);

  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i + 1 >= steps.length) {
        stop();
        return i;
      }
      return i + 1;
    });
  }, [steps.length, stop]);

  const prev = useCallback(() => setStepIndex((i) => Math.max(0, i - 1)), []);

  // Auto-launch once, ever, on whichever page the user lands on first.
  useEffect(() => {
    if (localStorage.getItem(TOUR_SEEN_KEY)) return;
    if (!steps.length) return;
    const t = setTimeout(() => start(), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A tour's steps are page-specific — close it if the user navigates away mid-tour.
  useEffect(() => {
    stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const currentStep = steps[stepIndex] ?? null;

  useEffect(() => {
    if (!active || !currentStep) return;
    // Never show the previous step's spotlight frozen in place while the new
    // target is still being located/animated in — hide until it's remeasured.
    setRect(null);
    attemptRef.current = 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Tab switches animate in (framer-motion), so the target's rect keeps moving for a
    // couple hundred ms after it's found. Keep re-measuring until it holds still.
    function settle(el: Element, stableStreak = 0, lastRect: DOMRect | null = null, ticks = 0) {
      const r = el.getBoundingClientRect();
      setRect(r);
      const same =
        lastRect &&
        r.top === lastRect.top &&
        r.left === lastRect.left &&
        r.width === lastRect.width &&
        r.height === lastRect.height;
      const streak = same ? stableStreak + 1 : 0;
      if (reduceMotion || streak >= 3 || ticks > 40) return;
      timerRef.current = setTimeout(() => settle(el, streak, r, ticks + 1), 80);
    }

    function measure() {
      const el = document.querySelector(currentStep!.selector);
      if (!el) {
        attemptRef.current += 1;
        if (attemptRef.current > FIND_MAX_ATTEMPTS) {
          next();
          return;
        }
        timerRef.current = setTimeout(measure, FIND_RETRY_MS);
        return;
      }
      el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      timerRef.current = setTimeout(() => settle(el), reduceMotion ? 0 : 300);
    }

    measure();

    function onReflow() {
      const el = document.querySelector(currentStep!.selector);
      if (el) setRect(el.getBoundingClientRect());
    }
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [active, currentStep, next]);

  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") stop();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, stop]);

  const value = useMemo<TourContextValue>(
    () => ({
      active,
      hasSteps: steps.length > 0,
      currentStep,
      stepIndex,
      stepCount: steps.length,
      start,
      next,
      prev,
      skip: stop,
    }),
    [active, steps.length, currentStep, stepIndex, start, next, prev, stop]
  );

  return (
    <TourContext.Provider value={value}>
      {children}
      {mounted &&
        active &&
        currentStep &&
        rect &&
        createPortal(
          <TourOverlay
            step={currentStep}
            stepIndex={stepIndex}
            stepCount={steps.length}
            rect={rect}
            onNext={next}
            onPrev={prev}
            onSkip={stop}
          />,
          document.body
        )}
    </TourContext.Provider>
  );
}

function TourOverlay({
  step,
  stepIndex,
  stepCount,
  rect,
  onNext,
  onPrev,
  onSkip,
}: {
  step: TourStep;
  stepIndex: number;
  stepCount: number;
  rect: DOMRect;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}) {
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    nextRef.current?.focus();
  }, [step]);

  const pad = 8;
  const gap = 16;
  const cardWidth = 340;
  const cardEstHeight = 220; // conservative estimate; real overflow is clamped by CSS max-height too

  const spotlightStyle: React.CSSProperties = {
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
    borderRadius: 16,
  };

  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const placeAbove = spaceBelow < cardEstHeight + gap && spaceAbove > spaceBelow;

  const left = Math.min(
    Math.max(12, rect.left + rect.width / 2 - cardWidth / 2),
    window.innerWidth - cardWidth - 12
  );
  const top = placeAbove
    ? Math.max(12, rect.top - pad - gap - cardEstHeight)
    : Math.min(rect.bottom + pad + gap, window.innerHeight - cardEstHeight - 12);

  const cardStyle: React.CSSProperties = { left, top };

  return (
    <>
      <div className="tour-scrim" aria-hidden />
      <div className="tour-spotlight" style={spotlightStyle} aria-hidden />
      <div
        className="tour-card glass-strong rounded-2xl p-4"
        style={{ ...cardStyle, width: cardWidth }}
        role="dialog"
        aria-modal="true"
        aria-label="Guided tour"
      >
        <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold tracking-widest text-white/40">
          <span>
            STEP {stepIndex + 1} / {stepCount}
          </span>
          <button onClick={onSkip} className="text-white/40 transition hover:text-white">
            ✕ Skip tour
          </button>
        </div>
        <h3 className="font-[family-name:var(--font-display)] text-base font-bold text-white">{step.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-white/65">{step.body}</p>
        <div className="mt-3 flex items-center justify-end gap-2">
          {stepIndex > 0 && (
            <button
              onClick={onPrev}
              className="btn-press rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/65 transition hover:text-white"
            >
              Back
            </button>
          )}
          <button
            ref={nextRef}
            onClick={onNext}
            className="btn-glow btn-press rounded-full bg-pitch px-4 py-1.5 text-xs font-bold text-night transition hover:brightness-110"
          >
            {stepIndex + 1 >= stepCount ? "Done" : "Next →"}
          </button>
        </div>
      </div>
    </>
  );
}
