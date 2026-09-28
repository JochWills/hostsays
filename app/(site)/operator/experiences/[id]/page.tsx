import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requireOperator } from "@/lib/portal";
import { getExperienceForEdit } from "@/lib/data/portal";
import { getAllAreas } from "@/lib/data/public";
import { firstValues } from "@/lib/validation/explore";
import {
  addBlackout,
  addSlots,
  deleteBlackout,
  deleteDraft,
  deletePhoto,
  deleteSlot,
  saveExperience,
  setCoverPhoto,
  submitForReview,
  uploadPhoto,
} from "../../actions";
import { ExperienceEditor } from "@/components/portal/experience-editor";
import { ConfirmButton } from "@/components/portal/form";
import { Notice, PageHeading, StatusPill } from "@/components/portal/ui";
import { btnPrimary, btnSecondary, panel } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Edit experience", robots: { index: false, follow: false } };

export default async function EditExperience({ params, searchParams }: PageProps<"/operator/experiences/[id]">) {
  const { id } = await params;
  await requireOperator(`/operator/experiences/${id}`);
  const [exp, areas, sp] = await Promise.all([getExperienceForEdit(id), getAllAreas(), searchParams.then(firstValues)]);
  if (!exp) notFound();

  const editable = exp.status === "draft" || exp.status === "rejected";
  const photos = exp.experience_photos;
  const slots = exp.experience_slots;
  const ready = photos.length > 0 && slots.length > 0;

  return (
    <>
      <Link href="/operator/experiences" className="text-[14px] font-semibold text-green hover:underline">
        &larr; All experiences
      </Link>
      <div className="mt-3" />
      <PageHeading
        title={exp.title}
        intro={
          <span className="flex flex-wrap items-center gap-2">
            <StatusPill status={exp.status} />
            {exp.status === "live" && (
              <Link href={`/x/${exp.slug}`} className="inline-flex items-center gap-1 font-semibold text-green hover:underline">
                View on the site <ExternalLink size={14} aria-hidden="true" />
              </Link>
            )}
          </span>
        }
      />

      {sp.created && <Notice>Saved as a draft. Now add photos and the days and times you run it, then submit it for review.</Notice>}
      {sp.submitted && <Notice>Submitted. We&rsquo;ll review it, usually within two working days, and email you.</Notice>}
      {sp.error === "incomplete" && <Notice tone="warn">Add at least one photo and one weekly time before submitting.</Notice>}
      {exp.status === "rejected" && <Notice tone="warn">This listing needs changes before it can go live. Check our email, update it and submit again.</Notice>}
      {exp.status === "pending_review" && <Notice>This listing is being reviewed. Its details and photos are locked until then.</Notice>}
      {exp.status === "live" && (
        <Notice>
          This listing is live, so details and photos are locked. Email us to change them. You can still change your times
          and close dates below.
        </Notice>
      )}

      {editable && (
        <section className={`${panel} mb-6 flex flex-wrap items-center justify-between gap-4`}>
          <div className="min-w-0 text-[15px]">
            <p className="font-bold">{ready ? "Ready to submit" : "Almost there"}</p>
            <p className="text-muted">
              {ready ? "Submit it and we'll check it before it goes live." : `Still needed: ${[!photos.length && "a photo", !slots.length && "a weekly time"].filter(Boolean).join(" and ")}.`}
            </p>
          </div>
          <form action={submitForReview}>
            <input type="hidden" name="id" value={exp.id} />
            <button type="submit" disabled={!ready} className={btnPrimary}>
              Submit for review
            </button>
          </form>
        </section>
      )}

      <ExperienceEditor
        exp={exp}
        areas={areas}
        lockedNote={editable ? undefined : `Locked while ${exp.status === "live" ? "live" : "in review"}. Email us to make changes.`}
        actions={{
          saveDetails: saveExperience.bind(null, exp.id),
          uploadPhoto: uploadPhoto.bind(null, exp.id),
          deletePhoto,
          setCoverPhoto,
          addSlots: addSlots.bind(null, exp.id),
          deleteSlot,
          addBlackout: addBlackout.bind(null, exp.id),
          deleteBlackout,
        }}
      />

      {exp.status === "draft" && (
        <form action={deleteDraft} className="text-right">
          <input type="hidden" name="id" value={exp.id} />
          <ConfirmButton message="Delete this draft and its photos? This can't be undone." className={`${btnSecondary} text-danger`}>
            Delete this draft
          </ConfirmButton>
        </form>
      )}
    </>
  );
}
