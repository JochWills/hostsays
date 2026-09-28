"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homeForRole } from "@/lib/auth";
import { completeSignup } from "@/lib/signup";
import { absoluteUrl } from "@/lib/site";
import { signupCredentials, signupDetails } from "@/lib/validation/auth";

export type SignupState = {
  /** Field name → message. `form` is for errors that aren't about one field. */
  errors?: Record<string, string>;
  /** What the person typed (never the password), so the form keeps it after an error. */
  values?: Record<string, string>;
  /** Set once the confirmation email has been requested. */
  sentTo?: string;
};

const FIELDS = ["type", "fullName", "name", "hostType", "areaId", "listingUrl", "website", "phone", "email"] as const;

export async function signUp(_prev: SignupState, form: FormData): Promise<SignupState> {
  const values = Object.fromEntries(FIELDS.map((f) => [f, String(form.get(f) ?? "")]));

  const details = signupDetails.safeParse(values);
  const credentials = signupCredentials.safeParse({
    email: form.get("email"),
    password: form.get("password"),
    agree: form.get("agree"),
  });
  if (!details.success || !credentials.success) {
    const errors: Record<string, string> = {};
    const issues = [
      ...(details.success ? [] : details.error.issues),
      ...(credentials.success ? [] : credentials.error.issues),
    ];
    for (const issue of issues) {
      const key = String(issue.path[0] ?? "form");
      errors[key] ??= issue.message;
    }
    return { errors, values };
  }

  const { email, password } = credentials.data;
  const callback = new URL(absoluteUrl("/auth/callback"));
  callback.searchParams.set("signup", "1");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { signup: details.data }, emailRedirectTo: callback.toString() },
  });

  if (error) {
    if (error.code === "weak_password") {
      return { errors: { password: "Please choose a stronger password. This one is too easy to guess." }, values };
    }
    if (error.code === "email_address_invalid") {
      return { errors: { email: "We can't send email to this address. Please check it." }, values };
    }
    if (error.code === "user_already_exists") {
      return { errors: { form: "This email already has an account. Sign in instead." }, values };
    }
    if (error.status === 429) {
      return { errors: { form: "Too many sign-ups right now. Please wait a few minutes and try again." }, values };
    }
    console.error("signUp failed", error.status, error.code, error.message);
    return { errors: { form: "We couldn't create your account just now. Please try again in a few minutes." }, values };
  }

  // Email confirmation switched off (local development): signed in already, so finish now.
  if (data.session && data.user) {
    const role = await completeSignup(data.user);
    redirect(homeForRole(role));
  }

  // Otherwise the confirmation email is on its way. (If the email already had an account, Supabase
  // sends nothing and returns the same answer, so this can't be used to find out who has an account.)
  return { sentTo: email };
}
