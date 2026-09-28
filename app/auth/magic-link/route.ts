import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth";
import { backToLogin, isSameOrigin } from "@/lib/auth-routes";
import { absoluteUrl } from "@/lib/site";
import { magicLinkRequest } from "@/lib/validation/auth";

/** Emails a one-time sign-in link to an existing account (form POST from /login). Never creates accounts. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new NextResponse(null, { status: 403 });

  const form = await request.formData();
  const next = safeNext(form.get("next"));
  const parsed = magicLinkRequest.safeParse({ email: form.get("email") });
  if (!parsed.success) return backToLogin(request, { error: "email", email: String(form.get("email") ?? ""), next });

  const { email } = parsed.data;
  const callback = new URL(absoluteUrl("/auth/callback"));
  if (next) callback.searchParams.set("next", next);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: callback.toString() },
  });
  if (error?.status === 429) return backToLogin(request, { error: "rate", email, next });

  // Same message whether or not the email has an account, so the form can't be used to find out.
  return backToLogin(request, { sent: "1", email, next });
}
