"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { OverlayCanvas } from "@/components/OverlayCanvas";
import { RedStop } from "@/components/RedStop";
import { Chevron, RoundButton, SafetyChip, btn } from "@/components/ui";
import type { Diagnosis, SafetyLevel } from "@/lib/diagnosis/types";
import { KEYS, recordRepair, write } from "@/lib/storage";
import { useCamera, type CameraStatus } from "@/lib/useCamera";
import { useDiagnosisLoop } from "@/lib/useDiagnosisLoop";

const SHOW_MOCK_SWITCH = process.env.NODE_ENV === "development";

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const camera = useCamera(videoRef);

  const [mock, setMock] = useState<SafetyLevel>("green");
  const [amberAck, setAmberAck] = useState(false);

  const loop = useDiagnosisLoop({ videoRef, enabled: camera.status === "live", mock });
  const { diagnosis } = loop;
  const stopped = loop.halted && diagnosis?.safety.level === "red";

  const finish = (d: Diagnosis, to: string) => {
    write(KEYS.lastDiagnosis, d);
    recordRepair(d);
    router.push(to);
  };

  return (
    <main className="relative flex h-dvh flex-col overflow-hidden bg-camera text-paper">
      <div className={`relative transition-[height] duration-300 ${stopped ? "h-[300px] shrink-0" : "flex-1"}`}>
        <video ref={videoRef} playsInline muted autoPlay className="absolute inset-0 size-full object-cover" />
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 ${
            stopped ? "bg-camera/40" : "bg-linear-to-b from-camera/60 via-transparent via-25% to-camera/0"
          }`}
        />
        {camera.status === "live" && <OverlayCanvas videoRef={videoRef} diagnosis={diagnosis} />}
        {camera.status !== "live" && <CameraMessage status={camera.status} onRetry={camera.retry} />}

        <header className="pt-safe absolute inset-x-0 top-0 flex flex-col gap-3 px-[22px]">
          <div className="flex items-center justify-between gap-2.5">
            <RoundButton href="/" label="Back to home" dark>
              <Chevron />
            </RoundButton>
            <div className="flex h-10 min-w-0 items-center gap-2 rounded-[20px] border border-white/16 bg-camera/70 px-3.5 text-[13px] font-semibold">
              <span className={`size-[9px] shrink-0 rounded-full ${diagnosis ? "bg-mint" : "animate-[fx-blink_1.2s_ease-in-out_infinite] bg-paper/60"}`} />
              <span className="truncate">{diagnosis ? diagnosis.object.label : "Looking…"}</span>
              {diagnosis && <span className="font-mono text-xs font-normal text-paper/60">{Math.round(diagnosis.object.confidence * 100)}%</span>}
            </div>
            <SafetyPill level={diagnosis?.safety.level} />
          </div>
          {SHOW_MOCK_SWITCH && (
            <MockSwitch
              value={mock}
              onChange={(level) => {
                setMock(level);
                setAmberAck(false);
                loop.resume();
              }}
            />
          )}
        </header>
      </div>

      {stopped && diagnosis ? (
        <RedStop diagnosis={diagnosis} onRecheck={loop.resume} onLeave={() => finish(diagnosis, "/")} />
      ) : (
        <section aria-live="polite" className="pb-safe absolute inset-x-0 bottom-0 flex flex-col gap-3 bg-linear-to-b from-transparent to-camera/95 to-30% px-[22px] pt-16">
          {!diagnosis ? (
            <Scanning error={loop.error} />
          ) : diagnosis.safety.level === "amber" && !amberAck ? (
            <AmberGate diagnosis={diagnosis} onConfirm={() => setAmberAck(true)} />
          ) : (
            <Instruction diagnosis={diagnosis} error={loop.error} onSolution={() => finish(diagnosis, "/solution")} onRescan={loop.resume} />
          )}
        </section>
      )}
    </main>
  );
}

function Scanning({ error }: { error: string | null }) {
  return (
    <>
      <p className="eyebrow tracking-[0.18em] text-paper/60">Scanning</p>
      <h1 className="text-[26px] leading-[1.15] font-semibold tracking-[-0.02em]">Hold the camera on the broken part</h1>
      <p className="text-[15px] leading-[1.4] text-paper/62">Keep the whole fixture in frame. Nothing is rated until it&apos;s recognized.</p>
      <StatusLine error={error} idle="Checking a frame every 1.5 s" />
    </>
  );
}

function AmberGate({ diagnosis, onConfirm }: { diagnosis: Diagnosis; onConfirm: () => void }) {
  return (
    <div role="alert" className="flex flex-col gap-3">
      <div className="flex items-center gap-3 rounded-[14px] bg-amber px-4 py-3 text-ink">
        <span className="font-mono text-xs font-semibold tracking-[0.18em]">AMBER · SHUT-OFF FIRST</span>
      </div>
      <h1 className="text-[28px] leading-[1.12] font-semibold tracking-[-0.02em] text-pretty">{diagnosis.instruction.title}</h1>
      <p className="text-[14.5px] leading-[1.45] text-pretty text-paper/72">{diagnosis.instruction.detail}</p>
      <p className="text-sm text-amber-bright">{diagnosis.safety.reason}</p>
      <button type="button" onClick={onConfirm} className={`mt-1 ${btn.primaryLight}`}>
        It&apos;s off — continue
      </button>
    </div>
  );
}

function Instruction({ diagnosis, error, onSolution, onRescan }: {
  diagnosis: Diagnosis;
  error: string | null;
  onSolution: () => void;
  onRescan: () => void;
}) {
  const { safety, instruction } = diagnosis;
  return (
    <>
      <div className="flex items-center gap-3">
        <SafetyChip level={safety.level} tone="camera" label={safety.level === "green" ? "Low risk" : "Care"} />
        <span className="text-sm text-paper/62">{safety.reason}</span>
      </div>
      <h1 className="text-[28px] leading-[1.12] font-semibold tracking-[-0.02em] text-pretty">{instruction.title}</h1>
      <p className="text-[14.5px] leading-[1.45] text-pretty text-paper/72">{instruction.detail}</p>
      <StatusLine error={error} idle="Live · overlay updates as you move" />
      <button type="button" onClick={onSolution} className={`mt-1 ${btn.primaryLight}`}>
        See diagnosis &amp; parts <span aria-hidden>→</span>
      </button>
      <button type="button" onClick={onRescan} className={btn.ghostOnDark}>
        Not this? Rescan
      </button>
    </>
  );
}

function StatusLine({ error, idle }: { error: string | null; idle: string }) {
  return (
    <p className={`flex items-center gap-2 font-mono text-xs ${error ? "text-amber-bright" : "text-paper/55"}`}>
      <span aria-hidden className="flex h-3 items-end gap-0.5">
        {[6, 12, 8, 4].map((h, i) => (
          <span key={i} className={error ? "w-0.5 bg-amber-bright" : "w-0.5 bg-mint"} style={{ height: h }} />
        ))}
      </span>
      {error ? "Connection trouble — retrying" : idle}
    </p>
  );
}

function SafetyPill({ level }: { level?: SafetyLevel }) {
  if (!level) return <span className="w-[46px]" />;
  const map = {
    green: { cls: "border border-white/16 bg-camera/70", dot: "bg-green-bright", text: "Low risk" },
    amber: { cls: "border border-white/16 bg-camera/70", dot: "bg-amber-bright", text: "Care" },
    red: { cls: "bg-red", dot: "animate-[fx-blink_1.2s_ease-in-out_infinite] bg-white", text: "Stop" },
  }[level];
  return (
    <span className={`flex h-10 shrink-0 items-center gap-2 rounded-[20px] px-3.5 text-[13px] font-semibold ${map.cls}`}>
      <span className={`size-[9px] rounded-full ${map.dot}`} />
      {map.text}
    </span>
  );
}

function MockSwitch({ value, onChange }: { value: SafetyLevel; onChange: (l: SafetyLevel) => void }) {
  return (
    <div className="flex items-center gap-2 self-end rounded-xl border border-white/16 bg-camera/80 p-1 font-mono text-[10.5px]">
      <span className="pl-1.5 tracking-[0.14em] text-paper/50">MOCK</span>
      {(["green", "amber", "red"] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={value === l}
          onClick={() => onChange(l)}
          className={`rounded-lg px-2 py-1 uppercase ${value === l ? "bg-paper text-ink" : "text-paper/70"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function CameraMessage({ status, onRetry }: { status: CameraStatus; onRetry: () => void }) {
  const copy: Record<Exclude<CameraStatus, "live">, { title: string; body: string; retry: boolean }> = {
    starting: { title: "Starting camera…", body: "", retry: false },
    denied: {
      title: "Camera access is blocked",
      body: "Allow camera access for this site in your browser settings, then try again.",
      retry: true,
    },
    insecure: {
      title: "Camera needs a secure connection",
      body: "Open fixray over HTTPS or on localhost. On a phone, use the Cloudflare Tunnel from the README.",
      retry: false,
    },
    unavailable: { title: "No camera found", body: "This device doesn't expose a camera to the browser.", retry: true },
    error: { title: "Camera couldn't start", body: "Another app may be using it. Close it and try again.", retry: true },
  };
  const c = copy[status as Exclude<CameraStatus, "live">];
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-10 pb-40 text-center">
      <p className="text-lg font-semibold">{c.title}</p>
      {c.body && <p className="text-sm leading-[1.45] text-paper/62">{c.body}</p>}
      {c.retry && (
        <button type="button" onClick={onRetry} className="mt-2 h-11 rounded-[14px] border-[1.5px] border-white/30 px-5 text-sm font-medium">
          Try again
        </button>
      )}
    </div>
  );
}
