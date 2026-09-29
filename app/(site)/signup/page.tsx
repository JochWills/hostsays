import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BedDouble, Compass, MailCheck, UserRound } from "lucide-react";
import { getCurrentUser, homeForRole } from "@/lib/auth";
import { getAreaChoices } from "@/lib/data/public";
import { firstValues } from "@/lib/validation/explore";
import { ACCOUNT_TYPES, type AccountType } from "@/lib/validation/auth";
import { pageTitle, panel } from "@/components/ui/styles";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Sign up",
  robots: { index: false, follow: false },
};

const CHOICES: { type: AccountType; icon: typeof UserRound; title: string; text: string }[] = [
  {
    type: "guest",
    icon: UserRound,
    title: "I'm travelling",
    text: "Keep your bookings in one place. Optional: you can always book without an account.",
  },
  {
    type: "host",
    icon: BedDouble,
    title: "I host guests",
    text: "Guesthouses, B&Bs, self-catering, Airbnbs, lodges and hotels. Recommend local experiences and earn commission.",
  },
  {
    type: "operator",
    icon: Compass,
    title: "I run tours or activities",
    text: "Safaris, ocean trips, adventures and more. Get bookings from travellers and the hosts they trust.",
  },
];

const INTRO: Record<AccountType, React.ReactNode> = {
  guest: "Save time on your next booking and see all your trips in one place.",
  host: (
    <>
      Tell us about your place. We check every host before their storefront goes live, usually within two working
      days.
    </>
  ),
  operator: (
    <>
      Tell us about your business. We check every operator before they go live, usually within two working days. You
      can set up your experiences while you wait.
    </>
  ),
};

const TITLES: Record<AccountType, string> = {
  guest: "Create your account",
  host: "Join as a host",
  operator: "List your experiences",
};

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const user = await getCurrentUser();
  if (user?.role) redirect(homeForRole(user.role));

  const params = firstValues(await searchParams);
  const type = ACCOUNT_TYPES.find((t) => t === params.as);

  if (params.sent) {
    return (
      <div className="wrap flex justify-center pt-10 pb-16 sm:pt-16">
        <div role="status" className={`${panel} w-full max-w-[460px] text-[15px]`}>
          <MailCheck size={28} strokeWidth={1.8} className="text-green" aria-hidden="true" />
          <h1 className="mt-3 text-[22px] font-extrabold tracking-[-0.02em]">Check your email</h1>
          <p className="mt-2">
            We&rsquo;ve sent a link to {params.email ? <strong>{params.email}</strong> : "your email"}. Tap it on this
            device to confirm your email and finish signing up. It expires in an hour.
          </p>
          <p className="mt-3 text-[14px] text-muted">
            Nothing there? Check your spam folder. If you already have an account with this email,{" "}
            <Link href="/login" className="font-semibold text-green hover:underline">
              sign in
            </Link>{" "}
            instead.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap flex justify-center pt-10 pb-16 sm:pt-16">
      <div className={`w-full ${type ? "max-w-[460px]" : "max-w-[720px]"}`}>
        {type ? (
          <>
            <Link href="/signup" className="text-[14px] font-semibold text-green hover:underline">
              &larr; Choose a different account type
            </Link>
            <h1 className={`${pageTitle} mt-3`}>{TITLES[type]}</h1>
            <p className="mt-2 text-[15px] text-muted">{INTRO[type]}</p>
            <SignupForm type={type} provinces={type === "guest" ? [] : await getAreaChoices()} />
          </>
        ) : (
          <>
            <h1 className={pageTitle}>Sign up</h1>
            <p className="mt-2 text-[15px] text-muted">Which of these sounds like you?</p>
            <ul className="mt-6 grid gap-3.5">
              {CHOICES.map(({ type, icon: Icon, title, text }) => (
                <li key={type}>
                  <Link
                    href={`/signup?as=${type}`}
                    className={`${panel} group flex items-center gap-4 border border-transparent hover:border-green`}
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-green/10 text-green">
                      <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-bold">{title}</span>
                      <span className="mt-0.5 block text-[14px] text-muted">{text}</span>
                    </span>
                    <ArrowRight size={18} className="shrink-0 text-muted group-hover:text-green" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="mt-6 text-[14px] text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-green hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
