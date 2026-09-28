import type { Role } from "@/lib/auth";
import { PORTAL_NAV } from "./nav";
import { PortalNav } from "./portal-nav";

const STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: "Waiting for verification", className: "bg-gold/15 text-ink border border-gold/50" },
  verified: { label: "Verified", className: "bg-green/10 text-green" },
  rejected: { label: "Not verified", className: "bg-danger/10 text-danger" },
  suspended: { label: "Paused", className: "bg-danger/10 text-danger" },
};

/** Frame for every signed-in portal: who you are, the section nav, then the page. */
export function PortalShell({
  role,
  eyebrow,
  title,
  status,
  badges,
  children,
}: {
  role: Role;
  eyebrow: string;
  title: string;
  status?: string | null;
  badges?: Record<string, number>;
  children: React.ReactNode;
}) {
  const s = status ? STATUS[status] : null;
  return (
    <div className="wrap pt-6 pb-16 sm:pt-8">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold tracking-[0.08em] text-muted uppercase">{eyebrow}</p>
          <p className="mt-0.5 truncate text-[20px] font-extrabold tracking-[-0.02em] sm:text-[22px]">{title}</p>
        </div>
        {s && <span className={`mb-0.5 rounded-full px-3 py-1 text-[12.5px] font-semibold ${s.className}`}>{s.label}</span>}
      </div>
      <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-[210px_minmax(0,1fr)] md:gap-10">
        <aside className="min-w-0 md:sticky md:top-6 md:self-start">
          <PortalNav items={PORTAL_NAV[role]} badges={badges} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
