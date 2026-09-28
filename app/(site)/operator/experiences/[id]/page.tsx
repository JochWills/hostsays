import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { requireOperator } from "@/lib/portal";
import { getExperienceForEdit } from "@/lib/data/portal";
import { getAllAreas } from "@/lib/data/public";
import { formatDate, formatTime } from "@/lib/format";
import { WEEKDAYS, WEEKDAY_ORDER, minBookableDate } from "@/lib/dates";
import { publicImageUrl } from "@/lib/storage";
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
import { ExperienceForm } from "@/components/portal/experience-form";
import { ActionForm, ConfirmButton, FileField, Row, TextField, WeekdayPicker } from "@/components/portal/form";
import { Notice, PageHeading, StatusPill } from "@/components/portal/ui";
import { btnPrimary, btnSecondary, panel, sectionTitle } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Edit experience", robots: { index: false, follow: false } };

const iconBtn = "grid size-9 cursor-pointer place-items-center rounded-[10px] text-muted hover:bg-panel hover:text-danger";

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

      {/* Photos */}
      <section className={`${panel} mb-6`}>
        <h2 className={sectionTitle}>Photos</h2>
        <p className="mt-1 mb-4 text-[14px] text-muted">The first photo is the cover. Bright, real photos of guests enjoying it work best.</p>
        {photos.length > 0 && (
          <ul className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((p, i) => (
              <li key={p.id} className="overflow-hidden rounded-[10px] border border-line">
                <div className="relative aspect-[4/3] bg-panel">
                  <Image src={publicImageUrl("experience-photos", p.path)} alt={p.alt} fill sizes="(min-width: 980px) 240px, 45vw" className="object-cover" />
                  {i === 0 && <span className="absolute top-2 left-2 rounded-full bg-[var(--pill)] px-2.5 py-0.5 text-[12px] font-semibold text-white">Cover</span>}
                </div>
                {editable && (
                  <div className="flex items-center justify-between gap-2 p-1.5">
                    {i > 0 ? (
                      <form action={setCoverPhoto}>
                        <input type="hidden" name="experienceId" value={exp.id} />
                        <input type="hidden" name="photoId" value={p.id} />
                        <button type="submit" className="cursor-pointer rounded-[8px] px-2 py-1.5 text-[13px] font-semibold text-green hover:bg-panel">
                          Make cover
                        </button>
                      </form>
                    ) : (
                      <span />
                    )}
                    <form action={deletePhoto}>
                      <input type="hidden" name="experienceId" value={exp.id} />
                      <input type="hidden" name="photoId" value={p.id} />
                      <button type="submit" className={iconBtn} aria-label={`Remove photo ${i + 1}`}>
                        <Trash2 size={17} aria-hidden="true" />
                      </button>
                    </form>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {editable && (
          <ActionForm action={uploadPhoto.bind(null, exp.id)} submitLabel="Upload photo" pendingLabel="Uploading…">
            <Row>
              <FileField name="photo" label="Add a photo" accept="image/jpeg,image/png,image/webp" hint="JPG, PNG or WebP, up to 5 MB." />
              <TextField name="alt" label="Describe the photo (optional)" hint="Helps people using screen readers, e.g. Elephants at a waterhole" />
            </Row>
          </ActionForm>
        )}
      </section>

      {/* Weekly times */}
      <section className={`${panel} mb-6`}>
        <h2 className={sectionTitle}>Days and times</h2>
        <p className="mt-1 mb-4 text-[14px] text-muted">
          When you run this every week, and how many people fit each time. Guests can only request these times.
        </p>
        {slots.length > 0 ? (
          <ul className="mb-5 divide-y divide-line rounded-[10px] border border-line">
            {WEEKDAY_ORDER.flatMap((day) =>
              slots
                .filter((s) => s.weekday === day)
                .map((s) => (
                  <li key={s.id} className="flex items-center gap-3 px-3.5 py-2 text-[15px]">
                    <span className="w-[100px] font-semibold">{WEEKDAYS[day]}</span>
                    <span className="flex-1">
                      {formatTime(s.start_time)} <span className="text-muted">· up to {s.capacity} people</span>
                    </span>
                    <form action={deleteSlot}>
                      <input type="hidden" name="experienceId" value={exp.id} />
                      <input type="hidden" name="slotId" value={s.id} />
                      <button type="submit" className={iconBtn} aria-label={`Remove ${WEEKDAYS[day]} ${formatTime(s.start_time)}`}>
                        <Trash2 size={17} aria-hidden="true" />
                      </button>
                    </form>
                  </li>
                )),
            )}
          </ul>
        ) : (
          <p className="mb-4 rounded-[10px] bg-panel px-4 py-3 text-[14px]">No times yet.</p>
        )}
        <ActionForm action={addSlots.bind(null, exp.id)} submitLabel="Add time">
          <WeekdayPicker name="weekdays" label="Days" />
          <Row>
            <TextField name="startTime" label="Start time" type="time" defaultValue="09:00" />
            <TextField name="capacity" label="People per time" inputMode="numeric" defaultValue={exp.max_people} />
          </Row>
        </ActionForm>
      </section>

      {/* Closed dates */}
      <section className={`${panel} mb-6`}>
        <h2 className={sectionTitle}>Closed dates</h2>
        <p className="mt-1 mb-4 text-[14px] text-muted">Days you&rsquo;re not running this, like holidays or when you&rsquo;re fully booked.</p>
        {exp.experience_blackouts.length > 0 && (
          <ul className="mb-5 divide-y divide-line rounded-[10px] border border-line">
            {exp.experience_blackouts.map((b) => (
              <li key={b.date} className="flex items-center gap-3 px-3.5 py-2 text-[15px]">
                <span className="flex-1">
                  <span className="font-semibold">{formatDate(b.date)}</span>
                  {b.reason && <span className="text-muted"> · {b.reason}</span>}
                </span>
                <form action={deleteBlackout}>
                  <input type="hidden" name="experienceId" value={exp.id} />
                  <input type="hidden" name="date" value={b.date} />
                  <button type="submit" className={iconBtn} aria-label={`Reopen ${formatDate(b.date)}`}>
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <ActionForm action={addBlackout.bind(null, exp.id)} submitLabel="Close this date">
          <Row>
            <TextField name="date" label="Date" type="date" defaultValue={minBookableDate()} />
            <TextField name="reason" label="Note (optional, only you see it)" placeholder="e.g. Public holiday" />
          </Row>
        </ActionForm>
      </section>

      {/* Details */}
      <section className={`${panel} mb-6`}>
        {editable ? (
          <ExperienceForm action={saveExperience.bind(null, exp.id)} areas={areas} experience={exp} submitLabel="Save details" />
        ) : (
          <>
            <h2 className={sectionTitle}>Details</h2>
            <p className="mt-1 text-[14px] text-muted">Locked while {exp.status === "live" ? "live" : "in review"}. Email us to make changes.</p>
          </>
        )}
      </section>

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
