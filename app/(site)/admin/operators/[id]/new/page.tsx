import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAllAreas } from "@/lib/data/public";
import { adminCreateExperience } from "../../../edit-actions";
import { ExperienceForm } from "@/components/portal/experience-form";
import { PageHeading } from "@/components/portal/ui";
import { panel } from "@/components/ui/styles";

export const metadata: Metadata = { title: "New experience", robots: { index: false, follow: false } };

export default async function AdminNewExperience({ params }: PageProps<"/admin/operators/[id]/new">) {
  const { id } = await params;
  await requireRole("admin", `/admin/operators/${id}/new`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ data: operator }, areas] = await Promise.all([
    createAdminClient().from("operators").select("id, name, area_id").eq("id", id).maybeSingle(),
    getAllAreas(),
  ]);
  if (!operator) notFound();

  return (
    <>
      <Link href={`/admin/operators/${operator.id}`} className="text-[14px] font-semibold text-green hover:underline">
        &larr; {operator.name}
      </Link>
      <div className="mt-3" />
      <PageHeading
        title="New experience"
        intro={`For ${operator.name}. It starts as a draft: add photos and times next, then approve it to put it live.`}
      />
      <div className={panel}>
        <ExperienceForm
          action={adminCreateExperience.bind(null, operator.id)}
          areas={areas}
          defaultAreaId={operator.area_id ?? undefined}
          submitLabel="Save and continue"
        />
      </div>
    </>
  );
}
