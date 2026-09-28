"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formValues, invalid, type FormState } from "@/lib/form-state";
import * as edit from "@/lib/experience-edit";
import { replaceHostPhoto } from "@/lib/host-edit";
import { adminHostDetails, adminOperatorDetails, bankInput, tipInput } from "@/lib/validation/portal";
import type { Enum } from "@/lib/supabase/types";

/**
 * Admin edits to any host, operator or experience, whatever its status. Service role, so every action
 * checks the admin role first and validates its ids.
 */

const SAVE_FAILED = edit.SAVE_FAILED;
const NOT_FOUND: FormState = { error: "That wasn't found. It may have been deleted." };
const uuid = (v: unknown) => z.uuid().safeParse(v).success;

async function admin() {
  await requireRole("admin", "/admin");
  return createAdminClient();
}

/** Admin, portals and public pages all show this data. */
function refreshAll() {
  revalidatePath("/", "layout");
}

// ---------- Hosts ----------

export async function adminSaveHost(hostId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const db = await admin();
  if (!uuid(hostId)) return NOT_FOUND;
  const parsed = adminHostDetails.safeParse({
    name: form.get("name"),
    hostType: form.get("hostType"),
    areaId: form.get("areaId"),
    contactEmail: form.get("contactEmail"),
    contactPhone: form.get("contactPhone"),
    listingUrl: form.get("listingUrl"),
    commissionPercent: form.get("commissionPercent"),
    featuredRank: form.get("featuredRank"),
    welcomeNote: form.get("welcomeNote") ?? "",
  });
  if (!parsed.success) return invalid(parsed.error, form);
  const d = parsed.data;

  const [a, b] = await Promise.all([
    db
      .from("hosts")
      .update({ name: d.name, type: d.hostType as Enum<"host_type">, area_id: d.areaId, featured_rank: d.featuredRank, welcome_note: d.welcomeNote || null })
      .eq("id", hostId),
    db.from("host_private").upsert({
      host_id: hostId,
      listing_url: d.listingUrl,
      contact_email: d.contactEmail,
      contact_phone: d.contactPhone || null,
      commission_rate: d.commissionPercent,
    }),
  ]);
  if (a.error || b.error) {
    console.error("adminSaveHost failed", a.error?.message, b.error?.message);
    return { ...SAVE_FAILED, values: formValues(form) };
  }
  refreshAll();
  return { ok: "Saved" };
}

export async function adminSaveHostBank(hostId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const db = await admin();
  if (!uuid(hostId)) return NOT_FOUND;
  const parsed = bankInput.safeParse({
    accountName: form.get("accountName"),
    bankName: form.get("bankName"),
    accountNumber: form.get("accountNumber"),
    branchCode: form.get("branchCode"),
  });
  if (!parsed.success) return invalid(parsed.error, form);
  const d = parsed.data;
  const { error } = await db.from("host_bank_details").upsert({
    host_id: hostId,
    account_name: d.accountName,
    bank_name: d.bankName,
    account_number: d.accountNumber,
    branch_code: d.branchCode,
    confirmed: true,
  });
  if (error) {
    console.error("adminSaveHostBank failed", error.message);
    return SAVE_FAILED;
  }
  refreshAll();
  return { ok: "Bank details saved" };
}

export async function adminUploadHostPhoto(hostId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const db = await admin();
  if (!uuid(hostId)) return NOT_FOUND;
  const result = await replaceHostPhoto(db, hostId, form);
  if (result.ok) refreshAll();
  return result;
}

export async function adminUpdateTip(pickId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const db = await admin();
  if (!uuid(pickId)) return NOT_FOUND;
  const parsed = tipInput.safeParse({ tip: form.get("tip") });
  if (!parsed.success) return invalid(parsed.error, form);
  const { error } = await db.from("recommendations").update({ tip: parsed.data.tip }).eq("id", pickId);
  if (error) return SAVE_FAILED;
  refreshAll();
  return { ok: "Tip saved" };
}

/** Hide a pick from the site (or show it again) without deleting the host's tip. */
export async function adminSetPickHidden(form: FormData) {
  const db = await admin();
  const id = form.get("id");
  if (!uuid(id)) return;
  await db.from("recommendations").update({ is_hidden: form.get("hidden") === "true" }).eq("id", String(id));
  refreshAll();
}

export async function adminRemovePick(form: FormData) {
  const db = await admin();
  const id = form.get("id");
  if (!uuid(id)) return;
  await db.from("recommendations").delete().eq("id", String(id));
  refreshAll();
}

// ---------- Operators ----------

export async function adminSaveOperator(operatorId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const db = await admin();
  if (!uuid(operatorId)) return NOT_FOUND;
  const parsed = adminOperatorDetails.safeParse({
    name: form.get("name"),
    areaId: form.get("areaId"),
    description: form.get("description") ?? "",
    website: form.get("website") ?? "",
    contactEmail: form.get("contactEmail"),
    contactPhone: form.get("contactPhone") ?? "",
    isDemo: form.get("isDemo") ?? undefined,
  });
  if (!parsed.success) return invalid(parsed.error, form);
  const d = parsed.data;

  const { data: priv } = await db.from("operator_private").select("operator_id").eq("operator_id", operatorId).maybeSingle();
  const contact = { contact_email: d.contactEmail, contact_phone: d.contactPhone || null };
  const [a, b] = await Promise.all([
    db
      .from("operators")
      .update({ name: d.name, area_id: d.areaId, description: d.description || null, website: d.website || null, is_demo: d.isDemo })
      .eq("id", operatorId),
    priv
      ? db.from("operator_private").update(contact).eq("operator_id", operatorId)
      : db.from("operator_private").insert({ operator_id: operatorId, ...contact }),
  ]);
  if (a.error || b.error) {
    console.error("adminSaveOperator failed", a.error?.message, b.error?.message);
    return { ...SAVE_FAILED, values: formValues(form) };
  }
  refreshAll();
  return { ok: "Saved" };
}

/** Start a new listing on an operator's behalf. It begins as a draft, like theirs. */
export async function adminCreateExperience(operatorId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const db = await admin();
  if (!uuid(operatorId)) return NOT_FOUND;
  const parsed = edit.readExperience(form);
  if (!parsed.success) return invalid(parsed.error, form);
  const id = await edit.insertExperience(db, operatorId, parsed.data);
  if (!id) return { ...SAVE_FAILED, values: formValues(form) };
  refreshAll();
  redirect(`/admin/experiences/${id}?created=1`);
}

// ---------- Experiences (any status, including live) ----------

async function experience(db: ReturnType<typeof createAdminClient>, id: unknown) {
  if (!uuid(id)) return null;
  const { data } = await db.from("experiences").select("id, title, status").eq("id", String(id)).maybeSingle();
  return data;
}

export async function adminSaveExperience(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const db = await admin();
  if (!(await experience(db, id))) return NOT_FOUND;
  const parsed = edit.readExperience(form);
  if (!parsed.success) return invalid(parsed.error, form);
  const { error } = await db.from("experiences").update(edit.toColumns(parsed.data)).eq("id", id);
  if (error) return SAVE_FAILED;
  refreshAll();
  return { ok: "Saved" };
}

export async function adminUploadPhoto(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const db = await admin();
  const exp = await experience(db, id);
  if (!exp) return NOT_FOUND;
  const result = await edit.addPhoto(db, exp, form);
  if (result.ok) refreshAll();
  return result;
}

export async function adminDeletePhoto(form: FormData) {
  const db = await admin();
  const exp = await experience(db, form.get("experienceId"));
  if (!exp) return;
  await edit.removePhoto(db, exp.id, String(form.get("photoId") ?? ""));
  refreshAll();
}

export async function adminSetCoverPhoto(form: FormData) {
  const db = await admin();
  const exp = await experience(db, form.get("experienceId"));
  if (!exp) return;
  await edit.makeCover(db, exp.id, String(form.get("photoId") ?? ""));
  refreshAll();
}

export async function adminAddSlots(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const db = await admin();
  if (!(await experience(db, id))) return NOT_FOUND;
  const result = await edit.addSlots(db, id, form);
  if (result.ok) refreshAll();
  return result;
}

export async function adminDeleteSlot(form: FormData) {
  const db = await admin();
  const exp = await experience(db, form.get("experienceId"));
  if (!exp) return;
  await edit.removeSlot(db, exp.id, String(form.get("slotId") ?? ""));
  refreshAll();
}

export async function adminAddBlackout(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const db = await admin();
  if (!(await experience(db, id))) return NOT_FOUND;
  const result = await edit.addBlackout(db, id, form);
  if (result.ok) refreshAll();
  return result;
}

export async function adminDeleteBlackout(form: FormData) {
  const db = await admin();
  const exp = await experience(db, form.get("experienceId"));
  if (!exp) return;
  await edit.removeBlackout(db, exp.id, String(form.get("date") ?? ""));
  refreshAll();
}

/** Delete a listing that never went live (draft or sent back), with its photos. */
export async function adminDeleteExperience(form: FormData) {
  const db = await admin();
  const exp = await experience(db, form.get("id"));
  if (!exp || (exp.status !== "draft" && exp.status !== "rejected")) return;
  const { data: photos } = await db.from("experience_photos").select("path").eq("experience_id", exp.id);
  if (photos?.length) await db.storage.from("experience-photos").remove(photos.map((p) => p.path));
  await db.from("experiences").delete().eq("id", exp.id).in("status", ["draft", "rejected"]);
  refreshAll();
  redirect("/admin/experiences");
}
