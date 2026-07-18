"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import AiText from "@/components/AiText";

const SUGGESTIONS = [
  "Which gates should we open for egress?",
  "Which sector needs stewards right now?",
  "Summarize stadium status for the director.",
];

export default function OpsChat({ liveState }: { liveState: string }) {
  const [question, setQuestion] = useState("");
  const [exchanges, setExchanges] = useState<Array<{ q: string; a: string; fallback?: boolean }>>([]);

  const askMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch("/api/ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "qa", question: text, liveState }),
      });
      return res.json() as Promise<{ answer: string; fallback?: boolean }>;
    },
    onSuccess: (data, text) => {
      setExchanges((e) => [{ q: text, a: data.answer, fallback: data.fallback }, ...e].slice(0, 4));
    },
    onError: (_err, text) => {
      setExchanges((e) => [{ q: text, a: "Connection issue — try again.", fallback: true }, ...e].slice(0, 4));
    },
  });
  const loading = askMutation.isPending;

  function ask(q: string) {
    const text = q.trim();
    if (!text || loading) return;
    setQuestion("");
    askMutation.mutate(text);
  }

  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 text-xs font-semibold tracking-widest text-white/70">ASK OPS AI · LIVE STATE AWARE</div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
        className="flex gap-2"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Which gates should we open for egress?"
          aria-label="Ask the operations AI"
          className="min-w-0 flex-1 rounded-full border border-white/15 bg-night-2 px-4 py-2.5 text-sm outline-none placeholder:text-white/30 focus:border-electric/60"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="btn-glow-violet shrink-0 rounded-full bg-electric px-5 py-2.5 text-sm font-bold transition hover:brightness-110 disabled:opacity-40 disabled:shadow-none"
        >
          Ask
        </button>
      </form>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => ask(s)} className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/50 transition hover:border-electric/40 hover:text-white">
            {s}
          </button>
        ))}
      </div>
      {loading && <div className="shimmer mt-3 h-12 rounded-xl bg-white/5" />}
      <div className="mt-3 space-y-2">
        {exchanges.map((e, i) => (
          <motion.div key={`${e.q}-${i}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-white/4 p-3">
            <div className="text-[11px] font-semibold text-electric">Q: {e.q}</div>
            <p className="mt-1 text-xs leading-relaxed text-white/80"><AiText text={e.a} /></p>
            {e.fallback && <div className="mt-1 text-[10px] text-white/40">⚠ AI unreachable — telemetry fallback</div>}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
