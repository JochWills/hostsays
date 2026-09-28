import Image from "next/image";
import { Trash2 } from "lucide-react";
import type { FormAction } from "@/lib/form-state";
import { formatDate, formatTime } from "@/lib/format";
import { WEEKDAYS, WEEKDAY_ORDER, addDays, minBookableDate } from "@/lib/dates";
import { publicImageUrl } from "@/lib/storage";
import { ExperienceForm, type ExperienceValues } from "./experience-form";
import { ActionForm, DateField, FileField, Row, TextField, TimeField, WeekdayPicker } from "./form";
import { panel, sectionTitle } from "@/components/ui/styles";

const iconBtn = "grid size-9 cursor-pointer place-items-center rounded-[10px] text-muted hover:bg-panel hover:text-danger";

export type EditableExperience = ExperienceValues & {
  id: string;
  experience_photos: { id: string; path: string; alt: string }[];
  experience_slots: { id: string; weekday: number; start_time: string; capacity: number }[];
  experience_blackouts: { date: string; reason: string | null }[];
};

/** Server actions for one experience. The `(prev, form)` ones are already bound to its id. */
export type ExperienceEditActions = {
  saveDetails: FormAction;
  uploadPhoto: FormAction;
  deletePhoto: (form: FormData) => Promise<void>;
  setCoverPhoto: (form: FormData) => Promise<void>;
  addSlots: FormAction;
  deleteSlot: (form: FormData) => Promise<void>;
  addBlackout: FormAction;
  deleteBlackout: (form: FormData) => Promise<void>;
};

/**
 * The photo, weekly times, closed dates and details panels for editing an experience, used by the operator
 * portal and the admin pages. `lockedNote` locks photos and details (times and dates always stay editable).
 */
export function ExperienceEditor({
  exp,
  areas,
  actions,
  lockedNote,
}: {
  exp: EditableExperience;
  areas: { id: string; name: string; province: string }[];
  actions: ExperienceEditActions;
  lockedNote?: string;
}) {
  const editable = !lockedNote;
  const photos = exp.experience_photos;
  const slots = exp.experience_slots;

  return (
    <>
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
                      <form action={actions.setCoverPhoto}>
                        <input type="hidden" name="experienceId" value={exp.id} />
                        <input type="hidden" name="photoId" value={p.id} />
                        <button type="submit" className="cursor-pointer rounded-[8px] px-2 py-1.5 text-[13px] font-semibold text-green hover:bg-panel">
                          Make cover
                        </button>
                      </form>
                    ) : (
                      <span />
                    )}
                    <form action={actions.deletePhoto}>
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
          <ActionForm action={actions.uploadPhoto} submitLabel="Upload photo" pendingLabel="Uploading…">
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
          When this runs every week, and how many people fit each time. Guests can only request these times.
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
                    <form action={actions.deleteSlot}>
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
        <ActionForm action={actions.addSlots} submitLabel="Add time">
          <WeekdayPicker name="weekdays" label="Days" />
          <Row>
            <TimeField name="startTime" label="Start time" defaultValue="09:00" />
            <TextField name="capacity" label="People per time" inputMode="numeric" defaultValue={exp.max_people} />
          </Row>
        </ActionForm>
      </section>

      {/* Closed dates */}
      <section className={`${panel} mb-6`}>
        <h2 className={sectionTitle}>Closed dates</h2>
        <p className="mt-1 mb-4 text-[14px] text-muted">Days it isn&rsquo;t running, like holidays or when it&rsquo;s fully booked.</p>
        {exp.experience_blackouts.length > 0 && (
          <ul className="mb-5 divide-y divide-line rounded-[10px] border border-line">
            {exp.experience_blackouts.map((b) => (
              <li key={b.date} className="flex items-center gap-3 px-3.5 py-2 text-[15px]">
                <span className="flex-1">
                  <span className="font-semibold">{formatDate(b.date)}</span>
                  {b.reason && <span className="text-muted"> · {b.reason}</span>}
                </span>
                <form action={actions.deleteBlackout}>
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
        <ActionForm action={actions.addBlackout} submitLabel="Close this date">
          <Row>
            <DateField name="date" label="Date" minDate={minBookableDate()} maxDate={addDays(minBookableDate(), 730)} defaultValue={minBookableDate()} />
            <TextField name="reason" label="Note (optional, not shown to guests)" placeholder="e.g. Public holiday" />
          </Row>
        </ActionForm>
      </section>

      {/* Details */}
      <section className={`${panel} mb-6`}>
        {editable ? (
          <ExperienceForm action={actions.saveDetails} areas={areas} experience={exp} submitLabel="Save details" />
        ) : (
          <>
            <h2 className={sectionTitle}>Details</h2>
            <p className="mt-1 text-[14px] text-muted">{lockedNote}</p>
          </>
        )}
      </section>
    </>
  );
}
