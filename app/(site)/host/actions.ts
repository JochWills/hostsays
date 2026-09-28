"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireHost } from "@/lib/portal";
import { createClient } from "@/lib/supabase/server";
import { formValues, invalid, type FormState } from "@/lib/form-state";
import { bankInput, hostDetails, storefrontInput, tipInput } from "@/lib/validation/portal";
import type { Enum } from "@/lib/supabase/types";

const SAVE_FAILED: FormState = { error: "Couldn't save. Please try again." };

/** Host portal pages plus, once verified, the public storefront and directory. */
async function refresh() {
  const { host } = await requireHost();
  revalidatePath("/host", "layout");
  if (host.status === "verified") {
    revalidatePath(`/${host.slug}`);
    revalidatePath("/hosts");
  }
}

// ---------- Property and contact ----------

export async function saveHostDetails(_prev: FormState, form: FormData): Promise<FormState> {
  const { host } = await requireHost();
  const parsed = hostDetails.safeParse({
    name: form.get("name"),
    hostType: form.get("hostType"),
    areaId: form.get("areaId"),
    contactEmail: form.get("contactEmail"),
    contactPhone: form.get("contactPhone"),
  });
  if (!parsed.success) return invalid(parsed.error, form);
  const d = parsed.data;

  const db = await createClient();
  const [a, b] = await Promise.all([
    db.from("hosts").update({ name: d.name, type: d.hostType as Enum<"host_type">, area_id: d.areaId }).eq("id", host.id),
    db.from("host_private").update({ contact_email: d.contactEmail, contact_phone: d.contactPhone || null }).eq("host_id", host.id),
  ]);
  if (a.error || b.error) return SAVE_FAILED;
  await refresh();
  return { ok: "Saved" };
}

export async function saveBankDetails(_prev: FormState, form: FormData): Promise<FormState> {
  const { host } = await requireHost();
  const parsed = bankInput.safeParse({
    accountName: form.get("accountName"),
    bankName: form.get("bankName"),
    accountNumber: form.get("accountNumber"),
    branchCode: form.get("branchCode"),
  });
  if (!parsed.success) return invalid(parsed.error, form);
  if (form.get("confirm") !== "on") {
    return { errors: { confirm: "Please confirm the details are correct" }, values: formValues(form) };
  }
  const d = parsed.data;
  const details = {
    account_name: d.accountName,
    bank_name: d.bankName,
    account_number: d.accountNumber,
    branch_code: d.branchCode,
    confirmed: true,
  };
  // Not an upsert: hosts may not update host_id, which ON CONFLICT DO UPDATE would touch.
  const db = await createClient();
  const { data: existing } = await db.from("host_bank_details").select("host_id").eq("host_id", host.id).maybeSingle();
  const { error } = existing
    ? await db.from("host_bank_details").update(details).eq("host_id", host.id)
    : await db.from("host_bank_details").insert({ host_id: host.id, ...details });
  if (error) {
    console.error("saveBankDetails failed", error.message);
    return SAVE_FAILED;
  }
  revalidatePath("/host", "layout");
  return { ok: "Bank details saved" };
}

// ---------- Storefront ----------

export async function saveWelcomeNote(_prev: FormState, form: FormData): Promise<FormState> {
  const { host } = await requireHost();
  const parsed = storefrontInput.safeParse({ welcomeNote: form.get("welcomeNote") ?? "" });
  if (!parsed.success) return invalid(parsed.error, form);
  const db = await createClient();
  const { error } = await db.from("hosts").update({ welcome_note: parsed.data.welcomeNote || null }).eq("id", host.id);
  if (error) return SAVE_FAILED;
  await refresh();
  return { ok: "Saved" };
}

const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function uploadHostPhoto(_prev: FormState, form: FormData): Promise<FormState> {
  const { host } = await requireHost();
  const file = form.get("photo");
  if (!(file instanceof File) || file.size === 0) return { errors: { photo: "Choose a photo to upload" } };
  const ext = PHOTO_TYPES[file.type];
  if (!ext) return { errors: { photo: "Use a JPG, PNG or WebP photo" } };
  if (file.size > 5 * 1024 * 1024) return { errors: { photo: "Photos must be 5 MB or smaller" } };

  const db = await createClient();
  const { data: current } = await db.from("hosts").select("photo_path").eq("id", host.id).single();
  const path = `${host.id}/${randomUUID()}.${ext}`;
  const upload = await db.storage.from("host-photos").upload(path, file, { contentType: file.type });
  if (upload.error) {
    console.error("host photo upload failed", upload.error.message);
    return { error: "Couldn't upload the photo. Please try again." };
  }
  const { error } = await db.from("hosts").update({ photo_path: path }).eq("id", host.id);
  if (error) {
    await db.storage.from("host-photos").remove([path]);
    return SAVE_FAILED;
  }
  // Remove the previous photo (always under this host's folder).
  if (current?.photo_path?.startsWith(`${host.id}/`)) await db.storage.from("host-photos").remove([current.photo_path]);
  await refresh();
  return { ok: "Photo updated" };
}

// ---------- Picks (recommendations) ----------

export async function addPick(experienceId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const { host } = await requireHost();
  if (host.status !== "verified") return { error: "You can add picks once you're verified." };
  if (!z.uuid().safeParse(experienceId).success) return { error: "That experience wasn't found." };
  const parsed = tipInput.safeParse({ tip: form.get("tip") });
  if (!parsed.success) return invalid(parsed.error, form);

  const db = await createClient();
  const { data: existing } = await db.from("recommendations").select("sort_order").eq("host_id", host.id);
  const sortOrder = Math.max(-1, ...(existing ?? []).map((r) => r.sort_order)) + 1;
  const { error } = await db
    .from("recommendations")
    .insert({ host_id: host.id, experience_id: experienceId, tip: parsed.data.tip, sort_order: sortOrder });
  if (error) {
    if (error.code === "23505") return { error: "It's already one of your picks." };
    if (error.message.includes("they run")) return { error: "You can't recommend an experience you run yourself." };
    return SAVE_FAILED;
  }
  await refresh();
  revalidatePath("/x/[slug]", "page");
  return { ok: "Added to your picks" };
}

export async function updateTip(pickId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const { host } = await requireHost();
  const parsed = tipInput.safeParse({ tip: form.get("tip") });
  if (!parsed.success) return invalid(parsed.error, form);
  const db = await createClient();
  const { error } = await db.from("recommendations").update({ tip: parsed.data.tip }).eq("id", pickId).eq("host_id", host.id);
  if (error) return SAVE_FAILED;
  await refresh();
  revalidatePath("/x/[slug]", "page");
  return { ok: "Tip saved" };
}

export async function removePick(form: FormData) {
  const { host } = await requireHost();
  const id = String(form.get("id") ?? "");
  if (!z.uuid().safeParse(id).success) return;
  const db = await createClient();
  await db.from("recommendations").delete().eq("id", id).eq("host_id", host.id);
  await refresh();
  revalidatePath("/x/[slug]", "page");
}

/** Move a pick one place up or down (swaps with its neighbour, then renumbers 0..n). */
export async function movePick(form: FormData) {
  const { host } = await requireHost();
  const id = String(form.get("id") ?? "");
  const dir = form.get("dir") === "up" ? -1 : 1;
  const db = await createClient();
  const { data: picks } = await db
    .from("recommendations")
    .select("id")
    .eq("host_id", host.id)
    .order("sort_order")
    .order("created_at");
  if (!picks) return;
  const ids = picks.map((p) => p.id);
  const i = ids.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await Promise.all(ids.map((pid, n) => db.from("recommendations").update({ sort_order: n }).eq("id", pid).eq("host_id", host.id)));
  await refresh();
}
