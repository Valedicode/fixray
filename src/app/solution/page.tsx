"use client";

import Link from "next/link";
import { NoDiagnosis } from "@/components/NoDiagnosis";
import { Chevron, RoundButton, SafetyChip, levelDot } from "@/components/ui";
import { KEYS, useStored } from "@/lib/storage";

export default function SolutionPage() {
  const d = useStored(KEYS.lastDiagnosis);
  if (!d) return <NoDiagnosis loading={d === undefined} />;

  const { solution, safety, object, parts } = d;
  const totalMin = solution.steps.reduce((n, s) => n + s.minutes, 0);

  return (
    <main className="pt-safe pb-safe flex min-h-dvh flex-col gap-3.5 bg-paper px-[22px]">
      <header className="flex items-center justify-between">
        <RoundButton href="/scan" label="Back to camera">
          <Chevron />
        </RoundButton>
        <h1 className="text-[17px] font-semibold">Diagnosis</h1>
        <span className="w-[46px]" />
      </header>

      <section className="flex flex-col gap-2 rounded-[22px] border border-ink/8 bg-white p-5">
        <p className="eyebrow text-muted">{object.label.split(" · ")[0]}</p>
        <h2 className="text-[27px] leading-[1.12] font-semibold tracking-[-0.02em]">{solution.title}</h2>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="rounded-lg bg-mint-ink/12 px-2.5 py-1.5 font-mono text-[11px] font-semibold tracking-[0.1em] text-mint-ink">
            {Math.round(solution.confidence * 100)}% MATCH
          </span>
          <span className="text-[13px] text-muted">{solution.signs}</span>
        </div>
        <p className="mt-0.5 text-sm leading-[1.45] text-pretty text-ink-2">{solution.summary}</p>
      </section>

      <section className="flex flex-col gap-1.5 rounded-[22px] border border-ink/8 bg-white px-5 py-4">
        <div className="flex items-center justify-between">
          <SafetyChip level={safety.level} />
          <span className="font-mono text-[11px] text-muted">overall rating</span>
        </div>
        <p className="mt-1 text-[15px] leading-[1.35] font-medium">{safety.reason}</p>
      </section>

      <section className="flex flex-col gap-2.5 px-1">
        <h2 className="eyebrow text-muted">
          The fix · {solution.steps.length} steps · ~{totalMin} min
        </h2>
        <ol className="relative flex flex-col gap-[11px]">
          <span aria-hidden className="absolute top-2 bottom-2 left-[5px] w-[1.5px] bg-ink/12" />
          {solution.steps.map((s) => (
            <li key={s.title} className="flex gap-3.5">
              <span className={`relative mt-1 size-3 shrink-0 rounded-full outline-3 outline-paper ${levelDot[safety.level === "red" ? "red" : "green"]}`} />
              <div className="flex flex-1 justify-between gap-2">
                <span className="text-sm leading-[1.35] font-medium">{s.title}</span>
                <span className="font-mono text-[11px] whitespace-nowrap text-muted">{s.minutes} min</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="min-h-4 flex-1" />

      {parts.length > 0 && (
        <Link
          href="/parts"
          className="flex h-14 items-center justify-between rounded-[18px] bg-ink px-5 text-base font-semibold text-paper hover:bg-black"
        >
          <span>Parts you&apos;ll need</span>
          <span className="font-mono text-xs font-medium text-mint">
            {parts.length} PART{parts.length > 1 ? "S" : ""} →
          </span>
        </Link>
      )}
    </main>
  );
}
