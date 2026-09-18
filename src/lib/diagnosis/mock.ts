import type { DiagnoseRequest, Diagnosis } from "./types";

// Scenario from the design: kitchen faucet drip → Moen 1225 cartridge,
// with the under-sink outlet as the red interrupt.

const solution: Diagnosis["solution"] = {
  title: "Worn cartridge seals",
  confidence: 0.91,
  signs: "Drips when closed · stiff handle",
  summary: "Both signs point to the seals on a 1225-type cartridge — not the aerator or the supply lines.",
  steps: [
    { title: "Close both shut-off valves", minutes: 2 },
    { title: "Remove the handle", minutes: 3 },
    { title: "Pull the retaining clip straight out", minutes: 2 },
    { title: "Lift the cartridge out — stiff? use a puller", minutes: 5 },
    { title: "Fit new cartridge, reassemble, test", minutes: 8 },
  ],
};

const parts: Diagnosis["parts"] = [
  {
    brand: "Moen",
    partNumber: "1225",
    name: "Replacement cartridge",
    note: "Also sold as 1225B, same part in newer packaging.",
  },
];

const object = { label: "Kitchen faucet · single-handle", detail: "Cartridge type · one lever mixes hot and cold", confidence: 0.94 };

const green: Diagnosis = {
  object,
  overlay: {
    region: { x: 0.38, y: 0.36, w: 0.24, h: 0.13 },
    shape: "ring",
    arrow: "ccw",
    callout: { title: "Handle cap", detail: "¼ turn counterclockwise" },
  },
  instruction: {
    title: "Turn the handle cap counterclockwise",
    detail: "About a quarter turn by hand, then lift it off. If it won't move, wrap it in a cloth and use pliers gently. Don't force the stem underneath.",
  },
  safety: { level: "green", reason: "Supply valves closed · hand tools only" },
  solution,
  parts,
};

const amber: Diagnosis = {
  object,
  overlay: {
    region: { x: 0.3, y: 0.62, w: 0.4, h: 0.16 },
    shape: "box",
    arrow: "cw",
    callout: { title: "Shut-off valves", detail: "turn clockwise until snug" },
  },
  instruction: {
    title: "Close both shut-off valves",
    detail: "Under the sink, turn the hot and cold valves clockwise until they stop. Open the faucet to confirm no water flows.",
  },
  safety: { level: "amber", reason: "Water shut-off required before touching the faucet" },
  solution,
  parts,
};

const red: Diagnosis = {
  object: { label: "Under-sink cabinet", detail: "Shut-off valves · disposal outlet", confidence: 0.88 },
  overlay: {
    region: { x: 0.12, y: 0.55, w: 0.3, h: 0.2 },
    shape: "box",
    arrow: null,
    callout: { title: "Outlet · live 120 V", detail: "water 30 cm away" },
  },
  instruction: {
    title: "Close the shut-off valves",
    detail: "Paused — the frame shows a hazard next to the valves.",
  },
  safety: {
    level: "red",
    reason: "Standing water beside a live outlet",
    headline: "Standing water next to a live outlet.",
    stillSafe: [
      "Switch off the breaker for the disposal — the panel front is safe",
      "Photograph under the sink for the electrician",
      "Close the cabinet, keep kids and pets away",
    ],
    professional: "electrician",
  },
  solution,
  parts,
};

const scenarios = { green, amber, red };

export async function diagnoseMock(req: DiagnoseRequest): Promise<Diagnosis> {
  await new Promise((r) => setTimeout(r, 250 + Math.random() * 300)); // feel like a network model
  const base = scenarios[req.mock ?? "green"];
  // Small jitter so each poll visibly moves the overlay — proves the update path end to end.
  const j = () => (Math.random() - 0.5) * 0.02;
  const { region } = base.overlay;
  return {
    ...base,
    overlay: { ...base.overlay, region: { ...region, x: region.x + j(), y: region.y + j() } },
  };
}
