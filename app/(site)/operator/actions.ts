"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOperator } from "@/lib/portal";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formValues, invalid, type FormState } from "@/lib/form-state";
import * as edit from "@/lib/experience-edit";
import { operatorDetails } from "@/lib/validation/portal";

const SAVE_FAILED = edit.SAVE_FAILED;

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

export async function createExperience(_prev: FormState, form: FormData): Promise<FormState> {
  const { operator } = await requireOperator();
  const parsed = edit.readExperience(form);
  if (!parsed.success) return invalid(parsed.error, form);

  const id = await edit.insertExperience(await createClient(), operator.id, parsed.data);
  if (!id) return { ...SAVE_FAILED, values: formValues(form) };
  refresh();
  redirect(`/operator/experiences/${id}?created=1`);
}

export async function saveExperience(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const exp = await ownExperience(id);
  if (!exp) return { error: "This experience wasn't found." };
  if (!editable(exp.status)) {
    return { error: "This listing is in review or live, so its details are locked. Email us to change them." };
  }
  const parsed = edit.readExperience(form);
  if (!parsed.success) return invalid(parsed.error, form);

  const db = await createClient();
  const { error } = await db.from("experiences").update(edit.toColumns(parsed.data)).eq("id", id);
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

// ---------- Photos (locked once in review or live) ----------

export async function uploadPhoto(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const exp = await ownExperience(id);
  if (!exp) return { error: "This experience wasn't found." };
  if (!editable(exp.status)) return { error: "Photos are locked while the listing is in review or live." };
  const result = await edit.addPhoto(await createClient(), exp, form);
  if (result.ok) refresh(id);
  return result;
}

export async function deletePhoto(form: FormData) {
  const experienceId = String(form.get("experienceId") ?? "");
  const exp = await ownExperience(experienceId);
  if (!exp || !editable(exp.status)) return;
  await edit.removePhoto(await createClient(), experienceId, String(form.get("photoId") ?? ""));
  refresh(experienceId);
}

/** Make a photo the cover (first). */
export async function setCoverPhoto(form: FormData) {
  const experienceId = String(form.get("experienceId") ?? "");
  const exp = await ownExperience(experienceId);
  if (!exp || !editable(exp.status)) return;
  await edit.makeCover(await createClient(), experienceId, String(form.get("photoId") ?? ""));
  refresh(experienceId);
}

// ---------- Weekly times and closed dates (editable any time, even when live) ----------

function refreshTimes(exp: { id: string; status: string }) {
  refresh(exp.id);
  if (exp.status === "live") revalidatePath("/x/[slug]", "page");
}

export async function addSlots(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const exp = await ownExperience(id);
  if (!exp) return { error: "This experience wasn't found." };
  const result = await edit.addSlots(await createClient(), id, form);
  if (result.ok) refreshTimes(exp);
  return result;
}

export async function deleteSlot(form: FormData) {
  const experienceId = String(form.get("experienceId") ?? "");
  const exp = await ownExperience(experienceId);
  if (!exp) return;
  await edit.removeSlot(await createClient(), experienceId, String(form.get("slotId") ?? ""));
  refreshTimes(exp);
}

export async function addBlackout(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const exp = await ownExperience(id);
  if (!exp) return { error: "This experience wasn't found." };
  const result = await edit.addBlackout(await createClient(), id, form);
  if (result.ok) refreshTimes(exp);
  return result;
}

export async function deleteBlackout(form: FormData) {
  const experienceId = String(form.get("experienceId") ?? "");
  const exp = await ownExperience(experienceId);
  if (!exp) return;
  await edit.removeBlackout(await createClient(), experienceId, String(form.get("date") ?? ""));
  refreshTimes(exp);
}
