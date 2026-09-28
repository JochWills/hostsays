import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Enum } from "@/lib/supabase/types";

export type Role = Enum<"user_role">;

export type CurrentUser = { id: string; email: string; role: Role | null; fullName: string | null };

/**
 * Who's signed in, from the session token. getClaims() verifies it locally with the project's public
 * signing key (no network call per request). Cached for the request, so layouts and pages share it.
 */
export const getAuthUser = cache(async (): Promise<{ id: string; email: string } | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  return claims?.sub ? { id: claims.sub, email: typeof claims.email === "string" ? claims.email : "" } : null;
});

/** The signed-in user and their role (null role: an auth user with no HostSays profile). */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const auth = await getAuthUser();
  if (!auth) return null;
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", auth.id).maybeSingle();
  return { id: auth.id, email: auth.email, role: profile?.role ?? null, fullName: profile?.full_name ?? null };
});

export function homeForRole(role: Role | null): string {
  if (role === "admin") return "/admin";
  if (role === "host") return "/host";
  if (role === "operator") return "/operator";
  if (role === "guest") return "/account";
  return "/";
}

export function settingsForRole(role: Role | null): string {
  if (role === "guest") return "/account/settings";
  return role ? `${homeForRole(role)}/settings` : "/";
}

/** Only allow same-site paths as a post-login destination (no open redirects). */
export function safeNext(value: FormDataEntryValue | string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  return value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : null;
}

/** Portal guard: signed out → /login, wrong role → their own portal. */
export async function requireRole(role: Role, path: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(path)}`);
  if (user.role !== role) redirect(user.role ? homeForRole(user.role) : "/login?error=no-account");
  return user;
}
