"use client";

import { useSyncExternalStore } from "react";
import type { Diagnosis, SafetyLevel } from "./diagnosis/types";

// localStorage-only persistence for this phase (no database until the dashboard needs cross-device history).

export type RepairRecord = {
  id: string;
  title: string;
  level: SafetyLevel;
  status: string;
  at: number;
};

export const KEYS = {
  onboarded: "fixray.onboarded",
  lastDiagnosis: "fixray.lastDiagnosis",
  history: "fixray.history",
} as const;

type Schema = {
  [KEYS.onboarded]: boolean;
  [KEYS.lastDiagnosis]: Diagnosis;
  [KEYS.history]: RepairRecord[];
};
type Key = keyof Schema;

const listeners = new Set<() => void>();

function readRaw(key: Key): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // private mode / blocked storage
  }
}

export function write<K extends Key>(key: K, value: Schema[K]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or blocked — state is a convenience here, not a requirement
  }
  listeners.forEach((l) => l());
}

export function read<K extends Key>(key: K): Schema[K] | null {
  const raw = readRaw(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

const parsed = new Map<string, { raw: string | null; value: unknown }>();

/**
 * Reads a stored value. `undefined` while rendering on the server / before hydration,
 * `null` when nothing is stored.
 */
export function useStored<K extends Key>(key: K): Schema[K] | null | undefined {
  return useSyncExternalStore(
    subscribe,
    () => {
      const raw = readRaw(key);
      const hit = parsed.get(key);
      if (hit && hit.raw === raw) return hit.value as Schema[K] | null;
      const value = read(key);
      parsed.set(key, { raw, value });
      return value;
    },
    () => undefined,
  );
}

export function recordRepair(d: Diagnosis) {
  const history = read(KEYS.history) ?? [];
  const title = `${d.object.label.split(" · ")[0]} · ${d.solution.title.toLowerCase()}`;
  const entry: RepairRecord = {
    id: crypto.randomUUID(),
    title,
    level: d.safety.level,
    status: d.safety.level === "red" ? `Stopped at red · ${d.safety.reason}` : "Diagnosed · parts identified",
    at: Date.now(),
  };
  // Collapse repeat visits to the same diagnosis into one entry.
  const rest = history.filter((h) => h.title !== title);
  write(KEYS.history, [entry, ...rest].slice(0, 20));
}
