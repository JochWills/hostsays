"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { invalid, type FormState } from "@/lib/form-state";
import { passwordUpdate, profileUpdate } from "@/lib/validation/portal";

/** Your name and phone (any role). */
export async function updateProfile(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in again." };
  const parsed = profileUpdate.safeParse({ fullName: form.get("fullName"), phone: form.get("phone") });
  if (!parsed.success) return invalid(parsed.error, form);

  const db = await createClient();
  const { error } = await db
    .from("profiles")
    .update({ full_name: parsed.data.fullName, phone: parsed.data.phone || null })
    .eq("id", user.id);
  if (error) return { error: "Couldn't save. Please try again." };
  revalidatePath("/", "layout");
  return { ok: "Saved" };
}

/** Set or change your password (accounts made by invite or emailed link may not have one yet). */
export async function updatePassword(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in again." };
  const parsed = passwordUpdate.safeParse({ password: form.get("password"), confirm: form.get("confirm") });
  if (!parsed.success) return { errors: invalid(parsed.error, form).errors };

  const db = await createClient();
  const { error } = await db.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "weak_password") return { errors: { password: "Please choose a stronger password." } };
    if (error.code === "same_password") return { errors: { password: "That's already your password." } };
    if (error.code === "reauthentication_needed") {
      return { error: "For your security, sign out and back in (with an emailed link), then set your password." };
    }
    console.error("updatePassword failed", error.status, error.code);
    return { error: "Couldn't change your password. Please try again." };
  }
  return { ok: "Password saved" };
}
