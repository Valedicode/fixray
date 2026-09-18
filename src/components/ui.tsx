import Link from "next/link";
import type { SafetyLevel } from "@/lib/diagnosis/types";

export function Crosshair({ className = "border-mint-ink", dot = "bg-mint-ink", size = "size-[22px]" }) {
  return (
    <span className={`flex ${size} items-center justify-center rounded-full border-[2.5px] ${className}`}>
      <span className={`size-1.5 rounded-full ${dot}`} />
    </span>
  );
}

export function Wordmark({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <Crosshair className={dark ? "border-mint" : "border-mint-ink"} dot={dark ? "bg-mint" : "bg-mint-ink"} />
      <span className="text-2xl leading-none font-bold tracking-[-0.02em]">fixray</span>
    </div>
  );
}

export const SAFETY_LABEL: Record<SafetyLevel, string> = {
  green: "Green · DIY",
  amber: "Amber · care",
  red: "Red · pro",
};

/** Rating chip. `tone="paper"` for light surfaces, `"camera"` for dark ones. */
export function SafetyChip({ level, tone = "paper", label }: { level: SafetyLevel; tone?: "paper" | "camera"; label?: string }) {
  const styles = {
    paper: { green: "bg-green/12 text-green", amber: "bg-amber/14 text-amber-ink", red: "bg-red text-white" },
    camera: { green: "bg-green text-white", amber: "bg-amber text-ink", red: "bg-red text-white" },
  }[tone][level];
  return (
    <span className={`inline-flex shrink-0 rounded-lg px-2.5 py-1.5 font-mono text-[11px] font-semibold tracking-[0.12em] uppercase ${styles}`}>
      {label ?? SAFETY_LABEL[level]}
    </span>
  );
}

export const levelDot: Record<SafetyLevel, string> = { green: "bg-green", amber: "bg-amber", red: "bg-red" };

export function RoundButton({ href, onClick, label, dark = false, children }: {
  href?: string;
  onClick?: () => void;
  label: string;
  dark?: boolean;
  children: React.ReactNode;
}) {
  const cls = `flex size-[46px] shrink-0 items-center justify-center rounded-full text-[26px] leading-none ${
    dark ? "border border-white/16 bg-camera/70 text-paper" : "border border-ink/8 bg-white text-ink"
  }`;
  return href ? (
    <Link href={href} aria-label={label} className={cls}>{children}</Link>
  ) : (
    <button type="button" onClick={onClick} aria-label={label} className={cls}>{children}</button>
  );
}

export function Chevron() {
  return (
    <svg width="11" height="18" viewBox="0 0 12 20" fill="none" aria-hidden>
      <path d="M10 2L2 10l8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const btn = {
  primaryDark: "flex h-14 w-full items-center justify-center gap-3 rounded-[18px] bg-ink text-base font-semibold text-paper hover:bg-black",
  primaryLight: "flex h-14 w-full items-center justify-center gap-3 rounded-[18px] bg-paper text-[17px] font-semibold text-ink hover:bg-white",
  ghostOnDark: "flex h-[50px] w-full items-center justify-center rounded-[18px] border-[1.5px] border-white/20 text-[15px] font-medium text-paper hover:border-white/50",
};
