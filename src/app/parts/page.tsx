"use client";

import { useState } from "react";
import { NoDiagnosis } from "@/components/NoDiagnosis";
import { Chevron, RoundButton } from "@/components/ui";
import { retailers } from "@/lib/links";
import { KEYS, useStored } from "@/lib/storage";

export default function PartsPage() {
  const d = useStored(KEYS.lastDiagnosis);
  const [retailerId, setRetailerId] = useState(retailers[0].id);
  if (!d || d.parts.length === 0) return <NoDiagnosis loading={d === undefined} />;

  const [part] = d.parts;
  const retailer = retailers.find((r) => r.id === retailerId) ?? retailers[0];
  const query = `${part.brand} ${part.partNumber} ${part.name}`;

  return (
    <main className="pt-safe flex min-h-dvh flex-col gap-3.5 bg-paper px-[22px]">
      <header className="flex items-center justify-between">
        <RoundButton href="/solution" label="Back to diagnosis">
          <Chevron />
        </RoundButton>
        <h1 className="text-[17px] font-semibold">Part identified</h1>
        <span className="w-[46px]" />
      </header>

      <section className="flex flex-col gap-1.5 rounded-[22px] border border-ink/8 bg-white px-[18px] pt-4 pb-[18px]">
        <p className="eyebrow text-[11.5px] text-muted">
          {part.brand} {part.partNumber}
        </p>
        <h2 className="text-2xl leading-[1.12] font-semibold tracking-[-0.02em]">{part.name}</h2>
        {part.note && <p className="text-sm leading-[1.4] text-muted">{part.note}</p>}
      </section>

      <fieldset className="flex flex-col gap-2">
        <legend className="eyebrow mb-2 px-0.5 text-muted">Where to look</legend>
        {retailers.map((r) => {
          const selected = r.id === retailerId;
          return (
            <label
              key={r.id}
              className={`flex cursor-pointer items-center gap-3.5 rounded-[18px] bg-white px-4 py-3 ${
                selected ? "border-[1.5px] border-ink" : "border border-ink/8 hover:border-ink/40"
              }`}
            >
              <input type="radio" name="retailer" value={r.id} checked={selected} onChange={() => setRetailerId(r.id)} className="sr-only" />
              <span
                aria-hidden
                className={`flex size-[22px] shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${selected ? "bg-ink" : "bg-ink/10"}`}
              >
                ✓
              </span>
              <span className="flex-1">
                <span className="block text-[15px] leading-[1.3] font-semibold">{r.name}</span>
                <span className="block text-[12.5px] leading-[1.3] text-muted">{r.note}</span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <div className="flex-1" />

      <div className="pb-safe sticky bottom-0 flex flex-col gap-2.5 border-t border-ink/10 bg-paper pt-3.5">
        <a
          href={retailer.url(query)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => navigator.clipboard?.writeText(part.partNumber).catch(() => {})}
          className="flex h-14 items-center justify-center gap-3 rounded-[18px] bg-ink text-base font-semibold text-paper hover:bg-black"
        >
          Search {retailer.name} <span aria-hidden>↗</span>
        </a>
        <p className="text-center text-xs leading-[1.4] text-muted">
          Opens the seller&apos;s own site. Part number {part.partNumber} is copied for you.
        </p>
      </div>
    </main>
  );
}
