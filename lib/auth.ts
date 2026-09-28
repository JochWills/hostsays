import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Enum } from "@/lib/supabase/types";

export type Role = Enum<"user_role">;

export type CurrentUser = { id: string; email: string; role: Role | null; fullName: string | null };

/** The signed-in user and their role (null role: an auth user with no HostSays profile). */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle();
  return { id: user.id, email: user.email ?? "", role: profile?.role ?? null, fullName: profile?.full_name ?? null };
}

export function homeForRole(role: Role | null): string {
  if (role === "admin") return "/admin";
  if (role === "host") return "/host";
  if (role === "operator") return "/operator";
  if (role === "guest") return "/account";
  return "/";
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
