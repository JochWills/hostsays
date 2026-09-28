/** Shown the moment a dashboard link is clicked, while the page loads (portal loading.tsx files). */
export function PageSkeleton() {
  const bar = "animate-pulse rounded-[10px] bg-panel";
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className={`${bar} h-9 w-56`} />
      <div className={`${bar} mt-3 h-4 w-full max-w-[420px]`} />
      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[104px] animate-pulse rounded-[14px] bg-surface shadow-card" />
        ))}
      </div>
      <div className="mt-6 h-[260px] animate-pulse rounded-[14px] bg-surface shadow-card" />
    </div>
  );
}
