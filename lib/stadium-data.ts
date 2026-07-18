/**
 * StadiumIQ knowledge base — a composite FIFA World Cup 2026 venue,
 * modeled on the scale of the New York/New Jersey final venue (~82,500 seats).
 * All AI answers are grounded in this data (RAG-lite: injected as context).
 */

export const VENUE = {
  name: "Liberty International Stadium",
  city: "New York / New Jersey",
  capacity: 82500,
  match: {
    fixture: "FIFA World Cup 2026 — Semi Final",
    kickoff: "20:00 local",
    gatesOpen: "17:00 local",
  },
} as const;

export interface Gate {
  id: string;
  name: string;
  side: "North" | "South" | "East" | "West";
  serves: string[]; // section ranges
  accessible: boolean;
  transitNearby: string;
}

export const GATES: Gate[] = [
  { id: "A", name: "Gate A", side: "North", serves: ["101-108", "201-208", "301-310"], accessible: true, transitNearby: "Rail Station Plaza (5 min walk)" },
  { id: "B", name: "Gate B", side: "East", serves: ["109-116", "209-216", "311-320"], accessible: false, transitNearby: "Bus Terminal East (3 min walk)" },
  { id: "C", name: "Gate C", side: "South", serves: ["117-124", "217-224", "321-330"], accessible: true, transitNearby: "Parking Lots K-M (2 min walk)" },
  { id: "D", name: "Gate D", side: "West", serves: ["125-132", "225-232", "331-340"], accessible: true, transitNearby: "Rideshare Zone W (4 min walk)" },
  { id: "E", name: "Gate E (VIP & Hospitality)", side: "North", serves: ["Club Level", "Suites"], accessible: true, transitNearby: "VIP Drop-off Circle" },
];

export interface Sector {
  id: string;
  label: string;
  capacity: number;
  gates: string[]; // gate ids
  level: "Lower" | "Mid" | "Upper";
}

/** 8 crowd-management sectors used by the ops heatmap + simulation. */
export const SECTORS: Sector[] = [
  { id: "N1", label: "North Lower (101-108)", capacity: 12000, gates: ["A"], level: "Lower" },
  { id: "E1", label: "East Lower (109-116)", capacity: 12000, gates: ["B"], level: "Lower" },
  { id: "S1", label: "South Lower (117-124)", capacity: 12000, gates: ["C"], level: "Lower" },
  { id: "W1", label: "West Lower (125-132)", capacity: 12000, gates: ["D"], level: "Lower" },
  { id: "N2", label: "North Upper (301-310)", capacity: 8500, gates: ["A"], level: "Upper" },
  { id: "E2", label: "East Upper (311-320)", capacity: 8500, gates: ["B"], level: "Upper" },
  { id: "S2", label: "South Upper (321-330)", capacity: 8500, gates: ["C"], level: "Upper" },
  { id: "W2", label: "West Upper (331-340)", capacity: 9000, gates: ["D", "E"], level: "Upper" },
];

export interface Amenity {
  type: "food" | "restroom" | "firstaid" | "prayer" | "water" | "merch" | "sensory" | "info";
  name: string;
  location: string;
  nearSections: string[];
  notes?: string;
}

export const AMENITIES: Amenity[] = [
  { type: "food", name: "World Kitchen Court", location: "North Concourse, Level 1", nearSections: ["101-108"], notes: "Halal, vegetarian, vegan options. Longest queues 30 min before kickoff." },
  { type: "food", name: "Taquería 26", location: "East Concourse, Level 1", nearSections: ["109-116"], notes: "Mexican street food. Card-only." },
  { type: "food", name: "Brooklyn Grill", location: "South Concourse, Level 1", nearSections: ["117-124"], notes: "Burgers, hot dogs. Kosher stand adjacent." },
  { type: "food", name: "Cafés do Brasil", location: "West Concourse, Level 2", nearSections: ["225-232"], notes: "Coffee, pastries, açaí." },
  { type: "food", name: "Upper Deck Eats", location: "All Upper Concourses, Level 3", nearSections: ["301-340"], notes: "Grab-and-go. Shortest queues in the stadium." },
  { type: "restroom", name: "Restrooms", location: "Every concourse, next to each section stair", nearSections: ["all"], notes: "Family restrooms at sections 104, 112, 120, 128 on each level." },
  { type: "firstaid", name: "First Aid North", location: "Level 1 behind section 104", nearSections: ["101-108", "301-310"] },
  { type: "firstaid", name: "First Aid South", location: "Level 1 behind section 120", nearSections: ["117-124", "321-330"] },
  { type: "firstaid", name: "Medical Center East", location: "Level 1 behind section 112", nearSections: ["109-116", "311-320"], notes: "Main medical facility with defibrillators and paramedic team." },
  { type: "prayer", name: "Multi-faith Prayer Room North", location: "Level 2 behind section 204", nearSections: ["all north"], notes: "Open gates-open to 1h post-match. Ablution facilities available." },
  { type: "prayer", name: "Multi-faith Prayer Room South", location: "Level 2 behind section 220", nearSections: ["all south"] },
  { type: "water", name: "Free water refill stations", location: "Next to every restroom block", nearSections: ["all"], notes: "Bring empty bottles up to 750ml." },
  { type: "merch", name: "Official FIFA Store (Main)", location: "North Plaza, outside Gate A", nearSections: ["all"], notes: "Also kiosks on every concourse." },
  { type: "sensory", name: "Sensory Room", location: "Level 2 behind section 228", nearSections: ["all"], notes: "Quiet space for neurodivergent fans; certified staff; sensory kits at Guest Services." },
  { type: "info", name: "Guest Services", location: "Behind sections 104, 112, 120, 128 (Level 1)", nearSections: ["all"], notes: "Lost & found, lost children meet point, sensory kits, wheelchair loans." },
];

export const ACCESSIBILITY = {
  wheelchairRoutes:
    "Step-free routes from Gates A, C and D. Elevators at each corner of the stadium (NE, SE, SW, NW cores). Accessible seating platforms on all levels — nearest elevator is signposted from every gate.",
  wheelchairLoan: "Free wheelchair loan at Guest Services behind section 104 (bring ID).",
  sensory: "Sensory room behind section 228 (Level 2); free sensory kits (ear defenders, fidget tools) at any Guest Services point.",
  assistiveListening: "Assistive listening devices at Guest Services; audio-descriptive commentary available on the stadium app, channel 3.",
  serviceAnimals: "Service animals welcome; relief area outside Gate D.",
  companionSeats: "Companion seats adjacent to all accessible positions.",
} as const;

export const TRANSIT = {
  rail: "Stadium Rail Station (5 min from Gate A). Trains every 8 min post-match toward Manhattan/Secaucus; expect 25-40 min queues in the first 30 min after the final whistle.",
  bus: "Bus Terminal East (3 min from Gate B), express shuttles to Port Authority every 10 min.",
  rideshare: "Rideshare Zone W, 4 min from Gate D. Surge pricing typical 0-45 min post-match; waiting 30+ min usually halves the fare.",
  parking: "Lots K-M near Gate C. Pre-booked only on matchdays. Allow 45-60 min to exit in the first hour post-match.",
  eco: "Greenest options: rail (lowest CO2 per fan), then express bus. The stadium is a certified zero-waste venue — separate recycling and compost bins on every concourse.",
  tip: "Fastest post-match exit: Upper-level fans should use Gate B or D — Gate A rail queues peak 20 min after full time.",
} as const;

export interface StaffUnit {
  id: string;
  role: "steward" | "medic" | "security" | "engineer";
  name: string;
  basePost: string; // sector id
  count: number;
}

/** Staff roster available to the Resource Agent. */
export const STAFF_ROSTER: StaffUnit[] = [
  { id: "ST-N", role: "steward", name: "Steward Team North", basePost: "N1", count: 24 },
  { id: "ST-E", role: "steward", name: "Steward Team East", basePost: "E1", count: 24 },
  { id: "ST-S", role: "steward", name: "Steward Team South", basePost: "S1", count: 24 },
  { id: "ST-W", role: "steward", name: "Steward Team West", basePost: "W1", count: 24 },
  { id: "ST-R", role: "steward", name: "Rapid Response Stewards", basePost: "N1", count: 12 },
  { id: "MD-E", role: "medic", name: "Medical Team East (main)", basePost: "E1", count: 10 },
  { id: "MD-N", role: "medic", name: "Medic Unit North", basePost: "N1", count: 4 },
  { id: "MD-S", role: "medic", name: "Medic Unit South", basePost: "S1", count: 4 },
  { id: "SC-1", role: "security", name: "Security Detail 1", basePost: "N1", count: 16 },
  { id: "SC-2", role: "security", name: "Security Detail 2", basePost: "S1", count: 16 },
  { id: "EN-1", role: "engineer", name: "Facilities Engineering", basePost: "W1", count: 6 },
];

/** Compact text serialization of the KB, injected into Gemini prompts as grounding. */
export function knowledgeBaseText(): string {
  const gates = GATES.map(
    (g) => `- ${g.name} (${g.side}): serves sections ${g.serves.join(", ")}; ${g.accessible ? "step-free/accessible" : "stairs only"}; nearby: ${g.transitNearby}`
  ).join("\n");
  const amenities = AMENITIES.map(
    (a) => `- [${a.type}] ${a.name} — ${a.location} (near ${a.nearSections.join(", ")})${a.notes ? `. ${a.notes}` : ""}`
  ).join("\n");
  return `VENUE: ${VENUE.name}, ${VENUE.city}. Capacity ${VENUE.capacity.toLocaleString()}.
MATCH: ${VENUE.match.fixture}. Kickoff ${VENUE.match.kickoff}, gates open ${VENUE.match.gatesOpen}.

GATES:
${gates}

AMENITIES:
${amenities}

ACCESSIBILITY:
- Wheelchair: ${ACCESSIBILITY.wheelchairRoutes}
- Wheelchair loan: ${ACCESSIBILITY.wheelchairLoan}
- Sensory: ${ACCESSIBILITY.sensory}
- Hearing: ${ACCESSIBILITY.assistiveListening}
- Service animals: ${ACCESSIBILITY.serviceAnimals}

TRANSIT:
- Rail: ${TRANSIT.rail}
- Bus: ${TRANSIT.bus}
- Rideshare: ${TRANSIT.rideshare}
- Parking: ${TRANSIT.parking}
- Sustainability: ${TRANSIT.eco}
- Pro tip: ${TRANSIT.tip}

SEATING GUIDE: Sections 101-132 are Lower level (Level 1), 201-232 Club/Mid (Level 2), 301-340 Upper (Level 3). Section number determines gate: see GATES above. Odd/even seat rows ascend from the pitch.`;
}
