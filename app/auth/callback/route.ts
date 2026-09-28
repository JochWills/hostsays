import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { homeForRole, safeNext } from "@/lib/auth";
import { backToLogin } from "@/lib/auth-routes";
import { publicUrl } from "@/lib/request-url";
import { completeSignup } from "@/lib/signup";

/**
 * Where emailed links land (sign-in links and sign-up confirmations): swaps the one-time code for a session,
 * finishes a new sign-up, then sends the user to their portal.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeNext(params.get("next"));
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  const { data, error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { data: { user: null }, error: new Error("missing code") };

  if (error || !data.user) {
    // A confirmation link opened on another device still confirms the email (Supabase does that before
    // redirecting here), it just can't sign in on this one. So point them to the password form.
    return backToLogin(request, params.get("signup") ? { error: "confirm-elsewhere" } : { error: "link", next });
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  const role = profile?.role ?? (await completeSignup(data.user));
  if (!role) {
    await supabase.auth.signOut();
    return backToLogin(request, { error: "no-account" });
  }
  return NextResponse.redirect(publicUrl(next ?? homeForRole(role), request));
}
