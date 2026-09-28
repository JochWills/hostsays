import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getAllHostsForAdmin } from "@/lib/data/portal";
import { formatPercent } from "@/lib/format";
import { AccountActions } from "@/components/portal/admin-buttons";
import { PageHeading, StatusPill } from "@/components/portal/ui";
import { panel } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Hosts", robots: { index: false, follow: false } };

export default async function AdminHosts() {
  await requireRole("admin", "/admin/hosts");
  const hosts = await getAllHostsForAdmin();
  return (
    <>
      <PageHeading title="Hosts" intro={`${hosts.length} in total.`} />
      <ul className="space-y-3">
        {hosts.map((h) => (
          <li key={h.id} className={`${panel} flex flex-wrap items-center gap-x-4 gap-y-3`}>
            <div className="min-w-0 flex-1 basis-[260px]">
              <p className="font-bold">
                {h.status === "verified" ? (
                  <Link href={`/${h.slug}`} className="hover:underline">
                    {h.name}
                  </Link>
                ) : (
                  h.name
                )}
              </p>
              <p className="text-[14px] break-words text-muted">
                {h.areas?.name ?? "No area"} · {h.recommendations.length} picks ·{" "}
                {h.host_private ? `${formatPercent(Number(h.host_private.commission_rate))} · ${h.host_private.contact_email}` : "no contact details"}
              </p>
            </div>
            <StatusPill status={h.status} />
            <AccountActions kind="host" id={h.id} name={h.name} status={h.status} />
          </li>
        ))}
      </ul>
    </>
  );
}
