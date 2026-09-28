import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getExperienceForEdit } from "@/lib/data/portal";
import { getAllAreas } from "@/lib/data/public";
import { firstValues } from "@/lib/validation/explore";
import {
  adminAddBlackout,
  adminAddSlots,
  adminDeleteBlackout,
  adminDeleteExperience,
  adminDeletePhoto,
  adminDeleteSlot,
  adminSaveExperience,
  adminSetCoverPhoto,
  adminUploadPhoto,
} from "../../edit-actions";
import { ListingActions } from "@/components/portal/admin-buttons";
import { ExperienceEditor } from "@/components/portal/experience-editor";
import { ConfirmButton } from "@/components/portal/form";
import { Notice, PageHeading, StatusPill } from "@/components/portal/ui";
import { btnSecondary } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Edit experience", robots: { index: false, follow: false } };

export default async function AdminExperience({ params, searchParams }: PageProps<"/admin/experiences/[id]">) {
  const { id } = await params;
  await requireRole("admin", `/admin/experiences/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [e, areas, sp] = await Promise.all([getExperienceForEdit(id, { asAdmin: true }), getAllAreas(), searchParams.then(firstValues)]);
  if (!e) notFound();
  const op = e.operators;

  return (
    <>
      <Link href="/admin/experiences" className="text-[14px] font-semibold text-green hover:underline">
        &larr; All experiences
      </Link>
      <div className="mt-3" />
      <PageHeading
        title={e.title}
        intro={
          <span className="flex flex-wrap items-center gap-2">
            <StatusPill status={e.status} />
            {op && (
              <span>
                by{" "}
                <Link href={`/admin/operators/${op.id}`} className="font-semibold text-green hover:underline">
                  {op.name}
                </Link>{" "}
                ({op.status})
              </span>
            )}
            {e.status === "live" && (
              <Link href={`/x/${e.slug}`} className="inline-flex items-center gap-1 font-semibold text-green hover:underline">
                View on the site <ExternalLink size={14} aria-hidden="true" />
              </Link>
            )}
          </span>
        }
        actions={<ListingActions id={e.id} title={e.title} status={e.status} />}
      />

      {sp.created && <Notice>Saved as a draft for {op?.name}. Add photos and weekly times, then approve it to put it live.</Notice>}
      {e.status === "live" && <Notice>This listing is live: anything you save here shows on the site straight away.</Notice>}
      {sp.error === "incomplete" && <Notice tone="warn">Add at least one photo and one weekly time before putting it live.</Notice>}
      {e.status === "draft" && <Notice>This is still a draft. The operator can keep editing it until they submit it for review.</Notice>}

      <ExperienceEditor
        exp={e}
        areas={areas}
        actions={{
          saveDetails: adminSaveExperience.bind(null, e.id),
          uploadPhoto: adminUploadPhoto.bind(null, e.id),
          deletePhoto: adminDeletePhoto,
          setCoverPhoto: adminSetCoverPhoto,
          addSlots: adminAddSlots.bind(null, e.id),
          deleteSlot: adminDeleteSlot,
          addBlackout: adminAddBlackout.bind(null, e.id),
          deleteBlackout: adminDeleteBlackout,
        }}
      />

      {(e.status === "draft" || e.status === "rejected") && (
        <form action={adminDeleteExperience} className="text-right">
          <input type="hidden" name="id" value={e.id} />
          <ConfirmButton message="Delete this listing and its photos? This can't be undone." className={`${btnSecondary} text-danger`}>
            Delete this listing
          </ConfirmButton>
        </form>
      )}
    </>
  );
}
