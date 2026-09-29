"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { invalid, type FormState } from "@/lib/form-state";
import { areaInput } from "@/lib/validation/portal";

/** Admin: add, edit, order, merge and delete areas, and settle "Somewhere else" town requests. */

const uuid = (v: unknown): v is string => z.uuid().safeParse(v).success;

async function admin() {
  await requireRole("admin", "/admin/areas");
  return createAdminClient();
}

function refreshAll() {
  revalidatePath("/", "layout");
}

/** "Port Alfred" → "port-alfred" */
function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}

/** Why a slug was refused, in plain words (the database checks areas, provinces, hosts, old addresses and reserved words). */
function slugProblem(error: { code?: string; message: string }) {
  if (error.code === "23505" || error.code === "23514") {
    return error.message.includes("reserved") ? "That address is reserved for a page on the site." : "That address is already in use. Try another.";
  }
  return null;
}

async function nextSortOrder(db: ReturnType<typeof createAdminClient>, provinceId: string) {
  const { data } = await db.from("areas").select("sort_order").eq("province_id", provinceId).order("sort_order", { ascending: false }).limit(1);
  return (data?.[0]?.sort_order ?? 0) + 1;
}

/** Insert an area; if the address made from the name is taken, try "-2", "-3"… Returns its id or an error. */
async function insertArea(db: ReturnType<typeof createAdminClient>, provinceId: string, name: string, slug: string, intro: string | null) {
  const base = slug || slugify(name);
  if (base.length < 2) return { error: "Use a longer name." } as const;
  const sortOrder = await nextSortOrder(db, provinceId);
  for (let n = 1; n <= (slug ? 1 : 5); n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const { data, error } = await db
      .from("areas")
      .insert({ province_id: provinceId, name, slug: candidate, intro, sort_order: sortOrder })
      .select("id")
      .single();
    if (data) return { id: data.id } as const;
    const problem = slugProblem(error);
    if (!problem) {
      console.error("insertArea failed", error.code, error.message);
      return { error: "Couldn't save. Please try again." } as const;
    }
    if (slug) return { error: problem, field: "slug" } as const;
  }
  return { error: "That address is already in use. Set one yourself.", field: "slug" } as const;
}

export async function adminCreateArea(provinceId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const db = await admin();
  if (!uuid(provinceId)) return { error: "That province wasn't found." };
  const parsed = areaInput.safeParse({ name: form.get("name"), slug: form.get("slug") ?? "", intro: form.get("intro") ?? "" });
  if (!parsed.success) return invalid(parsed.error, form);
  const result = await insertArea(db, provinceId, parsed.data.name, parsed.data.slug, parsed.data.intro || null);
  if ("error" in result) return result.field ? { errors: { [result.field]: result.error } } : { error: result.error };
  refreshAll();
  return { ok: `Added ${parsed.data.name}` };
}

export async function adminSaveArea(areaId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const db = await admin();
  if (!uuid(areaId)) return { error: "That area wasn't found." };
  const parsed = areaInput.safeParse({ name: form.get("name"), slug: form.get("slug") ?? "", intro: form.get("intro") ?? "" });
  if (!parsed.success) return invalid(parsed.error, form);
  const { name, slug, intro } = parsed.data;
  // Changing the address keeps the old one working: the database adds a redirect.
  const { error } = await db
    .from("areas")
    .update({ name, intro: intro || null, ...(slug ? { slug } : {}) })
    .eq("id", areaId);
  if (error) {
    const problem = slugProblem(error);
    if (problem) return { errors: { slug: problem } };
    console.error("adminSaveArea failed", error.code, error.message);
    return { error: "Couldn't save. Please try again." };
  }
  refreshAll();
  return { ok: "Saved" };
}

/** Move an area one place up or down within its province (swap with its neighbour, then renumber). */
export async function adminMoveArea(form: FormData) {
  const db = await admin();
  const id = form.get("id");
  if (!uuid(id)) return;
  const { data: area } = await db.from("areas").select("province_id").eq("id", id).single();
  if (!area) return;
  const { data: siblings } = await db.from("areas").select("id").eq("province_id", area.province_id).order("sort_order").order("name");
  const ids = (siblings ?? []).map((s) => s.id);
  const i = ids.indexOf(id);
  const j = i + (form.get("dir") === "up" ? -1 : 1);
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await Promise.all(ids.map((aid, n) => db.from("areas").update({ sort_order: n + 1 }).eq("id", aid)));
  refreshAll();
}

/** Fold one area into another: its experiences, hosts and operators move, and its address redirects. */
export async function adminMergeArea(form: FormData) {
  const db = await admin();
  const from = form.get("id");
  const into = form.get("into");
  if (!uuid(from) || !uuid(into) || from === into) return;
  const { error } = await db.rpc("merge_areas", { p_from: from, p_into: into });
  if (error) throw new Error(`Couldn't merge areas: ${error.message}`);
  refreshAll();
}

/** Delete an area nobody uses (no experiences, hosts or operators). */
export async function adminDeleteArea(form: FormData) {
  const db = await admin();
  const id = form.get("id");
  if (!uuid(id)) return;
  const counts = await Promise.all(
    (["experiences", "hosts", "operators"] as const).map(async (t) => (await db.from(t).select("id", { count: "exact", head: true }).eq("area_id", id)).count ?? 0),
  );
  if (counts.some(Boolean)) return;
  await db.from("areas").delete().eq("id", id);
  refreshAll();
}

// ---------- "Somewhere else" requests ----------

type Db = ReturnType<typeof createAdminClient>;
const clearRequest = { requested_province_id: null, requested_town: null };

async function assign(db: Db, kind: "host" | "operator", id: string, areaId: string) {
  const [a, b] =
    kind === "host"
      ? await Promise.all([
          db.from("hosts").update({ area_id: areaId }).eq("id", id),
          db.from("host_private").update(clearRequest).eq("host_id", id),
        ])
      : await Promise.all([
          db.from("operators").update({ area_id: areaId }).eq("id", id),
          db.from("operator_private").update(clearRequest).eq("operator_id", id),
        ]);
  if (a.error || b.error) throw new Error(`Couldn't assign the area: ${a.error?.message ?? b.error?.message}`);
}

function readRequest(form: FormData) {
  const kind = form.get("kind");
  const id = form.get("id");
  if ((kind !== "host" && kind !== "operator") || !uuid(id)) return null;
  return { kind, id } as const;
}

/** Put a host or operator who asked for a town into an existing area. */
export async function adminAssignArea(form: FormData) {
  const db = await admin();
  const req = readRequest(form);
  const areaId = form.get("areaId");
  if (!req || !uuid(areaId)) return;
  await assign(db, req.kind, req.id, areaId);
  refreshAll();
}

/** Create the town they asked for (in their province) and put them in it. */
export async function adminCreateAreaFromRequest(form: FormData) {
  const db = await admin();
  const req = readRequest(form);
  if (!req) return;
  const { data: priv } =
    req.kind === "host"
      ? await db.from("host_private").select("requested_province_id, requested_town").eq("host_id", req.id).maybeSingle()
      : await db.from("operator_private").select("requested_province_id, requested_town").eq("operator_id", req.id).maybeSingle();
  const town = priv?.requested_town?.trim();
  if (!priv?.requested_province_id || !town) return;
  const name = town.replace(/\s+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 40);
  const { data: existing } = await db.from("areas").select("id").eq("province_id", priv.requested_province_id).ilike("name", name).maybeSingle();
  let areaId = existing?.id;
  if (!areaId) {
    const result = await insertArea(db, priv.requested_province_id, name, "", null);
    if ("error" in result) throw new Error(result.error);
    areaId = result.id;
  }
  await assign(db, req.kind, req.id, areaId);
  refreshAll();
}
