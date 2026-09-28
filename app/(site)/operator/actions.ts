"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOperator } from "@/lib/portal";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formValues, invalid, type FormState } from "@/lib/form-state";
import type { Category } from "@/lib/categories";
import { blackoutInput, experienceDetails, operatorDetails, slotInput } from "@/lib/validation/portal";
import { minBookableDate } from "@/lib/dates";

const SAVE_FAILED: FormState = { error: "Couldn't save. Please try again." };

/** The experience, if it belongs to the signed-in operator (RLS hides everyone else's). */
async function ownExperience(id: string) {
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return null;
  const { operator } = await requireOperator();
  const db = await createClient();
  const { data } = await db.from("experiences").select("id, title, status, operator_id").eq("id", id).maybeSingle();
  return data && data.operator_id === operator.id ? data : null;
}

const editable = (status: string) => status === "draft" || status === "rejected";

function refresh(experienceId?: string) {
  revalidatePath("/operator", "layout");
  if (experienceId) revalidatePath(`/operator/experiences/${experienceId}`);
}

// ---------- Business details ----------

export async function saveOperatorDetails(_prev: FormState, form: FormData): Promise<FormState> {
  const { operator } = await requireOperator();
  const parsed = operatorDetails.safeParse({
    name: form.get("name"),
    areaId: form.get("areaId"),
    description: form.get("description"),
    website: form.get("website"),
    contactEmail: form.get("contactEmail"),
    contactPhone: form.get("contactPhone"),
  });
  if (!parsed.success) return invalid(parsed.error, form);
  const d = parsed.data;

  const db = await createClient();
  const [a, b] = await Promise.all([
    db
      .from("operators")
      .update({ name: d.name, area_id: d.areaId, description: d.description || null, website: d.website || null })
      .eq("id", operator.id),
    db
      .from("operator_private")
      .update({ contact_email: d.contactEmail, contact_phone: d.contactPhone || null })
      .eq("operator_id", operator.id),
  ]);
  if (a.error || b.error) return SAVE_FAILED;
  refresh();
  if (operator.status === "verified") revalidatePath(`/o/${operator.slug}`);
  return { ok: "Saved" };
}

// ---------- Experiences ----------

function readExperience(form: FormData) {
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

function toColumns(d: z.infer<typeof experienceDetails>) {
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
async function uniqueExperienceSlug(title: string): Promise<string> {
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

export async function createExperience(_prev: FormState, form: FormData): Promise<FormState> {
  const { operator } = await requireOperator();
  const parsed = readExperience(form);
  if (!parsed.success) return invalid(parsed.error, form);

  const db = await createClient();
  let id: string | null = null;
  for (let attempt = 0; attempt < 3 && !id; attempt++) {
    const slug = await uniqueExperienceSlug(parsed.data.title);
    const { data, error } = await db
      .from("experiences")
      .insert({ ...toColumns(parsed.data), operator_id: operator.id, slug })
      .select("id")
      .single();
    if (data) id = data.id;
    else if (error?.code !== "23505") {
      console.error("createExperience failed", error?.code, error?.message);
      return { ...SAVE_FAILED, values: formValues(form) };
    }
  }
  if (!id) return SAVE_FAILED;
  refresh();
  redirect(`/operator/experiences/${id}?created=1`);
}

export async function saveExperience(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const exp = await ownExperience(id);
  if (!exp) return { error: "This experience wasn't found." };
  if (!editable(exp.status)) {
    return { error: "This listing is in review or live, so its details are locked. Email us to change them." };
  }
  const parsed = readExperience(form);
  if (!parsed.success) return invalid(parsed.error, form);

  const db = await createClient();
  const { error } = await db.from("experiences").update(toColumns(parsed.data)).eq("id", id);
  if (error) return SAVE_FAILED;
  refresh(id);
  return { ok: "Saved" };
}

export async function submitForReview(form: FormData) {
  const id = String(form.get("id") ?? "");
  const exp = await ownExperience(id);
  if (!exp || !editable(exp.status)) return;

  const db = await createClient();
  const [{ count: photos }, { count: slots }] = await Promise.all([
    db.from("experience_photos").select("id", { count: "exact", head: true }).eq("experience_id", id),
    db.from("experience_slots").select("id", { count: "exact", head: true }).eq("experience_id", id),
  ]);
  if (!photos || !slots) redirect(`/operator/experiences/${id}?error=incomplete`);

  // Status isn't writable by operators directly; the server moves it after the checks above.
  const admin = createAdminClient();
  await admin.from("experiences").update({ status: "pending_review" }).eq("id", id).in("status", ["draft", "rejected"]);
  refresh(id);
  redirect(`/operator/experiences/${id}?submitted=1`);
}

export async function deleteDraft(form: FormData) {
  const id = String(form.get("id") ?? "");
  const exp = await ownExperience(id);
  if (!exp || exp.status !== "draft") return;
  const admin = createAdminClient();
  const { data: photos } = await admin.from("experience_photos").select("path").eq("experience_id", id);
  if (photos?.length) await admin.storage.from("experience-photos").remove(photos.map((p) => p.path));
  await admin.from("experiences").delete().eq("id", id).eq("status", "draft");
  refresh();
  redirect("/operator/experiences");
}

// ---------- Photos ----------

const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS = 10;

export async function uploadPhoto(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const exp = await ownExperience(id);
  if (!exp) return { error: "This experience wasn't found." };
  if (!editable(exp.status)) return { error: "Photos are locked while the listing is in review or live." };

  const file = form.get("photo");
  if (!(file instanceof File) || file.size === 0) return { errors: { photo: "Choose a photo to upload" } };
  const ext = PHOTO_TYPES[file.type];
  if (!ext) return { errors: { photo: "Use a JPG, PNG or WebP photo" } };
  if (file.size > MAX_PHOTO_BYTES) return { errors: { photo: "Photos must be 5 MB or smaller" } };
  const alt = String(form.get("alt") ?? "").trim().slice(0, 150) || exp.title;

  const db = await createClient();
  const { data: existing } = await db.from("experience_photos").select("sort_order").eq("experience_id", id);
  if ((existing?.length ?? 0) >= MAX_PHOTOS) return { error: `Up to ${MAX_PHOTOS} photos per experience.` };

  const path = `${id}/${randomUUID()}.${ext}`;
  const upload = await db.storage.from("experience-photos").upload(path, file, { contentType: file.type, upsert: false });
  if (upload.error) {
    console.error("photo upload failed", upload.error.message);
    return { error: "Couldn't upload the photo. Please try again." };
  }
  const nextOrder = Math.max(-1, ...(existing ?? []).map((p) => p.sort_order)) + 1;
  const { error } = await db.from("experience_photos").insert({ experience_id: id, path, alt, sort_order: nextOrder });
  if (error) {
    await db.storage.from("experience-photos").remove([path]);
    return SAVE_FAILED;
  }
  refresh(id);
  return { ok: "Photo added" };
}

export async function deletePhoto(form: FormData) {
  const experienceId = String(form.get("experienceId") ?? "");
  const photoId = String(form.get("photoId") ?? "");
  const exp = await ownExperience(experienceId);
  if (!exp || !editable(exp.status) || !z.uuid().safeParse(photoId).success) return;
  const db = await createClient();
  const { data } = await db.from("experience_photos").delete().eq("id", photoId).eq("experience_id", experienceId).select("path").maybeSingle();
  if (data) await db.storage.from("experience-photos").remove([data.path]);
  refresh(experienceId);
}

/** Make a photo the cover (first). */
export async function setCoverPhoto(form: FormData) {
  const experienceId = String(form.get("experienceId") ?? "");
  const photoId = String(form.get("photoId") ?? "");
  const exp = await ownExperience(experienceId);
  if (!exp || !editable(exp.status)) return;
  const db = await createClient();
  const { data: photos } = await db.from("experience_photos").select("id, sort_order").eq("experience_id", experienceId).order("sort_order");
  if (!photos?.some((p) => p.id === photoId)) return;
  const ordered = [photoId, ...photos.map((p) => p.id).filter((p) => p !== photoId)];
  await Promise.all(ordered.map((pid, i) => db.from("experience_photos").update({ sort_order: i }).eq("id", pid)));
  refresh(experienceId);
}

// ---------- Weekly times and closed dates (editable any time, even when live) ----------

export async function addSlots(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const exp = await ownExperience(id);
  if (!exp) return { error: "This experience wasn't found." };
  const parsed = slotInput.safeParse({
    weekdays: form.getAll("weekdays"),
    startTime: form.get("startTime"),
    capacity: form.get("capacity"),
  });
  if (!parsed.success) return invalid(parsed.error, form);

  // Not an upsert: operators may update capacity but not the key columns, which ON CONFLICT DO UPDATE would touch.
  const { startTime, capacity, weekdays } = parsed.data;
  const db = await createClient();
  const { data: existing } = await db
    .from("experience_slots")
    .select("id, weekday")
    .eq("experience_id", id)
    .eq("start_time", `${startTime}:00`)
    .in("weekday", weekdays);
  const found = new Map((existing ?? []).map((s) => [s.weekday, s.id]));
  const toInsert = weekdays.filter((d) => !found.has(d)).map((weekday) => ({ experience_id: id, weekday, start_time: startTime, capacity }));
  const results = await Promise.all([
    toInsert.length ? db.from("experience_slots").insert(toInsert) : null,
    found.size ? db.from("experience_slots").update({ capacity }).in("id", [...found.values()]) : null,
  ]);
  if (results.some((r) => r?.error)) {
    console.error("addSlots failed", results.map((r) => r?.error?.message));
    return SAVE_FAILED;
  }
  refresh(id);
  if (exp.status === "live") revalidatePath("/x/[slug]", "page");
  return { ok: "Times saved" };
}

export async function deleteSlot(form: FormData) {
  const experienceId = String(form.get("experienceId") ?? "");
  const slotId = String(form.get("slotId") ?? "");
  const exp = await ownExperience(experienceId);
  if (!exp || !z.uuid().safeParse(slotId).success) return;
  const db = await createClient();
  await db.from("experience_slots").delete().eq("id", slotId).eq("experience_id", experienceId);
  refresh(experienceId);
  if (exp.status === "live") revalidatePath("/x/[slug]", "page");
}

export async function addBlackout(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const exp = await ownExperience(id);
  if (!exp) return { error: "This experience wasn't found." };
  const parsed = blackoutInput.safeParse({ date: form.get("date"), reason: form.get("reason") ?? "" });
  if (!parsed.success) return invalid(parsed.error, form);
  if (parsed.data.date < minBookableDate()) return { errors: { date: "Choose a date from tomorrow onwards" }, values: { date: parsed.data.date } };

  const db = await createClient();
  const reason = parsed.data.reason || null;
  const { data: existing } = await db.from("experience_blackouts").select("date").eq("experience_id", id).eq("date", parsed.data.date).maybeSingle();
  const { error } = existing
    ? await db.from("experience_blackouts").update({ reason }).eq("experience_id", id).eq("date", parsed.data.date)
    : await db.from("experience_blackouts").insert({ experience_id: id, date: parsed.data.date, reason });
  if (error) {
    console.error("addBlackout failed", error.message);
    return SAVE_FAILED;
  }
  refresh(id);
  if (exp.status === "live") revalidatePath("/x/[slug]", "page");
  return { ok: "Date closed" };
}

export async function deleteBlackout(form: FormData) {
  const experienceId = String(form.get("experienceId") ?? "");
  const date = String(form.get("date") ?? "");
  const exp = await ownExperience(experienceId);
  if (!exp || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  const db = await createClient();
  await db.from("experience_blackouts").delete().eq("experience_id", experienceId).eq("date", date);
  refresh(experienceId);
  if (exp.status === "live") revalidatePath("/x/[slug]", "page");
}
