"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { WORLD_CUP_LANGUAGES } from "@/lib/languages";
import AiText from "@/components/AiText";
import { speakText, getSpeechRecognitionCtor, describeSpeechError, type SpeechRecognitionLike } from "@/lib/speech";

interface Message {
  role: "user" | "assistant";
  text: string;
  fallback?: boolean;
}

const SUGGESTIONS = [
  { icon: "🎫", title: "Find my gate", text: "My ticket says section 214 — which gate do I use?" },
  { icon: "🍔", title: "Food near me", text: "Where can I get halal food near section 108?" },
  { icon: "♿", title: "Accessible route", text: "I use a wheelchair — what's the best route to upper level seating?" },
  { icon: "🕌", title: "Prayer room", text: "Where is the prayer room?" },
  { icon: "🚑", title: "First aid", text: "Where is the nearest first aid station?" },
  { icon: "🚆", title: "Way home", text: "What's the fastest way to get back to Manhattan after the match?" },
];

export default function ChatPanel({
  onMapHighlight,
  injected,
}: {
  onMapHighlight: (id: string | null) => void;
  /** external question (e.g. from tapping the map); bump `id` to send a new one */
  injected?: { text: string; id: number } | null;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("auto");
  const [simple, setSimple] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceReply, setVoiceReply] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const lastInjectedId = useRef(0);

  useEffect(() => {
    setSpeechSupported(Boolean(getSpeechRecognitionCtor()));
  }, []);

  const chatMutation = useMutation({
    mutationFn: async ({ message, nextMessages }: { message: string; nextMessages: Message[] }) => {
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
      return res.json();
    },
    onSuccess: (data) => {
      setMessages((m) => [...m, { role: "assistant", text: data.reply, fallback: data.fallback }]);
      onMapHighlight(data.map ?? null);
      if (voiceReply) speak(data.reply);
    },
    onError: () => {
      setMessages((m) => [...m, { role: "assistant", text: "Connection issue — please try again.", fallback: true }]);
    },
  });
  const loading = chatMutation.isPending;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (injected && injected.id !== lastInjectedId.current) {
      lastInjectedId.current = injected.id;
      send(injected.text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [injected]);

  function speak(text: string) {
    speakText(text, {
      lang: language,
      onError: (reason) => setVoiceNote(reason),
    });
  }

  function send(text: string) {
    const message = text.trim();
    if (!message || loading) return;
    setInput("");
    const nextMessages: Message[] = [...messages, { role: "user" as const, text: message }];
    setMessages(nextMessages);
    chatMutation.mutate({ message, nextMessages });
  }

  function toggleMic() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setVoiceNote("Voice input isn't supported in this browser — try Chrome or Edge.");
      return;
    }
    setVoiceNote(null);
    const rec = new Ctor();
    rec.lang = language === "auto" ? navigator.language : language;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setVoiceReply(true);
      send(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = (e) => {
      setListening(false);
      setVoiceNote(describeSpeechError(e.error));
    };
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  }

  const empty = messages.length === 0;

  return (
    <div className="glass flex h-full min-h-[520px] min-w-0 flex-col rounded-2xl">
      {/* Assistant header */}
      <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-pitch to-cyanx text-lg">
          ⚽
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-night bg-pitch" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">StadiumIQ Assistant</div>
          <div className="text-[11px] text-white/45">Speaks your language · knows every corner of the stadium</div>
        </div>
        {/* Settings */}
        <div className="flex items-center gap-1.5">
          <label className="sr-only" htmlFor="lang-select">Reply language</label>
          <select
            id="lang-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="max-w-[110px] rounded-lg border border-white/15 bg-night-2 px-2 py-1.5 text-[11px] text-white/80 outline-none focus:border-pitch/50 sm:max-w-[150px]"
            title="Reply language"
          >
            <option value="auto">🌐 Auto</option>
            {WORLD_CUP_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.native}
              </option>
            ))}
          </select>
          <button
            onClick={() => setSimple((v) => !v)}
            aria-pressed={simple}
            className={`btn-press rounded-lg border px-2 py-1.5 text-[11px] transition ${simple ? "border-pitch/50 bg-pitch/15 text-pitch" : "border-white/15 text-white/60 hover:text-white"}`}
            title="Easy-read mode: shorter, simpler sentences"
          >
            Aa
          </button>
          <button
            onClick={() => setVoiceReply((v) => !v)}
            aria-pressed={voiceReply}
            className={`btn-press rounded-lg border px-2 py-1.5 text-[11px] transition ${voiceReply ? "border-cyanx/50 bg-cyanx/15 text-cyanx" : "border-white/15 text-white/60 hover:text-white"}`}
            title="Speak replies aloud"
          >
            🔊
          </button>
        </div>
      </div>

      {/* Messages / empty state */}
      <div ref={scrollRef} className="scroll-thin flex-1 space-y-3 overflow-y-auto p-4">
        {empty && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full flex-col justify-center">
            <p className="mb-1 text-center font-[family-name:var(--font-display)] text-lg font-semibold">
              ¡Hola! Hello! Bonjour! مرحبا! नमस्ते! 👋
            </p>
            <p className="mb-5 text-center text-sm text-white/50">
              Ask me anything about the stadium — in <span className="text-pitch">your</span> language. Or tap a card:
            </p>
            <div data-tour="fan-suggestions" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {SUGGESTIONS.map((s, i) => (
                <motion.button
                  key={s.title}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * i }}
                  onClick={() => send(s.text)}
                  className="card-hover btn-press glass rounded-xl p-3 text-left"
                >
                  <div className="text-xl">{s.icon}</div>
                  <div className="mt-1.5 text-xs font-semibold">{s.title}</div>
                  <div className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-white/45">{s.text}</div>
                </motion.button>
              ))}
            </div>
            {speechSupported && (
              <p className="mt-5 text-center text-[11px] text-white/40">
                🎙️ Prefer to talk? Tap the mic below and speak in any language.
              </p>
            )}
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <span className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pitch/30 to-cyanx/30 text-sm">⚽</span>
              )}
              <div
                className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-br-sm bg-gradient-to-br from-pitch to-[#00c96e] text-night shadow-[0_4px_18px_rgba(0,224,122,0.25)]"
                    : "rounded-bl-sm bg-white/8 text-white/90"
                }`}
              >
                <AiText text={m.text} />
                {m.fallback && <div className="mt-1.5 text-[10px] opacity-60">⚠ offline answer from venue guide</div>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pitch/30 to-cyanx/30 text-sm">⚽</span>
            <div className="flex gap-1.5 rounded-2xl rounded-bl-sm bg-white/8 px-4 py-3.5">
              <span className="typing-dot h-2 w-2 rounded-full bg-white/60" />
              <span className="typing-dot h-2 w-2 rounded-full bg-white/60" />
              <span className="typing-dot h-2 w-2 rounded-full bg-white/60" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Quick chips once conversation is going */}
      {!empty && (
        <div className="scroll-thin flex gap-2 overflow-x-auto px-4 pb-2">
          {SUGGESTIONS.map((c) => (
            <button
              key={c.title}
              onClick={() => send(c.text)}
              className="btn-press shrink-0 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:border-pitch/40 hover:text-white"
            >
              {c.icon} {c.title}
            </button>
          ))}
        </div>
      )}

      {/* Voice status note */}
      {voiceNote && (
        <div className="flex items-center justify-between gap-2 border-t border-white/8 bg-warn/8 px-4 py-2 text-[11px] text-warn">
          <span>⚠ {voiceNote}</span>
          <button onClick={() => setVoiceNote(null)} aria-label="Dismiss" className="text-warn/70 hover:text-warn">✕</button>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-white/8 p-3"
      >
        <button
          type="button"
          data-tour="fan-mic-button"
          onClick={toggleMic}
          disabled={!speechSupported}
          aria-label={listening ? "Stop listening" : "Speak your question"}
          title={speechSupported ? "Speak your question" : "Voice input not supported in this browser"}
          className={`btn-press relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-lg transition ${
            !speechSupported
              ? "cursor-not-allowed border-white/8 bg-white/3 text-white/25"
              : listening
                ? "border-danger bg-danger/20 text-danger"
                : "border-white/15 bg-white/5 text-white/70 hover:border-cyanx/50 hover:text-cyanx"
          }`}
        >
          {listening && <span className="pulse-ring absolute inset-0 rounded-full border border-danger" />}
          🎙️
        </button>
        <input
          value={input}
          data-tour="fan-chat-input"
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask in any language…"
          aria-label="Your question"
          className="min-w-0 flex-1 rounded-full border border-white/15 bg-night-2 px-4 py-3 text-sm outline-none transition placeholder:text-white/30 focus:border-pitch/50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-glow btn-press shrink-0 rounded-full bg-pitch px-5 py-3 text-sm font-bold text-night transition hover:brightness-110 disabled:opacity-40 disabled:shadow-none"
        >
          Send
        </button>
      </form>
    </div>
  );
}
