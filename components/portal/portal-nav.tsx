"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "./nav";

/** Section links: a scrolling tab row on phones, a sidebar from md up. */
export function PortalNav({ items, badges = {} }: { items: NavItem[]; badges?: Record<string, number> }) {
  const pathname = usePathname();
  const root = items[0].href;
  const isActive = (href: string) => (href === root ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <nav aria-label="Dashboard" className="-mx-[var(--gutter)] overflow-x-auto px-[var(--gutter)] md:mx-0 md:overflow-visible md:px-0">
      <ul className="flex gap-1.5 md:flex-col md:gap-0.5">
        {items.map((item) => {
          const active = isActive(item.href);
          const badge = badges[item.href];
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center justify-between gap-3 rounded-[10px] px-3.5 py-2.5 text-[14.5px] font-medium whitespace-nowrap ${
                  active ? "bg-green text-green-ink" : "bg-surface text-ink hover:bg-panel md:bg-transparent"
                }`}
              >
                {item.label}
                {badge ? (
                  <span
                    className={`min-w-[22px] rounded-full px-1.5 text-center text-[12px] leading-[20px] font-bold ${
                      active ? "bg-green-ink/20" : "bg-gold text-[#1e2723]"
                    }`}
                  >
                    {badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
