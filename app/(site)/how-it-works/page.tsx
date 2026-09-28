import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/site/prose-page";
import { CONFIRM_WINDOW_HOURS, DEPOSIT_RATE, OFFER_WINDOW_HOURS, PAYMENT_WINDOW_HOURS } from "@/lib/config";
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
          The operator has {CONFIRM_WINDOW_HOURS} hours to reply, and we email you either way. If your date is full, they
          can offer you other dates or times instead: pick one within {OFFER_WINDOW_HOURS} hours and it&rsquo;s confirmed. If
          none of them suit you, we&rsquo;ll suggest similar experiences.
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
        <h2>No account needed</h2>
        <p>
          Every email we send links to your own booking page, where you can check the status, pay, see your voucher or
          cancel. If you&rsquo;d like all your bookings in one place, you can <Link href="/signup?as=guest">create a free
          account</Link> any time.
        </p>
        <h2>Why hosts recommend</h2>
        <p>
          Local hosts pick the experiences they&rsquo;d send their own guests on. Hosts earn a commission when you book
          through them. It doesn&rsquo;t change your price.
        </p>
        <p>
          <Link href="/explore">Find something to do →</Link>
        </p>
      </ProsePage>
    </>
  );
}
