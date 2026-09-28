"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const decision = z.object({
  kind: z.enum(["host", "operator"]),
  id: z.uuid(),
  verdict: z.enum(["verified", "rejected"]),
});

/** Admin verifies or rejects a pending host or operator. Only changes rows that are still pending. */
export async function decideApplication(form: FormData) {
  await requireRole("admin", "/admin");
  const parsed = decision.safeParse({ kind: form.get("kind"), id: form.get("id"), verdict: form.get("verdict") });
  if (!parsed.success) return;

  const { kind, id, verdict } = parsed.data;
  const db = createAdminClient();
  const { error } =
    kind === "host"
      ? await db
          .from("hosts")
          .update({ status: verdict, verified_at: verdict === "verified" ? new Date().toISOString() : null })
          .eq("id", id)
          .eq("status", "pending")
      : await db.from("operators").update({ status: verdict }).eq("id", id).eq("status", "pending");
  if (error) throw new Error(`Couldn't update ${kind}: ${error.message}`);

  revalidatePath("/admin");
  // Verified hosts and operators appear on public pages (cached for up to 5 minutes otherwise).
  if (verdict === "verified") revalidatePath("/", "layout");
}
