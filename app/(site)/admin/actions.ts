"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Enum } from "@/lib/supabase/types";

/** Public pages that list hosts, operators or experiences (otherwise cached for up to 5 minutes). */
function refreshSite() {
  revalidatePath("/", "layout");
}

const accountDecision = z.object({
  kind: z.enum(["host", "operator"]),
  id: z.uuid(),
  status: z.enum(["verified", "rejected", "suspended"]),
});

/** Verify, reject or suspend a host or operator (and reinstate a suspended one with "verified"). */
export async function setAccountStatus(form: FormData) {
  await requireRole("admin", "/admin");
  const parsed = accountDecision.safeParse({ kind: form.get("kind"), id: form.get("id"), status: form.get("status") });
  if (!parsed.success) return;
  const { kind, id, status } = parsed.data;
  const db = createAdminClient();

  const { error } =
    kind === "host"
      ? await db
          .from("hosts")
          .update(status === "verified" ? { status, verified_at: new Date().toISOString() } : { status })
          .eq("id", id)
      : await db.from("operators").update({ status }).eq("id", id);
  if (error) throw new Error(`Couldn't update ${kind}: ${error.message}`);
  revalidatePath("/admin", "layout");
  refreshSite();
}

const listingDecision = z.object({ id: z.uuid(), status: z.enum(["live", "rejected", "paused"]) });

/** Approve (live), send back (rejected) or pause a listing. Approving only works on listings in review or paused. */
export async function setListingStatus(form: FormData) {
  await requireRole("admin", "/admin");
  const parsed = listingDecision.safeParse({ id: form.get("id"), status: form.get("status") });
  if (!parsed.success) return;
  const { id, status } = parsed.data;
  const from: Enum<"listing_status">[] = status === "live" ? ["pending_review", "paused"] : status === "rejected" ? ["pending_review"] : ["live"];
  const db = createAdminClient();
  const { error } = await db.from("experiences").update({ status }).eq("id", id).in("status", from);
  if (error) throw new Error(`Couldn't update listing: ${error.message}`);
  revalidatePath("/admin", "layout");
  refreshSite();
}
