"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Nav from "@/components/Nav";
import StadiumMap from "@/components/StadiumMap";
import { useSimulation } from "@/hooks/useSimulation";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.08 * i, duration: 0.55, ease: "easeOut" as const } }),
};

const FEATURES = [
  { icon: "🗣️", title: "Any language, spoken or typed", desc: "Fans chat or talk in 100+ languages — the AI detects and answers in kind, grounded in real venue data." },
  { icon: "🤖", title: "Agentic incident response", desc: "Triage → Resource → Comms: three AI agents hand off live, allocating staff and drafting panic-free messaging." },
  { icon: "🔮", title: "What-If Digital Twin", desc: "\"What if we close Gate B?\" The simulation re-runs the matchday and the AI compares both timelines." },
  { icon: "📢", title: "36-language emergency broadcast", desc: "One click composes a calm PA announcement in the languages of all 48 qualified nations — with voice playback." },
  { icon: "🗺️", title: "Live crowd heatmap", desc: "Eight sectors, five gates, simulated sensor telemetry — congestion pulses red before it becomes a problem." },
  { icon: "🌱", title: "Personal matchday planner", desc: "AI builds each fan a timeline: right gate, low-queue food windows, and the greenest route home." },
];

export default function Home() {
  const sim = useSimulation(2500);
  return (
    <>
      <Nav />
      <main className="pitch-lines flex-1">
        {/* Hero */}
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-2 lg:pt-24">
          <div>
            <motion.p variants={fadeUp} initial="hidden" animate="show" custom={0} className="mb-4 inline-block rounded-full border border-pitch/30 bg-pitch/10 px-3 py-1 text-xs font-semibold tracking-wide text-pitch">
              GENAI FOR SMART STADIUMS · FIFA WORLD CUP 2026
            </motion.p>
            <motion.h1 variants={fadeUp} initial="hidden" animate="show" custom={1} className="font-[family-name:var(--font-display)] text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
              One stadium.
              <br />
              <span className="text-gradient">82,500 fans.</span>
              <br />
              Zero chaos.
            </motion.h1>
            <motion.p variants={fadeUp} initial="hidden" animate="show" custom={2} className="mt-5 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
              StadiumIQ is an AI copilot for the world&apos;s biggest tournament — a multilingual companion for every fan and an
              agentic command center for the people keeping them safe.
            </motion.p>
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="mt-8 flex flex-wrap gap-3">
              <Link href="/fan" className="btn-glow rounded-full bg-pitch px-6 py-3 text-sm font-bold text-night transition hover:brightness-110">
                🙋 I&apos;m a Fan
              </Link>
              <Link href="/ops" className="btn-glow-violet rounded-full bg-electric px-6 py-3 text-sm font-bold text-white transition hover:brightness-110">
                🎛️ Stadium Operations
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/45">
              <span>⚡ Powered by Gemini</span>
              <span>🌐 36+ languages</span>
              <span>🏟️ Digital-twin simulation</span>
              <span>♿ Accessibility-first</span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="glass float-slow relative rounded-3xl p-4 sm:p-6"
          >
            <div className="mb-3 flex items-center justify-between px-2">
              <span className="text-xs font-semibold text-white/70">LIVE CROWD TELEMETRY</span>
              <span className="flex items-center gap-1.5 text-xs text-pitch">
                <span className="relative flex h-2 w-2">
                  <span className="pulse-ring absolute h-2 w-2 rounded-full bg-pitch" />
                  <span className="h-2 w-2 rounded-full bg-pitch" />
                </span>
                SIMULATED FEED
              </span>
            </div>
            <StadiumMap occupancy={sim.occupancy} className="w-full" />
            <div className="mt-3 flex justify-center gap-4 text-[10px] text-white/55">
              <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-pitch" />&lt;60%</span>
              <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-gold" />60-80%</span>
              <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#ff8a3d]" />80-90%</span>
              <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-danger" />&gt;90%</span>
            </div>
          </motion.div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center font-[family-name:var(--font-display)] text-2xl font-bold sm:text-3xl"
          >
            GenAI as a <span className="text-gradient">decision engine</span>, not a chatbox
          </motion.h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.06 * i, duration: 0.5 }}
                whileHover={{ y: -4 }}
                className="glass rounded-2xl p-5 transition-colors hover:border-pitch/30"
              >
                <div className="mb-3 text-2xl">{f.icon}</div>
                <h3 className="mb-1.5 font-[family-name:var(--font-display)] text-base font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-white/55">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Themes strip */}
        <section className="border-t border-white/5 bg-night-2/50 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <p className="mb-4 text-center text-xs font-semibold tracking-widest text-white/40">CHALLENGE THEMES COVERED — 8 / 8</p>
            <div className="flex flex-wrap justify-center gap-2">
              {["Navigation", "Crowd Management", "Accessibility", "Transportation", "Sustainability", "Multilingual Assistance", "Operational Intelligence", "Real-time Decision Support"].map((t) => (
                <span key={t} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">
                  ✓ {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        <footer className="border-t border-white/5 py-6 text-center text-xs text-white/35">
          StadiumIQ — built for Hack2Skill PromptWars · Challenge 4: Smart Stadiums &amp; Tournament Operations · Simulated venue data
        </footer>
      </main>
    </>
  );
}
