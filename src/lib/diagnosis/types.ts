// The contract between the camera client and /api/diagnose.
// Every provider (mock today, a vision model later) must return a Diagnosis.

export type SafetyLevel = "green" | "amber" | "red";

/** Rectangle in normalized frame coordinates (0–1), origin top-left of the captured frame. */
export type Region = { x: number; y: number; w: number; h: number };

export type Direction = "cw" | "ccw" | "up" | "down" | "left" | "right";

export type Diagnosis = {
  object: { label: string; detail: string; confidence: number };
  overlay: {
    region: Region;
    shape: "ring" | "box";
    /** Motion hint drawn around the region; null when the step is "look, don't touch". */
    arrow: Direction | null;
    callout: { title: string; detail: string };
  };
  instruction: { title: string; detail: string };
  safety: {
    level: SafetyLevel;
    /** One line shown beside the rating, e.g. "Supply valves closed · hand tools only". */
    reason: string;
    /** Red only: headline for the stop band. */
    headline?: string;
    /** Red only: what the user can still do safely. */
    stillSafe?: string[];
    /** Red only: trade to search for, e.g. "electrician". */
    professional?: string;
  };
  solution: {
    title: string;
    confidence: number;
    signs: string;
    summary: string;
    steps: { title: string; minutes: number }[];
  };
  parts: { brand: string; partNumber: string; name: string; note?: string }[];
};

export type DiagnoseRequest = {
  /** JPEG data URL of the captured frame. */
  image: string;
  /** Mock provider only: force a safety level to exercise the UI. Ignored by real providers. */
  mock?: SafetyLevel;
};

export type DiagnoseResponse = { diagnosis: Diagnosis; provider: string; ms: number };
