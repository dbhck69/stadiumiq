"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { WORLD_CUP_LANGUAGES, BROADCAST_DEFAULTS } from "@/lib/languages";
import AiText from "@/components/AiText";
import { speakText } from "@/lib/speech";

interface Announcement {
  code: string;
  language: string;
  text: string;
}

export default function Broadcast({ prefill }: { prefill?: string }) {
  const [situation, setSituation] = useState(prefill ?? "");
  const [selected, setSelected] = useState<string[]>(BROADCAST_DEFAULTS);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [fallback, setFallback] = useState(false);
  const [loading, setLoading] = useState(false);
  const [speakingCode, setSpeakingCode] = useState<string | null>(null);

  useEffect(() => {
    if (prefill) setSituation(prefill);
  }, [prefill]);

  function toggle(code: string) {
    setSelected((s) => (s.includes(code) ? s.filter((c) => c !== code) : [...s, code]));
  }

  async function compose() {
    if (!situation.trim() || !selected.length || loading) return;
    setLoading(true);
    setAnnouncements([]);
    try {
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation, languageCodes: selected }),
      });
      const data = await res.json();
      setAnnouncements(data.announcements ?? []);
      setFallback(Boolean(data.fallback));
    } catch {
      setFallback(true);
    } finally {
      setLoading(false);
    }
  }

  function speak(a: Announcement) {
    setSpeakingCode(a.code);
    speakText(a.text, {
      lang: a.code,
      onEnd: () => setSpeakingCode(null),
      onError: () => setSpeakingCode(null),
    });
  }

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-5">
        <div className="mb-1 text-xs font-semibold tracking-widest text-gold">MULTILINGUAL EMERGENCY BROADCAST</div>
        <p className="mb-4 text-sm text-white/55">
          One announcement, every fan's language — calm, panic-free phrasing composed by AI in a single pass, covering the languages of all 48 qualified nations.
        </p>
        <label className="mb-1 block text-xs text-white/60" htmlFor="situation">Situation</label>
        <textarea
          id="situation"
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          rows={2}
          placeholder="e.g. Gate B turnstiles offline — redirect arriving fans to Gates A and C"
          className="mb-3 w-full rounded-xl border border-white/15 bg-night-2 px-3 py-2.5 text-sm outline-none placeholder:text-white/25 focus:border-gold/50"
        />
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-white/60">Languages ({selected.length} selected)</span>
          <div className="flex gap-2 text-[11px]">
            <button onClick={() => setSelected(WORLD_CUP_LANGUAGES.map((l) => l.code))} className="text-gold hover:underline">
              All 24
            </button>
            <button onClick={() => setSelected(BROADCAST_DEFAULTS)} className="text-white/50 hover:underline">
              Core 6
            </button>
            <button onClick={() => setSelected([])} className="text-white/50 hover:underline">
              None
            </button>
          </div>
        </div>
        <div className="scroll-thin mb-4 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
          {WORLD_CUP_LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => toggle(l.code)}
              aria-pressed={selected.includes(l.code)}
              className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                selected.includes(l.code) ? "border-gold/60 bg-gold/15 text-gold" : "border-white/10 text-white/50 hover:text-white"
              }`}
            >
              {l.native}
            </button>
          ))}
        </div>
        <button
          onClick={compose}
          disabled={loading || !situation.trim() || !selected.length}
          className="w-full rounded-full bg-gold py-3 text-sm font-bold text-night shadow-[0_0_24px_rgba(255,194,71,0.35)] transition hover:brightness-110 disabled:opacity-40 disabled:shadow-none"
        >
          {loading ? `Composing in ${selected.length} languages…` : `📢 Compose broadcast in ${selected.length} languages`}
        </button>
      </div>

      {loading && (
        <div className="grid gap-2 sm:grid-cols-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="shimmer h-20 rounded-xl bg-white/5" />
          ))}
        </div>
      )}

      {announcements.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {fallback && <p className="mb-2 text-xs text-white/40">⚠ AI unreachable — standard English announcement only.</p>}
          <div className="grid gap-2 sm:grid-cols-2">
            {announcements.map((a, i) => {
              const lang = WORLD_CUP_LANGUAGES.find((l) => l.code === a.code);
              return (
                <motion.div
                  key={a.code + i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.8) }}
                  className="glass rounded-xl p-3.5"
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gold">{a.language}</span>
                    <button
                      onClick={() => speak(a)}
                      aria-label={`Play announcement in ${a.language}`}
                      className={`rounded-full border px-2 py-0.5 text-[10px] transition ${
                        speakingCode === a.code ? "border-gold bg-gold/20 text-gold" : "border-white/15 text-white/50 hover:text-white"
                      }`}
                    >
                      {speakingCode === a.code ? "▶ playing" : "🔊 play"}
                    </button>
                  </div>
                  <p dir={lang?.rtl ? "rtl" : "ltr"} className="text-xs leading-relaxed text-white/85">
                    <AiText text={a.text} />
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
