import "server-only";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { signupDetails } from "@/lib/validation/auth";
import type { Role } from "@/lib/auth";

/**
 * Turns a confirmed sign-up into a HostSays account: profile, plus a pending host or operator.
 * The details wait in the auth user's metadata until the email is confirmed, so an unconfirmed
 * (or someone else's) email never creates anything. Safe to call more than once.
 * Returns the role, or null if this user has no usable sign-up details.
 */
export async function completeSignup(user: User): Promise<Role | null> {
  if (!user.email || !user.email_confirmed_at) return null;
  const parsed = signupDetails.safeParse(user.user_metadata?.signup);
  if (!parsed.success) return null;

  const { type, ...data } = parsed.data;
  const db = createAdminClient();
  const call = () => db.rpc("complete_signup", { p_user_id: user.id, p_email: user.email!, p_type: type, p_data: data });

  let { data: role, error } = await call();
  // Two requests racing (e.g. link opened twice): the loser hits the profile's primary key; the retry returns the role.
  if (error?.code === "23505") ({ data: role, error } = await call());
  if (error) {
    console.error("complete_signup failed", error.code, error.message);
    return null;
  }
  return role;
}
