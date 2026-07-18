# I built an AI copilot for World Cup 2026 stadiums in one day — here's what I learned about GenAI beyond chatbots

*Technical blog draft — publish on Medium/Dev.to/Hashnode and link in the PromptWars submission.*

---

When Hack2Skill's PromptWars dropped Challenge 4 — *Smart Stadiums & Tournament Operations for FIFA World Cup 2026* — my first instinct was the same as everyone's: build a stadium chatbot. Then I sat with the actual problem for a while and realized a chatbot answers the easy half of it.

The 2026 World Cup will pack 80,000+ people into a bowl of concrete. They'll speak forty-odd languages. Most will never have visited the venue. And somewhere above them, an operations room will make second-by-second calls — open which gate, send stewards where, announce what, in which languages — where a wrong call isn't a bad user experience, it's a crowd-safety event.

So I built **StadiumIQ** with one design rule: **GenAI as a decision engine with visible reasoning, not a text box.** Here's how that played out technically.

## Rule 1: Let the AI reason, never let it invent numbers

The feature I'm proudest of is the **What-If Digital Twin**. An operator types: *"What if we close Gate B at halftime?"*

What happens next is a sandwich:

1. **Gemini as parser** — the question becomes structured `ScenarioParams` (`{ closedGates: ["B"], horizonMinutes: 45 }`) via a JSON-mode call.
2. **Deterministic simulation as calculator** — a crowd engine I wrote in plain TypeScript re-runs the matchday *twice*: baseline and scenario. It's seeded (mulberry32 PRNG), so both timelines differ only by the intervention. It models ingress ramps, halftime concourse churn, and gate-constrained egress drainage per sector.
3. **Gemini as narrator** — the numeric summaries of both runs go back to the model, which returns a verdict (`safe / caution / unsafe`), a headline, and concrete mitigations.

The AI never touches the arithmetic. The simulation never touches the language. Each does the thing it's actually good at, and hallucinated crowd numbers become structurally impossible. I think this pattern — *NL → params → deterministic engine → NL* — is underused in almost every "AI for operations" demo I've seen.

## Rule 2: If you claim "agentic," show the handoff

Every incident in StadiumIQ (a fainting fan, a crowd surge, a turnstile fault — spawned by the same simulation) can be run through a three-agent pipeline, and the UI renders each agent's output as it lands:

- The **Triage Agent** sees the incident *plus a serialization of live stadium state*, so its risk factors reference actual sector densities ("adjacent sector E1 at 91% — surge risk if evacuation needed").
- The **Resource Agent** consumes the triage JSON plus a real staff roster (24 stewards per quadrant, medic units, a rapid-response team) and returns allocations with counts and ETAs.
- The **Comms Agent** consumes both and drafts three artifacts: a staff radio call, a public PA text, and concourse signage. Crucially, the PA field is *nullable* — the agent is allowed to decide that public messaging would cause more panic than it prevents. Giving the model permission to output "say nothing publicly" produced noticeably more responsible comms.

Three narrow prompts chained through JSON beat one mega-prompt every time I tested: failures isolate per stage, each contract is small enough to be reliable, and the operator can audit the chain of reasoning — which, for safety decisions, is not a nice-to-have.

## Rule 3: Multilingual is a distribution problem, not a translation problem

Two findings here. First, for fan chat, I stopped specifying languages at all — the prompt says *detect and reply in kind*, and Gemini handles Spanish, Hindi, Arabic, or Swahili without being told which is which. The language picker exists only for fans who want to force an output language.

Second, the **emergency broadcast composer** generates one panic-safe announcement in the languages of all 48 qualified nations — 36 unique languages — in a *single* JSON-mode call. One call, not 36. The interesting prompt-engineering detail was tone: explicitly banning the words "emergency" and "danger" (unless evacuating) and demanding the text read natural to native speakers, not machine-translated. Browser `speechSynthesis` handles playback per BCP-47 code, and Arabic/Persian render RTL.

## Rule 4: Grounding needs a feedback channel to the UI

The fan assistant is grounded in a structured venue knowledge base (gates, amenities, accessibility routes, transit intel) injected into every prompt, with an explicit instruction to admit ignorance rather than improvise. Standard RAG-lite.

The twist: the model appends a `[MAP:C]` directive when it names a location. The client strips it and pulses Gate C on an SVG stadium map. Answer and visual can't drift apart because they come from the same generation. Tiny trick, disproportionate demo impact.

## Rule 5: Degrade loudly, not silently

Free-tier API keys rate-limit at the worst moments (like, say, judging). Every route in StadiumIQ has a knowledge-base fallback and returns `fallback: true`, which the UI renders as a visible "offline answer" tag. The app never shows a raw error, and it never pretends a fallback is AI. Honest degradation cost me an hour and will save every demo.

## The stack, briefly

Next.js 16 (App Router) + Tailwind v4 + Framer Motion; five serverless routes wrapping Gemini (`gemini-2.0-flash`, JSON mode) so the key never reaches the browser; zero database; zero image assets — the stadium, heatmap, and comparison charts are all generated SVG. The whole repo is a few hundred kilobytes.

## What I'd build next

Real telemetry adapters (turnstile counters, CV density estimation) behind the same `SimState` interface the twin already emits; Gemini Live for full-duplex voice; and push alerts that tell a fan in their own language that their rail queue just halved.

The chatbot era taught people that AI can *answer*. Stadiums — and most operational domains — need AI that can *decide, explain, and be checked*. That's the gap StadiumIQ tries to close.

*Demo link and repo in the comments.* ⚽
