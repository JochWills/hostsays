import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { firstValues } from "@/lib/validation/explore";
import { getAllOperatorsForAdmin } from "@/lib/data/portal";
import { AccountActions } from "@/components/portal/admin-buttons";
import { Notice, PageHeading, StatusPill } from "@/components/portal/ui";
import { btnSecondary, panel } from "@/components/ui/styles";

const small = "!px-3.5 !py-2 !text-[13.5px]";

export const metadata: Metadata = { title: "Operators", robots: { index: false, follow: false } };

export default async function AdminOperators({ searchParams }: PageProps<"/admin/operators">) {
  const sp = await searchParams.then(firstValues);
  await requireRole("admin", "/admin/operators");
  const operators = await getAllOperatorsForAdmin();
  return (
    <>
      <PageHeading title="Operators" intro={`${operators.length} in total. Demo operators are placeholders from the seed data.`} />
      {sp.deleted && <Notice>Deleted {sp.deleted}.</Notice>}
      <ul className="space-y-3">
        {operators.map((o) => (
          <li key={o.id} className={`${panel} flex flex-wrap items-center gap-x-4 gap-y-3`}>
            <div className="min-w-0 flex-1 basis-[260px]">
              <p className="font-bold">
                <Link href={`/admin/operators/${o.id}`} className="hover:underline">
                  {o.name}
                </Link>
                {o.is_demo && <span className="ml-2 rounded-full bg-panel px-2 py-0.5 text-[12px] font-semibold text-muted">Demo</span>}
              </p>
              <p className="text-[14px] break-words text-muted">
                {o.areas?.name ?? "No area"} · {o.experiences.filter((e) => e.status === "live").length} live of {o.experiences.length} experiences
                {o.operator_private && ` · ${o.operator_private.contact_email}`}
              </p>
            </div>
            <StatusPill status={o.status} />
            <Link href={`/admin/operators/${o.id}`} className={`${btnSecondary} ${small}`}>
              Edit
            </Link>
            <AccountActions kind="operator" id={o.id} name={o.name} status={o.status} />
          </li>
        ))}
      </ul>
    </>
  );
}
