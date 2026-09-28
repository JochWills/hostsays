import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, homeForRole, safeNext } from "@/lib/auth";
import { firstValues } from "@/lib/validation/explore";
import { btnPrimary, btnSecondary, input, label, pageTitle, panel } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  invalid: "That email and password don't match. Check them, or email yourself a sign-in link instead.",
  email: "Enter the email address you use for HostSays.",
  unconfirmed: "Please confirm your email address first. Check your inbox for the confirmation email.",
  rate: "Too many attempts. Please wait a minute and try again.",
  link: "That sign-in link has expired or was already used. Request a new one below.",
  "no-account": "This email doesn't have a HostSays account yet. Sign up below.",
  "confirm-elsewhere": "Your email is confirmed. Sign in below with the password you chose.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = firstValues(await searchParams);
  const next = safeNext(params.next);

  const user = await getCurrentUser();
  if (user?.role) redirect(next ?? homeForRole(user.role));

  const error = params.error ? (ERRORS[params.error] ?? ERRORS.invalid) : null;
  const sent = params.sent === "1";

  return (
    <div className="wrap flex justify-center pt-10 pb-16 sm:pt-16">
      <div className="w-full max-w-[420px]">
        <h1 className={pageTitle}>Sign in</h1>
        <p className="mt-2 text-[15px] text-muted">
          For travellers, hosts and tourism operators. You don&rsquo;t need an account to book: your booking link
          is always in your email.
        </p>

        {params["signed-out"] && !error && !sent && (
          <p role="status" className="mt-5 rounded-[10px] bg-green/10 px-4 py-3 text-[14px]">
            You&rsquo;re signed out.
          </p>
        )}
        {sent && (
          <p role="status" className="mt-5 rounded-[10px] bg-green/10 px-4 py-3 text-[14px]">
            If <strong>{params.email}</strong> has a HostSays account, a sign-in link is on its way. Open it on this
            device. It works once and expires in an hour.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-5 rounded-[10px] border border-gold/50 bg-gold/10 px-4 py-3 text-[14px]">
            {error}
          </p>
        )}

        <form method="post" action="/auth/sign-in" className={`${panel} mt-6 space-y-4`}>
          {next && <input type="hidden" name="next" value={next} />}
          <div>
            <label htmlFor="email" className={label}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={params.email ?? ""}
              className={input}
            />
          </div>
          <div>
            <label htmlFor="password" className={label}>
              Password
            </label>
            <input id="password" name="password" type="password" autoComplete="current-password" className={input} />
          </div>
          <button type="submit" className={`${btnPrimary} w-full`}>
            Sign in
          </button>
          <div className="flex items-center gap-3 text-[12.5px] text-muted" aria-hidden="true">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>
          <button type="submit" formAction="/auth/magic-link" formNoValidate className={`${btnSecondary} w-full`}>
            Email me a sign-in link
          </button>
        </form>

        <p className="mt-6 text-[14px] text-muted">
          New to HostSays?{" "}
          <Link href="/signup" className="font-semibold text-green hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
