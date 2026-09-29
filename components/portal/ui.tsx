import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { btnSecondary, panel, pageTitle } from "@/components/ui/styles";

/** Page title row inside a portal, with optional actions on the right. */
export function PageHeading({ title, intro, actions }: { title: string; intro?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 max-w-[640px]">
        <h1 className={pageTitle}>{title}</h1>
        {intro && <p className="mt-2 text-[15px] text-muted">{intro}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, note, href }: { label: string; value: React.ReactNode; note?: string; href?: string }) {
  const body = (
    <>
      <p className="text-[13px] font-semibold text-muted">{label}</p>
      <p className="mt-1 text-[28px] leading-none font-extrabold tracking-[-0.02em]">{value}</p>
      {note && <p className="mt-2 text-[13px] text-muted">{note}</p>}
    </>
  );
  return href ? (
    <Link href={href} className={`${panel} block border border-transparent hover:border-green`}>
      {body}
    </Link>
  ) : (
    <div className={panel}>{body}</div>
  );
}

/** For sections that arrive with bookings (Phase 4+): say so plainly instead of showing an empty table. */
export function ComingSoon({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div className={`${panel} flex flex-col items-start gap-3 text-[15px]`}>
      <span className="grid size-11 place-items-center rounded-full bg-green/10 text-green">
        <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <h2 className="text-[18px] font-bold">{title}</h2>
      <div className="max-w-[560px] space-y-2 text-muted">{children}</div>
      {action && (
        <Link href={action.href} className={`${btnSecondary} mt-1`}>
          {action.label}
        </Link>
      )}
    </div>
  );
}

/** Checklist item on overview pages. */
export function Step({ done, title, href, children }: { done: boolean; title: string; href?: string; children?: React.ReactNode }) {
  return (
    <li className="flex gap-3 py-3">
      <span
        aria-hidden="true"
        className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[13px] font-bold ${
          done ? "bg-green text-green-ink" : "border-2 border-line"
        }`}
      >
        {done ? "✓" : ""}
      </span>
      <div className="min-w-0">
        <p className={`font-semibold ${done ? "text-muted line-through" : ""}`}>
          {href && !done ? (
            <Link href={href} className="text-green hover:underline">
              {title}
            </Link>
          ) : (
            title
          )}
          <span className="sr-only">{done ? " (done)" : " (to do)"}</span>
        </p>
        {children && !done && <p className="mt-0.5 text-[14px] text-muted">{children}</p>}
      </div>
    </li>
  );
}

/** Status pill for listings and accounts. */
export function StatusPill({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    draft: ["Draft", "bg-panel text-ink"],
    pending_review: ["In review", "bg-gold/15 text-ink border border-gold/50"],
    live: ["Live", "bg-green/10 text-green"],
    paused: ["Paused", "bg-panel text-muted"],
    rejected: ["Needs changes", "bg-danger/10 text-danger"],
    pending: ["Pending", "bg-gold/15 text-ink border border-gold/50"],
    verified: ["Verified", "bg-green/10 text-green"],
    suspended: ["Suspended", "bg-danger/10 text-danger"],
    showing: ["On the site", "bg-green/10 text-green"],
    hidden: ["Hidden: nothing live yet", "bg-panel text-muted"],
  };
  const [label, cls] = map[status] ?? [status, "bg-panel text-ink"];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold whitespace-nowrap ${cls}`}>{label}</span>;
}

/** Small green/amber notice. */
export function Notice({ tone = "info", children }: { tone?: "info" | "warn"; children: React.ReactNode }) {
  return (
    <div
      role="status"
      className={`mb-5 rounded-[10px] px-4 py-3 text-[14px] ${
        tone === "warn" ? "border border-gold/50 bg-gold/10" : "bg-green/10"
      }`}
    >
      {children}
    </div>
  );
}
