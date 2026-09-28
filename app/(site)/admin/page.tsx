import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { getPendingApplications } from "@/lib/data/portal";
import { HOST_TYPES } from "@/lib/validation/auth";
import { PortalPlaceholder } from "@/components/site/portal-placeholder";
import { btnPrimary, btnSecondary, sectionTitle } from "@/components/ui/styles";
import { decideApplication } from "./actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

const hostTypeLabel = (value: string) => HOST_TYPES.find((t) => t.value === value)?.label ?? value;
const applied = (iso: string) =>
  new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", timeZone: "Africa/Johannesburg" }).format(new Date(iso));

function Decide({ kind, id, name }: { kind: "host" | "operator"; id: string; name: string }) {
  return (
    <form action={decideApplication} className="mt-4 flex flex-wrap gap-2.5">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <button type="submit" name="verdict" value="verified" className={btnPrimary} aria-label={`Verify ${name}`}>
        Verify
      </button>
      <button type="submit" name="verdict" value="rejected" className={btnSecondary} aria-label={`Reject ${name}`}>
        Reject
      </button>
    </form>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-[14px]">
      <dt className="w-[76px] shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

export default async function AdminHome() {
  const user = await requireRole("admin", "/admin");
  const { hosts, operators } = await getPendingApplications();
  const link = "font-semibold text-green hover:underline";

  return (
    <PortalPlaceholder user={user} title="Admin">
      <h2 className={sectionTitle}>Waiting for verification</h2>
      <p className="mt-1 text-muted">
        Check each one is real (open their listing or website) before verifying. Verified hosts and operators appear on
        the site.
      </p>

      <h3 className="mt-6 font-bold">Hosts ({hosts.length})</h3>
      {hosts.length === 0 && <p className="mt-1 text-muted">None right now.</p>}
      <ul className="mt-2 space-y-4">
        {hosts.map((h) => (
          <li key={h.id} className="rounded-[10px] border border-line p-4">
            <p className="font-bold">
              {h.name} <span className="font-normal text-muted">· {hostTypeLabel(h.type)}</span>
            </p>
            <dl className="mt-2 space-y-1">
              <Detail label="Area">{h.area ?? "—"}</Detail>
              <Detail label="Listing">
                <a href={h.listingUrl} target="_blank" rel="noopener noreferrer nofollow" className={link}>
                  {h.listingUrl}
                </a>
              </Detail>
              <Detail label="Contact">
                {h.contactName ?? "—"} · <a href={`mailto:${h.email}`} className={link}>{h.email}</a>
                {h.phone && <> · {h.phone}</>}
              </Detail>
              <Detail label="Applied">{applied(h.createdAt)}</Detail>
            </dl>
            <Decide kind="host" id={h.id} name={h.name} />
          </li>
        ))}
      </ul>

      <h3 className="mt-8 font-bold">Operators ({operators.length})</h3>
      {operators.length === 0 && <p className="mt-1 text-muted">None right now.</p>}
      <ul className="mt-2 space-y-4">
        {operators.map((o) => (
          <li key={o.id} className="rounded-[10px] border border-line p-4">
            <p className="font-bold">{o.name}</p>
            <dl className="mt-2 space-y-1">
              <Detail label="Area">{o.area ?? "—"}</Detail>
              <Detail label="Website">
                {o.website ? (
                  <a href={o.website} target="_blank" rel="noopener noreferrer nofollow" className={link}>
                    {o.website}
                  </a>
                ) : (
                  "—"
                )}
              </Detail>
              <Detail label="Contact">
                {o.contactName ?? "—"} · <a href={`mailto:${o.email}`} className={link}>{o.email}</a>
                {o.phone && <> · {o.phone}</>}
              </Detail>
              <Detail label="Applied">{applied(o.createdAt)}</Detail>
            </dl>
            <Decide kind="operator" id={o.id} name={o.name} />
          </li>
        ))}
      </ul>

      <p className="mt-8 text-[14px] text-muted">More admin tools (bookings, payouts, content) arrive in Phase 7.</p>
    </PortalPlaceholder>
  );
}
