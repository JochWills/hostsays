import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getPendingApplications, getPendingListings } from "@/lib/data/portal";
import { HOST_TYPES } from "@/lib/validation/auth";
import { formatRand } from "@/lib/format";
import { AccountActions, ListingActions } from "@/components/portal/admin-buttons";
import { PageHeading } from "@/components/portal/ui";
import { panel, sectionTitle } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Approvals", robots: { index: false, follow: false } };

const hostTypeLabel = (value: string) => HOST_TYPES.find((t) => t.value === value)?.label ?? value;
const applied = (iso: string) =>
  new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", timeZone: "Africa/Johannesburg" }).format(new Date(iso));
const link = "font-semibold text-green hover:underline";

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-[14px]">
      <dt className="w-[76px] shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

function Empty() {
  return <p className="mt-2 text-[15px] text-muted">Nothing waiting.</p>;
}

export default async function AdminApprovals() {
  await requireRole("admin", "/admin/approvals");
  const [{ hosts, operators }, listings] = await Promise.all([getPendingApplications(), getPendingListings()]);

  return (
    <>
      <PageHeading title="Approvals" intro="Check each one is real before approving. Approved hosts, operators and listings appear on the site straight away." />

      <section className="mb-8">
        <h2 className={sectionTitle}>Listings ({listings.length})</h2>
        {listings.length === 0 && <Empty />}
        <ul className="mt-3 space-y-3">
          {listings.map((l) => (
            <li key={l.id} className={panel}>
              <p className="font-bold">{l.title}</p>
              <dl className="mt-2 space-y-1">
                <Detail label="Operator">{l.operatorName}</Detail>
                <Detail label="Area">{l.areaName}</Detail>
                <Detail label="Price">{formatRand(l.priceCents)} {l.isGroupPrice ? "per group" : "per person"}</Detail>
                <Detail label="Has">{l.photoCount} photos · {l.slotCount} weekly times</Detail>
                <Detail label="Sent">{applied(l.updatedAt)}</Detail>
              </dl>
              <p className="mt-3 text-[14px]">
                <Link href={`/admin/experiences/${l.id}`} className={link}>
                  Read or edit the full listing
                </Link>
              </p>
              <div className="mt-3">
                <ListingActions id={l.id} title={l.title} status="pending_review" />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className={sectionTitle}>Hosts ({hosts.length})</h2>
        {hosts.length === 0 && <Empty />}
        <ul className="mt-3 space-y-3">
          {hosts.map((h) => (
            <li key={h.id} className={panel}>
              <p className="font-bold">
                <Link href={`/admin/hosts/${h.id}`} className="hover:underline">
                  {h.name}
                </Link>{" "}
                <span className="font-normal text-muted">· {hostTypeLabel(h.type)}</span>
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
              <div className="mt-3">
                <AccountActions kind="host" id={h.id} name={h.name} status="pending" />
              </div>
              <p className="mt-2 text-[14px]">
                <Link href={`/admin/hosts/${h.id}`} className={link}>
                  Edit their details
                </Link>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className={sectionTitle}>Operators ({operators.length})</h2>
        {operators.length === 0 && <Empty />}
        <ul className="mt-3 space-y-3">
          {operators.map((o) => (
            <li key={o.id} className={panel}>
              <p className="font-bold">
                <Link href={`/admin/operators/${o.id}`} className="hover:underline">
                  {o.name}
                </Link>
              </p>
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
              <div className="mt-3">
                <AccountActions kind="operator" id={o.id} name={o.name} status="pending" />
              </div>
              <p className="mt-2 text-[14px]">
                <Link href={`/admin/operators/${o.id}`} className={link}>
                  Edit their details
                </Link>
              </p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
