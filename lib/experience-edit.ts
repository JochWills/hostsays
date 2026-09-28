import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { invalid, type FormState } from "@/lib/form-state";
import type { Category } from "@/lib/categories";
import { minBookableDate } from "@/lib/dates";
import { blackoutInput, experienceDetails, slotInput } from "@/lib/validation/portal";

/**
 * Editing an experience: its details, photos, weekly times and closed dates. Shared by the operator portal
 * (with the signed-in user's client, so RLS keeps them to their own) and the admin pages (service role).
 * Callers check who may edit first; these only validate input and write.
 */

type Db = SupabaseClient<Database>;

export const SAVE_FAILED: FormState = { error: "Couldn't save. Please try again." };

// ---------- Details ----------

export function readExperience(form: FormData) {
  return experienceDetails.safeParse({
    title: form.get("title"),
    category: form.get("category"),
    areaId: form.get("areaId"),
    summary: form.get("summary"),
    description: form.get("description"),
    durationMinutes: form.get("durationMinutes"),
    price: form.get("price"),
    isGroupPrice: form.get("isGroupPrice") ?? undefined,
    minPeople: form.get("minPeople"),
    maxPeople: form.get("maxPeople"),
    included: form.get("included") ?? "",
    whatToBring: form.get("whatToBring") ?? "",
    meetingPoint: form.get("meetingPoint"),
    meetingPointMapUrl: form.get("meetingPointMapUrl") ?? "",
    cancellationTerms: form.get("cancellationTerms") ?? "",
  });
}

export function toColumns(d: z.infer<typeof experienceDetails>) {
  return {
    title: d.title,
    category: d.category as Category,
    area_id: d.areaId,
    summary: d.summary,
    description: d.description,
    duration_minutes: d.durationMinutes,
    price_cents: d.price,
    is_group_price: d.isGroupPrice,
    min_people: d.minPeople,
    max_people: d.maxPeople,
    included: d.included,
    what_to_bring: d.whatToBring,
    meeting_point: d.meetingPoint,
    meeting_point_map_url: d.meetingPointMapUrl || null,
    operator_cancellation_terms: d.cancellationTerms || null,
  };
}

/** A unique experience address from its title (checked across all experiences, not just visible ones). */
export async function uniqueExperienceSlug(title: string): Promise<string> {
  const base =
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70)
      .replace(/-+$/, "") || "experience";
  const padded = base.length < 3 ? `${base}-experience` : base;
  const admin = createAdminClient();
  const { data } = await admin.from("experiences").select("slug").like("slug", `${padded}%`);
  const taken = new Set((data ?? []).map((r) => r.slug));
  if (!taken.has(padded)) return padded;
  for (let n = 2; ; n++) if (!taken.has(`${padded}-${n}`)) return `${padded}-${n}`;
}

/** Insert a new draft experience for an operator. Returns its id, or null if it couldn't be saved. */
export async function insertExperience(db: Db, operatorId: string, d: z.infer<typeof experienceDetails>): Promise<string | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = await uniqueExperienceSlug(d.title);
    const { data, error } = await db
      .from("experiences")
      .insert({ ...toColumns(d), operator_id: operatorId, slug })
      .select("id")
      .single();
    if (data) return data.id;
    if (error?.code !== "23505") {
      console.error("insertExperience failed", error?.code, error?.message);
      return null;
    }
  }
  return null;
}

// ---------- Photos ----------

const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS = 10;

export async function addPhoto(db: Db, exp: { id: string; title: string }, form: FormData): Promise<FormState> {
  const file = form.get("photo");
  if (!(file instanceof File) || file.size === 0) return { errors: { photo: "Choose a photo to upload" } };
  const ext = PHOTO_TYPES[file.type];
  if (!ext) return { errors: { photo: "Use a JPG, PNG or WebP photo" } };
  if (file.size > MAX_PHOTO_BYTES) return { errors: { photo: "Photos must be 5 MB or smaller" } };
  const alt = String(form.get("alt") ?? "").trim().slice(0, 150) || exp.title;

  const { data: existing } = await db.from("experience_photos").select("sort_order").eq("experience_id", exp.id);
  if ((existing?.length ?? 0) >= MAX_PHOTOS) return { error: `Up to ${MAX_PHOTOS} photos per experience.` };

  const path = `${exp.id}/${randomUUID()}.${ext}`;
  const upload = await db.storage.from("experience-photos").upload(path, file, { contentType: file.type, upsert: false });
  if (upload.error) {
    console.error("photo upload failed", upload.error.message);
    return { error: "Couldn't upload the photo. Please try again." };
  }
  const nextOrder = Math.max(-1, ...(existing ?? []).map((p) => p.sort_order)) + 1;
  const { error } = await db.from("experience_photos").insert({ experience_id: exp.id, path, alt, sort_order: nextOrder });
  if (error) {
    await db.storage.from("experience-photos").remove([path]);
    return SAVE_FAILED;
  }
  return { ok: "Photo added" };
}

export async function removePhoto(db: Db, experienceId: string, photoId: string) {
  if (!z.uuid().safeParse(photoId).success) return;
  const { data } = await db.from("experience_photos").delete().eq("id", photoId).eq("experience_id", experienceId).select("path").maybeSingle();
  if (data) await db.storage.from("experience-photos").remove([data.path]);
}

/** Make a photo the cover (first). */
export async function makeCover(db: Db, experienceId: string, photoId: string) {
  const { data: photos } = await db.from("experience_photos").select("id, sort_order").eq("experience_id", experienceId).order("sort_order");
  if (!photos?.some((p) => p.id === photoId)) return;
  const ordered = [photoId, ...photos.map((p) => p.id).filter((p) => p !== photoId)];
  await Promise.all(ordered.map((pid, i) => db.from("experience_photos").update({ sort_order: i }).eq("id", pid)));
}

// ---------- Weekly times and closed dates ----------

export async function addSlots(db: Db, experienceId: string, form: FormData): Promise<FormState> {
  const parsed = slotInput.safeParse({
    weekdays: form.getAll("weekdays"),
    startTime: form.get("startTime"),
    capacity: form.get("capacity"),
  });
  if (!parsed.success) return invalid(parsed.error, form);

  // Not an upsert: operators may update capacity but not the key columns, which ON CONFLICT DO UPDATE would touch.
  const { startTime, capacity, weekdays } = parsed.data;
  const { data: existing } = await db
    .from("experience_slots")
    .select("id, weekday")
    .eq("experience_id", experienceId)
    .eq("start_time", `${startTime}:00`)
    .in("weekday", weekdays);
  const found = new Map((existing ?? []).map((s) => [s.weekday, s.id]));
  const toInsert = weekdays.filter((d) => !found.has(d)).map((weekday) => ({ experience_id: experienceId, weekday, start_time: startTime, capacity }));
  const results = await Promise.all([
    toInsert.length ? db.from("experience_slots").insert(toInsert) : null,
    found.size ? db.from("experience_slots").update({ capacity }).in("id", [...found.values()]) : null,
  ]);
  if (results.some((r) => r?.error)) {
    console.error("addSlots failed", results.map((r) => r?.error?.message));
    return SAVE_FAILED;
  }
  return { ok: "Times saved" };
}

export async function removeSlot(db: Db, experienceId: string, slotId: string) {
  if (!z.uuid().safeParse(slotId).success) return;
  await db.from("experience_slots").delete().eq("id", slotId).eq("experience_id", experienceId);
}

export async function addBlackout(db: Db, experienceId: string, form: FormData): Promise<FormState> {
  const parsed = blackoutInput.safeParse({ date: form.get("date"), reason: form.get("reason") ?? "" });
  if (!parsed.success) return invalid(parsed.error, form);
  if (parsed.data.date < minBookableDate()) return { errors: { date: "Choose a date from tomorrow onwards" }, values: { date: parsed.data.date } };

  const reason = parsed.data.reason || null;
  const { data: existing } = await db.from("experience_blackouts").select("date").eq("experience_id", experienceId).eq("date", parsed.data.date).maybeSingle();
  const { error } = existing
    ? await db.from("experience_blackouts").update({ reason }).eq("experience_id", experienceId).eq("date", parsed.data.date)
    : await db.from("experience_blackouts").insert({ experience_id: experienceId, date: parsed.data.date, reason });
  if (error) {
    console.error("addBlackout failed", error.message);
    return SAVE_FAILED;
  }
  return { ok: "Date closed" };
}

export async function removeBlackout(db: Db, experienceId: string, date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  await db.from("experience_blackouts").delete().eq("experience_id", experienceId).eq("date", date);
}
