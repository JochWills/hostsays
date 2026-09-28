import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getAllOperatorsForAdmin } from "@/lib/data/portal";
import { AccountActions } from "@/components/portal/admin-buttons";
import { PageHeading, StatusPill } from "@/components/portal/ui";
import { panel } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Operators", robots: { index: false, follow: false } };

export default async function AdminOperators() {
  await requireRole("admin", "/admin/operators");
  const operators = await getAllOperatorsForAdmin();
  return (
    <>
      <PageHeading title="Operators" intro={`${operators.length} in total. Demo operators are placeholders from the seed data.`} />
      <ul className="space-y-3">
        {operators.map((o) => (
          <li key={o.id} className={`${panel} flex flex-wrap items-center gap-x-4 gap-y-3`}>
            <div className="min-w-0 flex-1 basis-[260px]">
              <p className="font-bold">
                {o.status === "verified" ? (
                  <Link href={`/o/${o.slug}`} className="hover:underline">
                    {o.name}
                  </Link>
                ) : (
                  o.name
                )}
                {o.is_demo && <span className="ml-2 rounded-full bg-panel px-2 py-0.5 text-[12px] font-semibold text-muted">Demo</span>}
              </p>
              <p className="text-[14px] break-words text-muted">
                {o.areas?.name ?? "No area"} · {o.experiences.filter((e) => e.status === "live").length} live of {o.experiences.length} experiences
                {o.operator_private && ` · ${o.operator_private.contact_email}`}
              </p>
            </div>
            <StatusPill status={o.status} />
            <AccountActions kind="operator" id={o.id} name={o.name} status={o.status} />
          </li>
        ))}
      </ul>
    </>
  );
}
