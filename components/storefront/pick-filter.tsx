"use client";

import { useState } from "react";
import { CATEGORIES, type Category } from "@/lib/categories";
import { CategoryIcon } from "@/components/icons/category-icon";

/**
 * Client-side category filter for a storefront's picks. Filtering in the browser keeps the page
 * itself cacheable (it's the page hosts' QR codes point at).
 */
export function PickFilter({ items }: { items: { key: string; category: Category; node: React.ReactNode }[] }) {
  const [active, setActive] = useState<Category | null>(null);
  const present = CATEGORIES.filter((c) => items.some((i) => i.category === c.value));
  const shown = active ? items.filter((i) => i.category === active) : items;

  const chip = (on: boolean) =>
    `inline-flex flex-none cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors ${
      on ? "border-green bg-green text-green-ink" : "border-line bg-surface text-ink hover:border-green"
    }`;

  return (
    <>
      {present.length > 1 && (
        <div
          role="group"
          aria-label="Filter by category"
          className="-mr-(--gutter) mb-4 flex gap-2 overflow-x-auto pr-(--gutter) [scrollbar-width:none] sm:mr-0 sm:flex-wrap sm:pr-0"
        >
          <button type="button" aria-pressed={active === null} onClick={() => setActive(null)} className={chip(active === null)}>
            All picks
          </button>
          {present.map((c) => (
            <button
              key={c.value}
              type="button"
              aria-pressed={active === c.value}
              onClick={() => setActive(active === c.value ? null : c.value)}
              className={chip(active === c.value)}
            >
              <CategoryIcon category={c.value} size={16} />
              {c.label}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4">
        {shown.map((i) => (
          <div key={i.key} className="contents">
            {i.node}
          </div>
        ))}
      </div>
    </>
  );
}
