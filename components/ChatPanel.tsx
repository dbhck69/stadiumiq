"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WORLD_CUP_LANGUAGES } from "@/lib/languages";

interface Message {
  role: "user" | "assistant";
  text: string;
  fallback?: boolean;
}

const QUICK_CHIPS = [
  { label: "🎫 Find my gate", text: "My ticket says section 214 — which gate do I use?" },
  { label: "🍔 Nearest food", text: "Where can I get halal food near section 108?" },
  { label: "♿ Accessibility", text: "I use a wheelchair — what's the best route to upper level seating?" },
  { label: "🕌 Prayer room", text: "Where is the prayer room?" },
  { label: "🚑 First aid", text: "Where is the nearest first aid station?" },
  { label: "🚆 Way home", text: "What's the fastest way to get back to Manhattan after the match?" },
];

/* Minimal typing for the Web Speech API (not in TS DOM lib). */
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export default function ChatPanel({ onMapHighlight }: { onMapHighlight: (id: string | null) => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "¡Hola! Hello! Bonjour! مرحبا! नमस्ते!\n\nI'm StadiumIQ — ask me anything about the stadium in your language, and I'll answer in it. Try the mic button to speak instead of typing! 🎙️" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("auto");
  const [simple, setSimple] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceReply, setVoiceReply] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    setSpeechSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text.replace(/[*_#]/g, ""));
    if (language !== "auto") utter.lang = language;
    window.speechSynthesis.speak(utter);
  }

  async function send(text: string) {
    const message = text.trim();
    if (!message || loading) return;
    setInput("");
    const nextMessages: Message[] = [...messages, { role: "user" as const, text: message }];
    setMessages(nextMessages);
    setLoading(true);
    try {
      const langName = language === "auto" ? "auto" : WORLD_CUP_LANGUAGES.find((l) => l.code === language)?.name;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: nextMessages.slice(-7, -1).map((m) => ({ role: m.role, text: m.text })),
          language: langName,
          simpleLanguage: simple,
        }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", text: data.reply, fallback: data.fallback }]);
      onMapHighlight(data.map ?? null);
      if (voiceReply) speak(data.reply);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Connection issue — please try again.", fallback: true }]);
    } finally {
      setLoading(false);
    }
  }

  function toggleMic() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const w = window as unknown as Record<string, unknown>;
    const Ctor = (w.SpeechRecognition || w.webkitSpeechRecognition) as (new () => SpeechRecognitionLike) | undefined;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = language === "auto" ? navigator.language : language;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setVoiceReply(true);
      send(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  }

  return (
    <div className="glass flex h-full min-h-[480px] flex-col rounded-2xl">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/8 p-3">
        <label className="sr-only" htmlFor="lang-select">Reply language</label>
        <select
          id="lang-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-lg border border-white/15 bg-night-2 px-2.5 py-1.5 text-xs text-white/80 outline-none focus:border-pitch/50"
        >
          <option value="auto">🌐 Auto-detect language</option>
          {WORLD_CUP_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.native} ({l.name})
            </option>
          ))}
        </select>
        <button
          onClick={() => setSimple((v) => !v)}
          aria-pressed={simple}
          className={`rounded-lg border px-2.5 py-1.5 text-xs transition ${simple ? "border-pitch/50 bg-pitch/15 text-pitch" : "border-white/15 text-white/60 hover:text-white"}`}
          title="Easy-read mode: shorter, simpler sentences"
        >
          Aa Easy-read
        </button>
        <button
          onClick={() => setVoiceReply((v) => !v)}
          aria-pressed={voiceReply}
          className={`rounded-lg border px-2.5 py-1.5 text-xs transition ${voiceReply ? "border-cyanx/50 bg-cyanx/15 text-cyanx" : "border-white/15 text-white/60 hover:text-white"}`}
          title="Speak replies aloud"
        >
          🔊 Voice replies
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="scroll-thin flex-1 space-y-3 overflow-y-auto p-4">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-br-sm bg-pitch/90 text-night"
                    : "rounded-bl-sm bg-white/8 text-white/90"
                }`}
              >
                {m.text}
                {m.fallback && <div className="mt-1.5 text-[10px] opacity-60">⚠ offline answer from venue guide</div>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex justify-start">
            <div className="shimmer rounded-2xl rounded-bl-sm bg-white/8 px-5 py-3 text-sm text-white/50">Thinking…</div>
          </div>
        )}
      </div>

      {/* Quick chips */}
      <div className="scroll-thin flex gap-2 overflow-x-auto px-4 pb-2">
        {QUICK_CHIPS.map((c) => (
          <button
            key={c.label}
            onClick={() => send(c.text)}
            className="shrink-0 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:border-pitch/40 hover:text-white"
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-white/8 p-3"
      >
        {speechSupported && (
          <button
            type="button"
            onClick={toggleMic}
            aria-label={listening ? "Stop listening" : "Speak your question"}
            className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${
              listening ? "border-danger bg-danger/20 text-danger" : "border-white/15 bg-white/5 text-white/70 hover:border-cyanx/50 hover:text-cyanx"
            }`}
          >
            {listening && <span className="pulse-ring absolute inset-0 rounded-full border border-danger" />}
            🎙️
          </button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask in any language… / Pregunta en cualquier idioma…"
          aria-label="Your question"
          className="min-w-0 flex-1 rounded-full border border-white/15 bg-night-2 px-4 py-2.5 text-sm outline-none placeholder:text-white/30 focus:border-pitch/50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-glow shrink-0 rounded-full bg-pitch px-5 py-2.5 text-sm font-bold text-night transition hover:brightness-110 disabled:opacity-40 disabled:shadow-none"
        >
          Send
        </button>
      </form>
    </div>
  );
}
