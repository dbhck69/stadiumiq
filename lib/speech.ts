"use client";

/**
 * Shared browser speech helpers (Web Speech API).
 *
 * Why this exists: calling speechSynthesis.speak() immediately on page load
 * can silently produce NO audio in several browsers — getVoices() returns an
 * empty list until the async 'voiceschanged' event fires, and speaking before
 * that (or without a voice matched to the requested language) can be a no-op
 * with no error thrown. This waits for the voice list once, picks a matching
 * voice when available, and always reports success/failure via callbacks so
 * the UI never gets stuck in a silent "nothing happened" state.
 */

let voicesReady: Promise<SpeechSynthesisVoice[]> | null = null;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!("speechSynthesis" in window)) return Promise.resolve([]);
  if (!voicesReady) {
    voicesReady = new Promise((resolve) => {
      const existing = window.speechSynthesis.getVoices();
      if (existing.length > 0) {
        resolve(existing);
        return;
      }
      const handler = () => {
        window.speechSynthesis.removeEventListener("voiceschanged", handler);
        resolve(window.speechSynthesis.getVoices());
      };
      window.speechSynthesis.addEventListener("voiceschanged", handler);
      // Some browsers never fire voiceschanged (or ship it late) — don't hang forever.
      setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1200);
    });
  }
  return voicesReady;
}

export interface SpeakOptions {
  lang?: string; // BCP-47 code, e.g. "es-MX"; omit or "auto" for default voice
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (reason: string) => void;
}

/** Speak text aloud, stripping markdown symbols first. Never throws. */
export async function speakText(text: string, opts: SpeakOptions = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    opts.onError?.("Text-to-speech isn't supported in this browser.");
    return;
  }
  const clean = text.replace(/[*_#]/g, "").trim();
  if (!clean) return;

  const voices = await loadVoices();
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(clean);

  if (opts.lang && opts.lang !== "auto") {
    utter.lang = opts.lang;
    const exact = voices.find((v) => v.lang === opts.lang);
    const family = voices.find((v) => v.lang.split("-")[0] === opts.lang!.split("-")[0]);
    const match = exact ?? family;
    if (match) utter.voice = match;
  }

  utter.onstart = () => opts.onStart?.();
  utter.onend = () => opts.onEnd?.();
  utter.onerror = (e) => opts.onError?.(e.error || "Speech playback failed.");

  window.speechSynthesis.speak(utter);
}

/* ------------------------------ Speech-to-text ------------------------------ */

export interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
}

export function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition || w.webkitSpeechRecognition) as (new () => SpeechRecognitionLike) | undefined;
}

/** Human-readable message for a SpeechRecognition error code. */
export function describeSpeechError(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access is blocked — check your browser's site permissions.";
    case "no-speech":
      return "Didn't catch that — try again.";
    case "audio-capture":
      return "No microphone found.";
    case "network":
      return "Network issue during voice recognition — try again.";
    default:
      return "Couldn't hear you — try again.";
  }
}
