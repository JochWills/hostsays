"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formValues, invalid, type FormState } from "@/lib/form-state";
import * as edit from "@/lib/experience-edit";
import { replaceHostPhoto } from "@/lib/host-edit";
import { areaChoiceColumns } from "@/lib/area-choice";
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
    areaId: form.get("areaId") ?? "",
    town: form.get("town") ?? "",
    contactEmail: form.get("contactEmail"),
    contactPhone: form.get("contactPhone"),
    listingUrl: form.get("listingUrl"),
    commissionPercent: form.get("commissionPercent"),
    featuredRank: form.get("featuredRank"),
    welcomeNote: form.get("welcomeNote") ?? "",
  });
  if (!parsed.success) return invalid(parsed.error, form);
  const d = parsed.data;
  const place = areaChoiceColumns(d.areaId, d.town);

  const [a, b] = await Promise.all([
    db
      .from("hosts")
      .update({ name: d.name, type: d.hostType as Enum<"host_type">, featured_rank: d.featuredRank, welcome_note: d.welcomeNote || null, ...place?.area })
      .eq("id", hostId),
    db.from("host_private").upsert({
      host_id: hostId,
      listing_url: d.listingUrl,
      contact_email: d.contactEmail,
      contact_phone: d.contactPhone || null,
      commission_rate: d.commissionPercent,
      ...place?.request,
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
    areaId: form.get("areaId") ?? "",
    town: form.get("town") ?? "",
    description: form.get("description") ?? "",
    website: form.get("website") ?? "",
    contactEmail: form.get("contactEmail"),
    contactPhone: form.get("contactPhone") ?? "",
    isDemo: form.get("isDemo") ?? undefined,
  });
  if (!parsed.success) return invalid(parsed.error, form);
  const d = parsed.data;

  const { data: priv } = await db.from("operator_private").select("operator_id").eq("operator_id", operatorId).maybeSingle();
  const place = areaChoiceColumns(d.areaId, d.town);
  const contact = { contact_email: d.contactEmail, contact_phone: d.contactPhone || null, ...place?.request };
  const [a, b] = await Promise.all([
    db
      .from("operators")
      .update({ name: d.name, description: d.description || null, website: d.website || null, is_demo: d.isDemo, ...place?.area })
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

// ---------- Deleting ----------
// Bookings, payouts, reviews and strikes are money and history records, so anything they point at can't be
// deleted: the page says to suspend or pause it instead. Photos are removed from storage too.

type AdminDb = ReturnType<typeof createAdminClient>;
const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;

/** Delete one experience with its photos (times, closed dates and picks go with it). False if records keep it. */
async function deleteExperienceRow(db: AdminDb, id: string): Promise<boolean> {
  const kept = (await Promise.all([
    count(db.from("bookings").select("id", { count: "exact", head: true }).eq("experience_id", id)),
    count(db.from("reviews").select("id", { count: "exact", head: true }).eq("experience_id", id)),
  ])).some(Boolean);
  if (kept) return false;
  const { data: photos } = await db.from("experience_photos").select("path").eq("experience_id", id);
  if (photos?.length) await db.storage.from("experience-photos").remove(photos.map((p) => p.path));
  const { error } = await db.from("experiences").delete().eq("id", id);
  if (error) throw new Error(`Couldn't delete experience: ${error.message}`);
  return true;
}

/** Delete the sign-in accounts that belong only to this business (never admins or guests). */
async function deleteMemberLogins(db: AdminDb, userIds: string[]) {
  if (!userIds.length) return;
  const { data: profiles } = await db.from("profiles").select("id, role").in("id", userIds);
  for (const p of profiles ?? []) {
    if (p.role !== "host" && p.role !== "operator") continue;
    const [hosts, operators] = await Promise.all([
      count(db.from("host_members").select("host_id", { count: "exact", head: true }).eq("user_id", p.id)),
      count(db.from("operator_members").select("operator_id", { count: "exact", head: true }).eq("user_id", p.id)),
    ]);
    if (hosts + operators === 0) await db.auth.admin.deleteUser(p.id);
  }
}

export async function adminDeleteExperience(form: FormData) {
  const db = await admin();
  const exp = await experience(db, form.get("id"));
  if (!exp) return;
  if (!(await deleteExperienceRow(db, exp.id))) redirect(`/admin/experiences/${exp.id}?error=kept`);
  refreshAll();
  redirect(`/admin/experiences?deleted=${encodeURIComponent(exp.title)}`);
}

export async function adminDeleteOperator(form: FormData) {
  const db = await admin();
  const id = form.get("id");
  if (!uuid(id)) return;
  const operatorId = String(id);
  const { data: op } = await db.from("operators").select("id, name, logo_path, operator_members(user_id)").eq("id", operatorId).maybeSingle();
  if (!op) return;
  const kept = (await Promise.all([
    count(db.from("bookings").select("id", { count: "exact", head: true }).eq("operator_id", operatorId)),
    count(db.from("operator_strikes").select("id", { count: "exact", head: true }).eq("operator_id", operatorId)),
  ])).some(Boolean);
  if (kept) redirect(`/admin/operators/${operatorId}?error=kept`);

  const { data: exps } = await db.from("experiences").select("id").eq("operator_id", operatorId);
  for (const e of exps ?? []) if (!(await deleteExperienceRow(db, e.id))) redirect(`/admin/operators/${operatorId}?error=kept`);
  if (op.logo_path) await db.storage.from("operator-logos").remove([op.logo_path]).catch(() => null);
  await db.from("invites").delete().eq("operator_id", operatorId);
  const { error } = await db.from("operators").delete().eq("id", operatorId);
  if (error) throw new Error(`Couldn't delete operator: ${error.message}`);
  await deleteMemberLogins(db, op.operator_members.map((m) => m.user_id));
  refreshAll();
  redirect(`/admin/operators?deleted=${encodeURIComponent(op.name)}`);
}

export async function adminDeleteHost(form: FormData) {
  const db = await admin();
  const id = form.get("id");
  if (!uuid(id)) return;
  const hostId = String(id);
  const { data: host } = await db.from("hosts").select("id, name, photo_path, host_members(user_id)").eq("id", hostId).maybeSingle();
  if (!host) return;
  const kept = (await Promise.all([
    count(db.from("bookings").select("id", { count: "exact", head: true }).eq("host_id", hostId)),
    count(db.from("payouts").select("id", { count: "exact", head: true }).eq("host_id", hostId)),
  ])).some(Boolean);
  if (kept) redirect(`/admin/hosts/${hostId}?error=kept`);

  if (host.photo_path) await db.storage.from("host-photos").remove([host.photo_path]);
  await db.from("invites").delete().eq("host_id", hostId);
  const { error } = await db.from("hosts").delete().eq("id", hostId);
  if (error) throw new Error(`Couldn't delete host: ${error.message}`);
  await deleteMemberLogins(db, host.host_members.map((m) => m.user_id));
  refreshAll();
  redirect(`/admin/hosts?deleted=${encodeURIComponent(host.name)}`);
}
