"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useMe } from "@/components/site/account-menu";
import { CONFIRM_WINDOW_HOURS } from "@/lib/config";

type Shortcuts = { label: string; title: string; body: string; home: string; links: { href: string; label: string }[] };

const SHORTCUTS: Record<string, Shortcuts> = {
  host: {
    label: "Your HostSays page",
    title: "Keep your picks fresh.",
    body: "Add the experiences you'd send your own guests to, and share your page with them.",
    home: "/host",
    links: [
      { href: "/host/picks", label: "Your picks" },
      { href: "/host/share", label: "Share your page" },
      { href: "/host/earnings", label: "Earnings" },
    ],
  },
  operator: {
    label: "Your listings",
    title: "Keep guests booking.",
    body: `Reply to requests within ${CONFIRM_WINDOW_HOURS} hours, and keep your times up to date so guests can book.`,
    home: "/operator",
    links: [
      { href: "/operator/requests", label: "Requests" },
      { href: "/operator/experiences", label: "Your experiences" },
      { href: "/operator/availability", label: "Availability" },
    ],
  },
  admin: {
    label: "Admin",
    title: "Running HostSays.",
    body: "Check who's waiting for approval and keep the areas tidy.",
    home: "/admin",
    links: [
      { href: "/admin/approvals", label: "Approvals" },
      { href: "/admin/areas", label: "Areas" },
      { href: "/admin/bookings", label: "Bookings" },
    ],
  },
};

/**
 * The homepage "join as a host / list your experience" cards. Hosts, operators and admins already
 * belong, so they get shortcuts into their portal instead. (The page is static; this swaps after load.)
 */
export function PromoSlot({ children }: { children: ReactNode }) {
  const me = useMe();
  const s = me?.signedIn ? SHORTCUTS[me.role] : undefined;
  if (!me?.signedIn || !s) return <>{children}</>;

  const first = me.name.includes("@") ? null : me.name.split(" ")[0];
  return (
    <section className="relative rounded-[14px] bg-panel px-[22px] py-[26px]" aria-labelledby="promo-me">
      <small className="text-[11.5px] font-medium text-muted">{s.label}</small>
      <h3 id="promo-me" className="mt-1.5 mb-3 text-[20px] leading-[1.2] font-bold tracking-[-0.015em]">
        {first ? `Welcome back, ${first}. ` : ""}
        {s.title}
      </h3>
      <p className="mb-[18px] text-[13.5px] leading-[1.45] text-muted">{s.body}</p>
      <ul className="mb-[22px] divide-y divide-line rounded-[12px] bg-surface">
        {s.links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="flex items-center justify-between px-4 py-3 text-[14px] font-semibold hover:text-green">
              {l.label} <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" className="text-muted" />
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href={s.home}
        className="inline-flex items-center gap-2.5 rounded-[14px] bg-green px-[22px] py-[11px] text-[14px] font-semibold whitespace-nowrap text-green-ink hover:brightness-110"
      >
        Go to your dashboard <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
      </Link>
    </section>
  );
}
