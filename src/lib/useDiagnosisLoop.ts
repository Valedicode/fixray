"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { captureFrame } from "./useCamera";
import type { DiagnoseResponse, Diagnosis, SafetyLevel } from "./diagnosis/types";

type State = { diagnosis: Diagnosis | null; error: string | null; halted: boolean };

/**
 * While `enabled`, captures a frame every `intervalMs` and POSTs it to /api/diagnose.
 * Requests never overlap: the next capture is scheduled after the previous response,
 * so a slow model lowers the rate instead of queueing frames.
 * A red result halts the loop — guidance must not continue past a stop — until `resume()`.
 */
export function useDiagnosisLoop({
  videoRef,
  enabled,
  mock,
  intervalMs = 1500,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  mock?: SafetyLevel;
  intervalMs?: number;
}) {
  const [state, setState] = useState<State>({ diagnosis: null, error: null, halted: false });
  const mockRef = useRef(mock);
  useEffect(() => {
    mockRef.current = mock;
  }, [mock]);

  useEffect(() => {
    if (!enabled || state.halted) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      const started = performance.now();
      const video = videoRef.current;
      const image = video ? captureFrame(video) : null;

      if (image) {
        try {
          const res = await fetch("/api/diagnose", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image, mock: mockRef.current }),
            signal: controller.signal,
          });
          if (!res.ok) throw new Error(`diagnose ${res.status}`);
          const data: DiagnoseResponse = await res.json();
          if (controller.signal.aborted) return;
          const halted = data.diagnosis.safety.level === "red";
          setState({ diagnosis: data.diagnosis, error: null, halted });
          if (halted) return;
        } catch (err) {
          if (controller.signal.aborted) return;
          // Keep the last good overlay on screen; just flag that updates stalled.
          setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Request failed" }));
        }
      }

      if (controller.signal.aborted) return;
      timer = setTimeout(tick, Math.max(0, intervalMs - (performance.now() - started)));
    };

    timer = setTimeout(tick, 300); // give the first frames a moment to expose
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [enabled, state.halted, intervalMs, videoRef]);

  /** Drop the current result and look again (also clears a red halt). */
  const resume = useCallback(() => setState({ diagnosis: null, error: null, halted: false }), []);

  return { ...state, resume };
}
