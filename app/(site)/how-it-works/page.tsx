import type { Metadata } from "next";
import Link from "next/link";
import { HowSteps } from "@/components/home/how-steps";
import { ProsePage } from "@/components/site/prose-page";
import { CONFIRM_WINDOW_HOURS, DEPOSIT_RATE, PAYMENT_WINDOW_HOURS } from "@/lib/config";
import { formatPercent } from "@/lib/format";
import { CANCELLATION_POLICY } from "@/lib/policy";

export const metadata: Metadata = {
  title: "How booking works",
  description: "Request a booking for free, pay a small deposit once the operator confirms, and pay the rest on the day.",
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorksPage() {
  const deposit = formatPercent(DEPOSIT_RATE);
  return (
    <>
      <ProsePage
        title="How booking works"
        intro="Find something a local host recommends, send a request, and only pay once it's confirmed."
      >
        <h2>1. Send a request</h2>
        <p>
          Pick a date, time and group size and tell us where you&rsquo;re staying. Sending a request is free and there&rsquo;s
          no payment at this point.
        </p>
        <h2>2. The operator confirms</h2>
        <p>
          The operator has {CONFIRM_WINDOW_HOURS} hours to accept. We email you either way. If they can&rsquo;t take the
          booking, we&rsquo;ll suggest similar experiences.
        </p>
        <h2>3. Pay a {deposit} deposit</h2>
        <p>
          Once confirmed, you have {PAYMENT_WINDOW_HOURS} hours to pay a {deposit} deposit online to lock in your spot. The
          deposit counts toward the price, so you never pay more than the listed price.
        </p>
        <h2>4. Go and enjoy it</h2>
        <p>Pay the balance directly to the operator on the day. Your booking page shows exactly how much.</p>
        <h2>Cancellations</h2>
        <p>{CANCELLATION_POLICY}</p>
        <p>
          <Link href="/cancellations">Read the full cancellation policy</Link>
        </p>
        <h2>No accounts needed</h2>
        <p>
          Every email we send links to your own booking page, where you can check the status, pay, see your voucher or
          cancel.
        </p>
        <h2>Why hosts recommend</h2>
        <p>
          Local hosts pick the experiences they&rsquo;d send their own guests on. Hosts earn a commission when you book
          through them. It doesn&rsquo;t change your price.
        </p>
      </ProsePage>
      <div className="wrap">
        <HowSteps id="how-steps" />
        <p className="mt-6">
          <Link href="/explore" className="font-semibold text-green hover:underline">Find something to do →</Link>
        </p>
      </div>
    </>
  );
}
