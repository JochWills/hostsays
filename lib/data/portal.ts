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
