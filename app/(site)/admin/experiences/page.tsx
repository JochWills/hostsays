import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getAllExperiencesForAdmin } from "@/lib/data/portal";
import { formatRand } from "@/lib/format";
import { firstValues } from "@/lib/validation/explore";
import { ListingActions } from "@/components/portal/admin-buttons";
import { Notice, PageHeading, StatusPill } from "@/components/portal/ui";
import { btnSecondary, panel } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Experiences", robots: { index: false, follow: false } };

const FILTERS = [
  { value: "", label: "All" },
  { value: "pending_review", label: "In review" },
  { value: "live", label: "Live" },
  { value: "draft", label: "Drafts" },
  { value: "paused", label: "Paused" },
  { value: "rejected", label: "Sent back" },
];

export default async function AdminExperiences({ searchParams }: PageProps<"/admin/experiences">) {
  await requireRole("admin", "/admin/experiences");
  const [all, sp] = await Promise.all([getAllExperiencesForAdmin(), searchParams.then(firstValues)]);
  const status = FILTERS.find((f) => f.value === sp.status)?.value ?? "";
  const rows = status ? all.filter((e) => e.status === status) : all;
  const chip = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-[14px] font-semibold ${active ? "border-green bg-green text-green-ink" : "border-line bg-surface hover:border-green"}`;

  return (
    <>
      <PageHeading title="Experiences" intro={`${all.length} in total.`} />
      {sp.deleted && <Notice>Deleted {sp.deleted}.</Notice>}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link key={f.value} href={f.value ? `/admin/experiences?status=${f.value}` : "/admin/experiences"} className={chip(f.value === status)}>
            {f.label} ({f.value ? all.filter((e) => e.status === f.value).length : all.length})
          </Link>
        ))}
      </div>
      <ul className="space-y-3">
        {rows.map((e) => (
          <li key={e.id} className={`${panel} flex flex-wrap items-center gap-x-4 gap-y-3`}>
            <div className="min-w-0 flex-1 basis-[260px]">
              <p className="font-bold">
                <Link href={`/admin/experiences/${e.id}`} className="hover:underline">
                  {e.title}
                </Link>
              </p>
              <p className="text-[14px] text-muted">
                {e.operators?.name} · {e.areas?.name} · {formatRand(e.price_cents)} {e.is_group_price ? "per group" : "pp"} ·{" "}
                {e.recommendations.length} host picks
              </p>
            </div>
            <StatusPill status={e.status} />
            <Link href={`/admin/experiences/${e.id}`} className={`${btnSecondary} !px-3.5 !py-2 !text-[13.5px]`}>
              Edit
            </Link>
            <ListingActions id={e.id} title={e.title} status={e.status} />
          </li>
        ))}
        {rows.length === 0 && <li className="text-muted">None.</li>}
      </ul>
    </>
  );
}
