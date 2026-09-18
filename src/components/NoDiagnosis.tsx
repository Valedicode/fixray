import Link from "next/link";

export function NoDiagnosis({ loading }: { loading: boolean }) {
  return (
    <main className="pt-safe pb-safe flex min-h-dvh flex-col items-center justify-center gap-4 bg-paper px-[22px] text-center">
      {!loading && (
        <>
          <p className="text-lg font-semibold">No diagnosis yet</p>
          <p className="text-sm text-muted">Scan something first — the result shows up here.</p>
          <Link href="/scan" className="mt-2 flex h-12 items-center rounded-[16px] bg-ink px-6 font-semibold text-paper">
            Open camera
          </Link>
        </>
      )}
    </main>
  );
}
