import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { homeForRole, safeNext } from "@/lib/auth";
import { backToLogin, isSameOrigin } from "@/lib/auth-routes";
import { completeSignup } from "@/lib/signup";
import { passwordSignIn } from "@/lib/validation/auth";

/** Email + password sign-in (form POST from /login). */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new NextResponse(null, { status: 403 });

  const form = await request.formData();
  const next = safeNext(form.get("next"));
  const parsed = passwordSignIn.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return backToLogin(request, { error: "invalid", email: String(form.get("email") ?? ""), next });

  const { email, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    const code = error?.code === "email_not_confirmed" ? "unconfirmed" : error?.status === 429 ? "rate" : "invalid";
    return backToLogin(request, { error: code, email, next });
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  // No profile yet: a sign-up confirmed on another device finishes here.
  const role = profile?.role ?? (await completeSignup(data.user));
  if (!role) {
    await supabase.auth.signOut();
    return backToLogin(request, { error: "no-account", email });
  }
  return NextResponse.redirect(new URL(next ?? homeForRole(role), request.url), 303);
}
