import type { Diagnosis } from "@/lib/diagnosis/types";
import { findProfessionalUrl } from "@/lib/links";

/** Red interrupt: replaces the instruction panel and halts guidance until the frame is re-checked. */
export function RedStop({ diagnosis, onRecheck, onLeave }: { diagnosis: Diagnosis; onRecheck: () => void; onLeave: () => void }) {
  const { safety } = diagnosis;
  const trade = safety.professional ?? "professional";

  return (
    <section role="alert" aria-live="assertive" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex flex-col gap-2.5 bg-red px-[22px] pt-[22px] pb-6 text-white">
        <div className="flex items-center gap-3">
          <span aria-hidden className="flex size-6 items-center justify-center rounded-full border-[2.5px] border-white text-sm leading-none font-bold">
            !
          </span>
          <span className="font-mono text-xs font-semibold tracking-[0.2em]">RED · STOP HERE</span>
        </div>
        <h2 className="text-[30px] leading-[1.12] font-semibold tracking-[-0.02em] text-pretty">
          {safety.headline ?? safety.reason}
        </h2>
      </div>

      <div className="pb-safe flex flex-1 flex-col gap-3.5 px-[22px] pt-[18px]">
        <p className="text-[14.5px] leading-[1.45] text-pretty text-paper/78">
          fixray doesn&apos;t guide steps in this class. What you&apos;ve done so far is saved.
        </p>

        <div className="flex gap-2 font-mono text-[11px] font-semibold tracking-[0.12em]" aria-hidden>
          <span className="flex h-10 flex-1 items-center justify-center rounded-[10px] bg-green/22 text-green-bright">GREEN · DIY</span>
          <span className="flex h-10 flex-1 items-center justify-center rounded-[10px] bg-amber/20 text-amber-bright">AMBER · CARE</span>
          <span className="flex h-10 flex-1 items-center justify-center rounded-[10px] bg-red text-white">RED · PRO</span>
        </div>

        {safety.stillSafe && safety.stillSafe.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <h3 className="eyebrow text-paper/55">Still safe to do yourself</h3>
            <ul className="flex flex-col gap-2.5">
              {safety.stillSafe.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-[1.4]">
                  <span aria-hidden className="shrink-0 font-semibold text-green-bright">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="min-h-2 flex-1" />

        <a
          href={findProfessionalUrl(trade)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 items-center justify-center rounded-[18px] bg-paper text-[17px] font-semibold text-ink hover:bg-white"
        >
          Find a licensed {trade} ↗
        </a>
        <button
          type="button"
          onClick={onRecheck}
          className="flex h-12 items-center justify-center rounded-[18px] border-[1.5px] border-white/22 text-[14.5px] font-medium hover:border-white"
        >
          Hazard cleared — re-check the frame
        </button>
        <button type="button" onClick={onLeave} className="py-1 text-[13px] font-medium text-paper/55">
          Leave this repair
        </button>
      </div>
    </section>
  );
}
