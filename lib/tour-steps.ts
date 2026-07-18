export interface TourStep {
  selector: string;
  title: string;
  body: string;
  /** tab id the host page must switch to before this step's target exists */
  tab?: string;
}

export const TOUR_SEEN_KEY = "stadiumiq_tour_seen";

export const TOUR_STEPS: Record<string, TourStep[]> = {
  "/": [
    {
      selector: '[data-tour="mode-card-fan"]',
      title: "I'm a Fan",
      body: "Chat in 100+ languages, get a personalized matchday plan, and find your way around with an interactive stadium map.",
    },
    {
      selector: '[data-tour="mode-card-ops"]',
      title: "Stadium Operations",
      body: "Watch the live crowd heatmap, run AI-agent incident response, test decisions in the What-If twin, and broadcast emergency alerts in 24 languages.",
    },
  ],
  "/fan": [
    {
      selector: '[data-tour="fan-chat-input"]',
      title: "Ask anything",
      body: "Type your question — the AI detects your language automatically and answers grounded in real venue data.",
      tab: "assistant",
    },
    {
      selector: '[data-tour="fan-suggestions"]',
      title: "Quick suggestions",
      body: "Not sure what to ask? These starter prompts cover the most common matchday questions.",
      tab: "assistant",
    },
    {
      selector: "#lang-select",
      title: "Reply language",
      body: "Pick an explicit reply language, or leave it on Auto to match whatever language you write in.",
      tab: "assistant",
    },
    {
      selector: '[data-tour="fan-mic-button"]',
      title: "Speak instead of typing",
      body: "Tap to talk — StadiumIQ transcribes your voice and can read replies back aloud.",
      tab: "assistant",
    },
    {
      selector: '[data-tour="fan-stadium-map"]',
      title: "Tap the map",
      body: "Tap any gate or sector on the interactive map to ask the assistant about it directly.",
      tab: "assistant",
    },
  ],
  "/ops": [
    {
      selector: '[data-tour="ops-guide-strip"]',
      title: "Start here",
      body: "This strip always shows the 3-step golden path through Ops Command.",
      tab: "live",
    },
    {
      selector: '[data-tour="ops-heatmap"]',
      title: "Live crowd heatmap",
      body: "Simulated sensor telemetry across 8 sectors and 5 gates — sectors pulse red as congestion rises.",
      tab: "live",
    },
    {
      selector: '[data-tour="ops-incident-feed"]',
      title: "Incidents → AI response",
      body: "Click any incident to run the 3-agent AI pipeline: Triage → Resource → Comms.",
      tab: "live",
    },
    {
      selector: '[aria-label="What-if scenario"]',
      title: "Test before you commit",
      body: "Describe a decision — like closing a gate — and the digital twin re-simulates the match to show the impact before you act.",
      tab: "whatif",
    },
    {
      selector: '[data-tour="ops-broadcast-languages"]',
      title: "One broadcast, every language",
      body: "Select the languages you need — the AI composes a calm, panic-free announcement in a single pass.",
      tab: "broadcast",
    },
    {
      selector: '[data-tour="ops-broadcast-compose"]',
      title: "Compose & play",
      body: "Get translated, tone-calibrated text with one-click voice playback per language.",
      tab: "broadcast",
    },
  ],
};
