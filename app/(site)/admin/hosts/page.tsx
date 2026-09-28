import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { firstValues } from "@/lib/validation/explore";
import { getAllHostsForAdmin } from "@/lib/data/portal";
import { formatPercent } from "@/lib/format";
import { AccountActions } from "@/components/portal/admin-buttons";
import { Notice, PageHeading, StatusPill } from "@/components/portal/ui";
import { btnSecondary, panel } from "@/components/ui/styles";

const small = "!px-3.5 !py-2 !text-[13.5px]";

export const metadata: Metadata = { title: "Hosts", robots: { index: false, follow: false } };

export default async function AdminHosts({ searchParams }: PageProps<"/admin/hosts">) {
  const sp = await searchParams.then(firstValues);
  await requireRole("admin", "/admin/hosts");
  const hosts = await getAllHostsForAdmin();
  return (
    <>
      <PageHeading title="Hosts" intro={`${hosts.length} in total.`} />
      {sp.deleted && <Notice>Deleted {sp.deleted}.</Notice>}
      <ul className="space-y-3">
        {hosts.map((h) => (
          <li key={h.id} className={`${panel} flex flex-wrap items-center gap-x-4 gap-y-3`}>
            <div className="min-w-0 flex-1 basis-[260px]">
              <p className="font-bold">
                <Link href={`/admin/hosts/${h.id}`} className="hover:underline">
                  {h.name}
                </Link>
              </p>
              <p className="text-[14px] break-words text-muted">
                {h.areas?.name ?? "No area"} · {h.recommendations.length} picks ·{" "}
                {h.host_private ? `${formatPercent(Number(h.host_private.commission_rate))} · ${h.host_private.contact_email}` : "no contact details"}
              </p>
            </div>
            <StatusPill status={h.status} />
            <Link href={`/admin/hosts/${h.id}`} className={`${btnSecondary} ${small}`}>
              Edit
            </Link>
            <AccountActions kind="host" id={h.id} name={h.name} status={h.status} />
          </li>
        ))}
      </ul>
    </>
  );
}
