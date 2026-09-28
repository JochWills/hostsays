import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Enum } from "@/lib/supabase/types";

/** Queries for the signed-in portals. RLS limits members to their own host/operator. */

export type Membership = { id: string; name: string; slug: string; status: Enum<"approval_status"> };

export async function getMyHost(userId: string): Promise<Membership | null> {
  const db = await createClient();
  const { data } = await db
    .from("host_members")
    .select("hosts(id, name, slug, status)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  return data?.hosts ?? null;
}

export async function getMyOperator(userId: string): Promise<Membership | null> {
  const db = await createClient();
  const { data } = await db
    .from("operator_members")
    .select("operators(id, name, slug, status)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  return data?.operators ?? null;
}

// ---------- Operator ----------

export async function getOperatorSettings(operatorId: string) {
  const db = await createClient();
  const [{ data: op }, { data: priv }] = await Promise.all([
    db.from("operators").select("id, name, slug, area_id, description, website, status").eq("id", operatorId).single(),
    db.from("operator_private").select("contact_email, contact_phone, terms_accepted_at").eq("operator_id", operatorId).single(),
  ]);
  if (!op || !priv) throw new Error("operator not found");
  return { ...op, ...priv };
}

export type OperatorExperience = {
  id: string;
  slug: string;
  title: string;
  status: Enum<"listing_status">;
  priceCents: number;
  isGroupPrice: boolean;
  photoPath: string | null;
  slotCount: number;
  updatedAt: string;
};

export async function getOperatorExperiences(operatorId: string): Promise<OperatorExperience[]> {
  const db = await createClient();
  const { data, error } = await db
    .from("experiences")
    .select("id, slug, title, status, price_cents, is_group_price, updated_at, experience_photos(path, sort_order), experience_slots(id)")
    .eq("operator_id", operatorId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`experiences: ${error.message}`);
  return data.map((e) => ({
    id: e.id,
    slug: e.slug,
    title: e.title,
    status: e.status,
    priceCents: e.price_cents,
    isGroupPrice: e.is_group_price,
    photoPath: [...e.experience_photos].sort((a, b) => a.sort_order - b.sort_order)[0]?.path ?? null,
    slotCount: e.experience_slots.length,
    updatedAt: e.updated_at,
  }));
}

/**
 * An experience with photos, weekly times and closed dates. As the signed-in operator, RLS keeps it to their own;
 * `asAdmin` reads any (callers must check the admin role first).
 */
export async function getExperienceForEdit(id: string, { asAdmin = false } = {}) {
  const db = asAdmin ? createAdminClient() : await createClient();
  const { data, error } = await db
    .from("experiences")
    .select(
      "*, operators(id, name, slug, status), experience_photos(id, path, alt, sort_order), experience_slots(id, weekday, start_time, capacity), experience_blackouts(date, reason)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`experience: ${error.message}`);
  if (!data) return null;
  return {
    ...data,
    experience_photos: [...data.experience_photos].sort((a, b) => a.sort_order - b.sort_order),
    experience_slots: [...data.experience_slots].sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time)),
    experience_blackouts: [...data.experience_blackouts].sort((a, b) => a.date.localeCompare(b.date)),
  };
}

// ---------- Host ----------

export async function getHostSettings(hostId: string) {
  const db = await createClient();
  const [{ data: host }, { data: priv }, { data: bank }] = await Promise.all([
    db.from("hosts").select("id, name, slug, type, area_id, photo_path, welcome_note, status").eq("id", hostId).single(),
    db.from("host_private").select("contact_email, contact_phone, listing_url, commission_rate").eq("host_id", hostId).single(),
    db.from("host_bank_details").select("account_name, bank_name, account_number, branch_code, confirmed").eq("host_id", hostId).maybeSingle(),
  ]);
  if (!host || !priv) throw new Error("host not found");
  return { ...host, ...priv, bank };
}

export type HostPick = {
  id: string;
  tip: string;
  sortOrder: number;
  isHidden: boolean;
  experience: { id: string; slug: string; title: string; operatorName: string; areaName: string; priceCents: number; isGroupPrice: boolean; photoPath: string | null; live: boolean };
};

export async function getHostPicks(hostId: string): Promise<HostPick[]> {
  const db = await createClient();
  const { data, error } = await db
    .from("recommendations")
    .select("id, tip, sort_order, is_hidden, experiences(id, slug, title, status, price_cents, is_group_price, operators(name), areas(name), experience_photos(path, sort_order))")
    .eq("host_id", hostId)
    .order("sort_order")
    .order("created_at");
  if (error) throw new Error(`picks: ${error.message}`);
  return data.flatMap((r) => {
    const e = r.experiences;
    if (!e) return []; // no longer readable (e.g. taken down)
    return [{
      id: r.id,
      tip: r.tip,
      sortOrder: r.sort_order,
      isHidden: r.is_hidden,
      experience: {
        id: e.id,
        slug: e.slug,
        title: e.title,
        operatorName: e.operators?.name ?? "",
        areaName: e.areas?.name ?? "",
        priceCents: e.price_cents,
        isGroupPrice: e.is_group_price,
        photoPath: [...e.experience_photos].sort((a, b) => a.sort_order - b.sort_order)[0]?.path ?? null,
        live: e.status === "live",
      },
    }];
  });
}

/** Storefront visits over the last `days` days. */
export async function getStorefrontVisits(hostId: string, days = 30): Promise<number> {
  const db = await createClient();
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const { data } = await db.from("storefront_visits").select("count").eq("host_id", hostId).gte("day", since);
  return (data ?? []).reduce((sum, r) => sum + r.count, 0);
}

// ---------- Admin ----------

export type PendingHost = {
  id: string;
  name: string;
  type: string;
  area: string | null;
  listingUrl: string;
  email: string;
  phone: string | null;
  contactName: string | null;
  createdAt: string;
};

export type PendingOperator = {
  id: string;
  name: string;
  area: string | null;
  website: string | null;
  email: string;
  phone: string | null;
  contactName: string | null;
  createdAt: string;
};

/** Hosts and operators waiting for verification, oldest first. Callers must check the admin role first. */
export async function getPendingApplications(): Promise<{ hosts: PendingHost[]; operators: PendingOperator[] }> {
  const db = createAdminClient();
  const [hosts, operators] = await Promise.all([
    db
      .from("hosts")
      .select("id, name, type, created_at, areas(name), host_private(listing_url, contact_email, contact_phone), host_members(is_owner, profiles(full_name))")
      .eq("status", "pending")
      .order("created_at"),
    db
      .from("operators")
      .select("id, name, website, created_at, areas(name), operator_private(contact_email, contact_phone), operator_members(is_owner, profiles(full_name))")
      .eq("status", "pending")
      .eq("is_demo", false)
      .order("created_at"),
  ]);
  if (hosts.error) throw new Error(`pending hosts: ${hosts.error.message}`);
  if (operators.error) throw new Error(`pending operators: ${operators.error.message}`);

  const owner = (members: { is_owner: boolean; profiles: { full_name: string | null } | null }[]) =>
    (members.find((m) => m.is_owner) ?? members[0])?.profiles?.full_name ?? null;

  return {
    hosts: hosts.data.map((h) => ({
      id: h.id,
      name: h.name,
      type: h.type,
      area: h.areas?.name ?? null,
      listingUrl: h.host_private?.listing_url ?? "",
      email: h.host_private?.contact_email ?? "",
      phone: h.host_private?.contact_phone ?? null,
      contactName: owner(h.host_members),
      createdAt: h.created_at,
    })),
    operators: operators.data.map((o) => ({
      id: o.id,
      name: o.name,
      area: o.areas?.name ?? null,
      website: o.website,
      email: o.operator_private?.contact_email ?? "",
      phone: o.operator_private?.contact_phone ?? null,
      contactName: owner(o.operator_members),
      createdAt: o.created_at,
    })),
  };
}

export type PendingListing = { id: string; slug: string; title: string; operatorName: string; areaName: string; priceCents: number; isGroupPrice: boolean; photoCount: number; slotCount: number; updatedAt: string };

/** Experiences submitted for review, oldest first. Callers must check the admin role first. */
export async function getPendingListings(): Promise<PendingListing[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("experiences")
    .select("id, slug, title, price_cents, is_group_price, updated_at, operators(name), areas(name), experience_photos(id), experience_slots(id)")
    .eq("status", "pending_review")
    .order("updated_at");
  if (error) throw new Error(`pending listings: ${error.message}`);
  return data.map((e) => ({
    id: e.id,
    slug: e.slug,
    title: e.title,
    operatorName: e.operators?.name ?? "",
    areaName: e.areas?.name ?? "",
    priceCents: e.price_cents,
    isGroupPrice: e.is_group_price,
    photoCount: e.experience_photos.length,
    slotCount: e.experience_slots.length,
    updatedAt: e.updated_at,
  }));
}

export async function getAdminCounts() {
  const db = createAdminClient();
  const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;
  const [pendingHosts, pendingOperators, pendingListings, liveExperiences, verifiedHosts, verifiedOperators, guests] = await Promise.all([
    count(db.from("hosts").select("id", { count: "exact", head: true }).eq("status", "pending")),
    count(db.from("operators").select("id", { count: "exact", head: true }).eq("status", "pending").eq("is_demo", false)),
    count(db.from("experiences").select("id", { count: "exact", head: true }).eq("status", "pending_review")),
    count(db.from("experiences").select("id", { count: "exact", head: true }).eq("status", "live")),
    count(db.from("hosts").select("id", { count: "exact", head: true }).eq("status", "verified")),
    count(db.from("operators").select("id", { count: "exact", head: true }).eq("status", "verified")),
    count(db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "guest")),
  ]);
  return { pendingHosts, pendingOperators, pendingListings, pendingTotal: pendingHosts + pendingOperators + pendingListings, liveExperiences, verifiedHosts, verifiedOperators, guests };
}

export async function getAllHostsForAdmin() {
  const db = createAdminClient();
  const { data, error } = await db
    .from("hosts")
    .select("id, slug, name, type, status, created_at, areas(name), host_private(contact_email, commission_rate), recommendations(id)")
    .order("name");
  if (error) throw new Error(`hosts: ${error.message}`);
  return data;
}

export async function getAllOperatorsForAdmin() {
  const db = createAdminClient();
  const { data, error } = await db
    .from("operators")
    .select("id, slug, name, status, is_demo, created_at, areas(name), operator_private(contact_email), experiences(id, status)")
    .order("name");
  if (error) throw new Error(`operators: ${error.message}`);
  return data;
}

export async function getAllExperiencesForAdmin() {
  const db = createAdminClient();
  const { data, error } = await db
    .from("experiences")
    .select("id, slug, title, status, price_cents, is_group_price, updated_at, operators(name, status), areas(name), recommendations(id)")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`experiences: ${error.message}`);
  return data;
}

/** Everything about one host, for the admin edit page. Callers must check the admin role first. */
export async function getHostForAdmin(id: string) {
  const db = createAdminClient();
  const [{ data: host, error }, { data: picks, error: picksError }] = await Promise.all([
    db
      .from("hosts")
      .select(
        "*, host_private(listing_url, contact_email, contact_phone, commission_rate), host_bank_details(account_name, bank_name, account_number, branch_code, confirmed, updated_at), host_members(user_id, is_owner, profiles(full_name, phone))",
      )
      .eq("id", id)
      .maybeSingle(),
    db
      .from("recommendations")
      .select("id, tip, is_hidden, sort_order, experiences(id, slug, title, status)")
      .eq("host_id", id)
      .order("sort_order")
      .order("created_at"),
  ]);
  if (error) throw new Error(`host: ${error.message}`);
  if (picksError) throw new Error(`picks: ${picksError.message}`);
  return host ? { ...host, picks: picks ?? [] } : null;
}

/** Everything about one operator, for the admin edit page. Callers must check the admin role first. */
export async function getOperatorForAdmin(id: string) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("operators")
    .select(
      "*, operator_private(contact_email, contact_phone, terms_accepted_at), operator_members(user_id, is_owner, profiles(full_name, phone)), experiences(id, title, status, price_cents, is_group_price, updated_at)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`operator: ${error.message}`);
  return data ? { ...data, experiences: [...data.experiences].sort((a, b) => b.updated_at.localeCompare(a.updated_at)) } : null;
}

export type MemberLogin = { userId: string; isOwner: boolean; name: string | null; phone: string | null; email: string | null };

/** The people who sign in for a host or operator, with their login emails. Callers must check the admin role first. */
export async function getMemberLogins(
  members: { user_id: string; is_owner: boolean; profiles: { full_name: string | null; phone: string | null } | null }[],
): Promise<MemberLogin[]> {
  const db = createAdminClient();
  const users = await Promise.all(members.map((m) => db.auth.admin.getUserById(m.user_id)));
  return members
    .map((m, i) => ({
      userId: m.user_id,
      isOwner: m.is_owner,
      name: m.profiles?.full_name ?? null,
      phone: m.profiles?.phone ?? null,
      email: users[i].data.user?.email ?? null,
    }))
    .sort((a, b) => Number(b.isOwner) - Number(a.isOwner));
}
