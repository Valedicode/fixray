"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crosshair, SafetyChip, Wordmark, levelDot } from "@/components/ui";
import { KEYS, useStored, write } from "@/lib/storage";

export default function HomePage() {
  const onboarded = useStored(KEYS.onboarded);
  if (onboarded === undefined) return <main className="min-h-dvh bg-paper" />; // before hydration
  return onboarded ? <Home /> : <FirstRun />;
}

function FirstRun() {
  const router = useRouter();
  const finish = (toCamera: boolean) => {
    write(KEYS.onboarded, true);
    if (toCamera) router.push("/scan");
  };

  return (
    <main className="pt-safe pb-safe flex min-h-dvh flex-col bg-paper px-[22px]">
      <div className="mt-8">
        <Wordmark />
      </div>
      <h1 className="mt-6 text-[32px] leading-[1.12] font-semibold tracking-[-0.02em] text-pretty">
        Point at what&apos;s broken. See the next step on it.
      </h1>
      <p className="mt-3 text-base leading-[1.45] text-pretty text-muted">
        Live guidance for plumbing, electrical and appliances. Every step is rated before you touch anything.
      </p>

      <div className="mt-6 flex flex-col gap-2.5">
        {(
          [
            ["green", "Hand tools, no live water or power."],
            ["amber", "Shut off water, gas or a breaker first — we check it's off."],
            ["red", "Stop. Licensed professional — we'll help you find one."],
          ] as const
        ).map(([level, text]) => (
          <div key={level} className="flex items-center gap-3.5 rounded-[18px] border border-ink/8 bg-white px-4 py-3.5">
            <SafetyChip level={level} />
            <p className="text-sm leading-[1.4] text-ink-2">{text}</p>
          </div>
        ))}
      </div>

      <div className="min-h-6 flex-1" />

      <section className="flex flex-col gap-2 rounded-[22px] border border-ink/8 bg-white p-5">
        <h2 className="eyebrow text-muted">Camera access</h2>
        <p className="text-base leading-[1.35] font-medium text-pretty">
          fixray uses the camera to identify parts and track them while you work.
        </p>
        <p className="text-[13px] leading-[1.45] text-muted">Frames are only sent while a scan is open. No account needed.</p>
        <button
          type="button"
          onClick={() => finish(true)}
          className="mt-2 flex h-14 items-center justify-center rounded-[18px] bg-ink text-base font-semibold text-paper hover:bg-black"
        >
          Allow camera
        </button>
        <button type="button" onClick={() => finish(false)} className="h-10 text-sm font-medium text-muted">
          Not now
        </button>
      </section>
    </main>
  );
}

function Home() {
  const history = useStored(KEYS.history) ?? [];
  const last = useStored(KEYS.lastDiagnosis);

  return (
    <main className="pt-safe pb-safe flex min-h-dvh flex-col gap-[22px] bg-paper px-[22px]">
      <header className="mt-2 flex h-[46px] items-center">
        <Wordmark />
      </header>

      <Link
        href="/scan"
        className="flex flex-col gap-[52px] rounded-[26px] bg-camera p-[22px] text-paper hover:bg-black"
      >
        <div className="flex items-center justify-between">
          <span className="flex size-[46px] items-center justify-center rounded-full bg-mint/14">
            <Crosshair className="border-mint" dot="bg-mint" size="size-5" />
          </span>
          <span className="eyebrow flex h-8 items-center rounded-2xl border border-white/16 px-3 tracking-[0.14em] text-mint">
            Live camera
          </span>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[26px] leading-[1.15] font-semibold tracking-[-0.02em]">Scan something broken</div>
            <div className="mt-1.5 text-sm text-paper/62">Faucets, valves, breakers, appliances</div>
          </div>
          <span aria-hidden className="text-[28px] leading-none text-mint">→</span>
        </div>
      </Link>

      {last && (
        <Link href="/solution" className="flex items-center justify-between rounded-[18px] border border-ink/8 bg-white px-[18px] py-3">
          <div>
            <div className="text-sm font-medium">Last diagnosis</div>
            <div className="text-[13px] text-muted">{last.solution.title}</div>
          </div>
          <span className="text-xl text-muted">›</span>
        </Link>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="eyebrow text-muted">Recent repairs</h2>
        {history.length === 0 ? (
          <p className="text-sm leading-[1.45] text-muted">
            Nothing yet. Repairs you diagnose are kept on this device.
          </p>
        ) : (
          <ol className="relative flex flex-col gap-[18px]">
            {history.length > 1 && <span aria-hidden className="absolute top-2.5 bottom-2.5 left-[5px] w-[1.5px] bg-ink/12" />}
            {history.map((r) => (
              <li key={r.id} className="flex gap-4">
                <span className={`relative mt-[5px] size-3 shrink-0 rounded-full outline-3 outline-paper ${levelDot[r.level]}`} />
                <div className="flex flex-1 flex-col gap-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[15px] leading-[1.3] font-medium">{r.title}</span>
                    <span className="font-mono text-[11px] text-muted">
                      {new Date(r.at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <span className="text-[13px] leading-[1.4] text-muted">{r.status}</span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
