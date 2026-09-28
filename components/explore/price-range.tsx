"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRand } from "@/lib/format";

/**
 * Two-handle price slider (rands). Moving a handle updates the label; letting go reloads the results with
 * ?min= and ?max= (the top end means "no maximum"). Other filters are kept.
 */
export function PriceRange({
  min,
  max,
  limit,
  step,
  params,
}: {
  min?: number;
  max?: number;
  limit: number;
  step: number;
  /** The current query string without min/max. */
  params: Record<string, string>;
}) {
  const router = useRouter();
  const [lo, setLo] = useState(min ?? 0);
  const [hi, setHi] = useState(Math.min(max ?? limit, limit));

  const apply = (nextLo = lo, nextHi = hi) => {
    const q = new URLSearchParams(params);
    if (nextLo > 0) q.set("min", String(nextLo));
    if (nextHi < limit) q.set("max", String(nextHi));
    router.push(`/explore${q.size ? `?${q}` : ""}`, { scroll: false });
  };
  const pct = (v: number) => `${(v / limit) * 100}%`;
  const thumb =
    "pointer-events-none absolute inset-x-0 top-1/2 h-0 w-full -translate-y-1/2 appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-[18px] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-green [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-[18px] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_var(--surface)]";

  return (
    <div>
      <p className="text-[14.5px]" aria-live="polite">
        {formatRand(lo * 100)} – {hi >= limit ? `${formatRand(limit * 100)}+` : formatRand(hi * 100)}
      </p>
      <div className="relative mt-4 h-5">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-line" />
        <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-green" style={{ left: pct(lo), right: `calc(100% - ${pct(hi)})` }} />
        <input
          type="range"
          aria-label="Lowest price"
          min={0}
          max={limit}
          step={step}
          value={lo}
          onChange={(e) => setLo(Math.min(Number(e.target.value), hi - step))}
          onPointerUp={() => apply()}
          onKeyUp={() => apply()}
          className={thumb}
        />
        <input
          type="range"
          aria-label="Highest price"
          min={0}
          max={limit}
          step={step}
          value={hi}
          onChange={(e) => setHi(Math.max(Number(e.target.value), lo + step))}
          onPointerUp={() => apply()}
          onKeyUp={() => apply()}
          className={thumb}
        />
      </div>
    </div>
  );
}
