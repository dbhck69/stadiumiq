"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Nav from "@/components/Nav";
import StadiumMap from "@/components/StadiumMap";
import MatchTicker from "@/components/MatchTicker";
import CountUp from "@/components/CountUp";
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
      <MatchTicker minute={sim.state.minute} attendance={sim.state.totalInside} />
      <main className="pitch-lines relative flex-1 overflow-hidden">
        {/* drifting aurora orbs */}
        <div className="orb orb-a left-[-10%] top-[-5%] h-[420px] w-[420px] bg-electric/30" aria-hidden />
        <div className="orb orb-b right-[-8%] top-[15%] h-[380px] w-[380px] bg-cyanx/25" aria-hidden />
        <div className="orb orb-a bottom-[-10%] left-[30%] h-[460px] w-[460px] bg-pitch/20" aria-hidden />

        {/* Hero */}
        <section className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-12 sm:px-6 lg:grid-cols-2 lg:pt-20">
          <div>
            <motion.p variants={fadeUp} initial="hidden" animate="show" custom={0} className="mb-4 inline-block rounded-full border border-pitch/30 bg-pitch/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-pitch sm:text-xs">
              GENAI FOR SMART STADIUMS · FIFA WORLD CUP 2026
            </motion.p>
            <motion.h1 variants={fadeUp} initial="hidden" animate="show" custom={1} className="font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
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

            {/* Live stats strip */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="mt-7 grid grid-cols-3 gap-3 sm:max-w-md">
              {[
                { label: "FANS INSIDE", node: <CountUp value={sim.state.totalInside} className="text-lg font-bold sm:text-xl" /> },
                { label: "LANGUAGES", node: <span className="text-lg font-bold sm:text-xl">36+</span> },
                { label: "AI AGENTS", node: <span className="text-lg font-bold sm:text-xl">3</span> },
              ].map((s) => (
                <div key={s.label} className="glass rounded-xl px-3 py-2.5 text-center">
                  <div className="font-[family-name:var(--font-display)] text-pitch">{s.node}</div>
                  <div className="mt-0.5 text-[9px] font-semibold tracking-widest text-white/40">{s.label}</div>
                </div>
              ))}
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
            <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] text-white/55">
              <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-pitch" />&lt;60%</span>
              <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-gold" />60-80%</span>
              <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#ff8a3d]" />80-90%</span>
              <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-danger" />&gt;90%</span>
            </div>
          </motion.div>
        </section>

        {/* Choose your side — big mode cards */}
        <section className="relative mx-auto max-w-7xl overflow-hidden px-4 pb-16 sm:px-6">
          <div className="orb orb-b left-[10%] top-[10%] h-[320px] w-[320px] bg-pitch/15" aria-hidden />
          <div className="orb orb-a right-[5%] bottom-[0%] h-[300px] w-[300px] bg-electric/15" aria-hidden />
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-center font-[family-name:var(--font-display)] text-2xl font-bold sm:text-3xl"
          >
            Choose your <span className="text-gradient">side</span>
          </motion.h2>
          <div className="grid gap-5 md:grid-cols-2">
            <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <Link href="/fan" className="gradient-ring card-hover glass group block h-full rounded-3xl p-6 sm:p-8">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pitch/15 text-3xl transition-transform group-hover:scale-110 group-hover:rotate-6">🙋</div>
                <h3 className="font-[family-name:var(--font-display)] text-xl font-bold sm:text-2xl">I&apos;m a Fan</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  Your personal matchday companion — in your language.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-white/70">
                  <li>💬 Ask anything — food, gates, first aid, prayer rooms</li>
                  <li>🎙️ Speak in any of 100+ languages, hear the answer back</li>
                  <li>🗓️ Get an AI-planned matchday timeline</li>
                </ul>
                <span className="btn-glow btn-press mt-6 inline-flex items-center gap-2 rounded-full bg-pitch px-5 py-2.5 text-sm font-bold text-night transition group-hover:brightness-110">
                  Open Fan Companion <span className="transition-transform group-hover:translate-x-1">→</span>
                </span>
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <Link href="/ops" className="gradient-ring card-hover glass group block h-full rounded-3xl p-6 sm:p-8">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-electric/15 text-3xl transition-transform group-hover:scale-110 group-hover:-rotate-6">🎛️</div>
                <h3 className="font-[family-name:var(--font-display)] text-xl font-bold sm:text-2xl">Stadium Operations</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  A command center where AI agents earn their keep.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-white/70">
                  <li>📡 Live crowd heatmap with congestion alerts</li>
                  <li>🤖 Run a 3-agent AI response on any incident</li>
                  <li>🔮 Test decisions in a what-if digital twin first</li>
                </ul>
                <span className="btn-glow-violet btn-press mt-6 inline-flex items-center gap-2 rounded-full bg-electric px-5 py-2.5 text-sm font-bold text-white transition group-hover:brightness-110">
                  Open Command Center <span className="transition-transform group-hover:translate-x-1">→</span>
                </span>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="relative mx-auto max-w-7xl overflow-hidden px-4 pb-20 sm:px-6">
          <div className="orb orb-a left-[-5%] top-[20%] h-[340px] w-[340px] bg-cyanx/14" aria-hidden />
          <div className="orb orb-b right-[0%] top-[60%] h-[360px] w-[360px] bg-electric/14" aria-hidden />
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center font-[family-name:var(--font-display)] text-2xl font-bold sm:text-3xl"
          >
            GenAI as a <span className="text-gradient">decision engine</span>, not a chatbox
          </motion.h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i, duration: 0.5 }}
                className="card-hover glass rounded-2xl p-5"
              >
                <div className="mb-3 text-2xl">{f.icon}</div>
                <h3 className="mb-1.5 font-[family-name:var(--font-display)] text-base font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-white/55">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Themes strip */}
        <section className="relative border-t border-white/5 bg-night-2/50 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <p className="mb-4 text-center text-xs font-semibold tracking-widest text-white/40">CHALLENGE THEMES COVERED — 8 / 8</p>
            <div className="flex flex-wrap justify-center gap-2">
              {["Navigation", "Crowd Management", "Accessibility", "Transportation", "Sustainability", "Multilingual Assistance", "Operational Intelligence", "Real-time Decision Support"].map((t) => (
                <span key={t} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:border-pitch/40 hover:text-white">
                  ✓ {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        <footer className="relative border-t border-white/5 py-6 text-center text-xs text-white/35">
          StadiumIQ — built for Hack2Skill PromptWars · Challenge 4: Smart Stadiums &amp; Tournament Operations · Simulated venue data
        </footer>
      </main>
    </>
  );
}
