import type { Metadata } from "next";
import Link from "next/link";
import { btnPrimary } from "@/components/ui/styles";
import { ProsePage } from "@/components/site/prose-page";
import { CONFIRM_WINDOW_HOURS, DEPOSIT_RATE } from "@/lib/config";
import { formatPercent } from "@/lib/format";

export const metadata: Metadata = {
  title: "For operators: reach travellers through local stays",
  description:
    "List your tour, safari or activity for free. No monthly fees: HostSays only earns on completed bookings.",
  alternates: { canonical: "/for-operators" },
};

export default function ForOperatorsPage() {
  const rate = formatPercent(DEPOSIT_RATE);
  const balance = formatPercent(1 - DEPOSIT_RATE);
  return (
    <ProsePage
      title={
        <>
          Reach travellers through <em className="font-serif font-semibold">trusted local stays.</em>
        </>
      }
      intro={`List your experience for free. No monthly fees: you only pay ${rate} on completed bookings, and we collect it for you.`}
    >
      <h2>How you get paid</h2>
      <p>
        When a booking is confirmed, the guest pays a {rate} deposit online. That&rsquo;s our fee, so there&rsquo;s nothing
        to invoice. The guest pays you the other {balance} directly on the day.
      </p>
      <h2>How bookings work</h2>
      <ul>
        <li>Guests send a request for a date, time and group size. Nothing is booked until you accept.</li>
        <li>You have {CONFIRM_WINDOW_HOURS} hours to accept or decline. We&rsquo;ll remind you before it expires.</li>
        <li>Once the guest pays the deposit, we send you their details and the balance to collect.</li>
        <li>After the trip, mark it completed (or a no-show).</li>
      </ul>
      <h2>Why HostSays</h2>
      <ul>
        <li>Guests find you through the guesthouses and hosts they trust, not a global list.</li>
        <li>Your listing shows how many local hosts recommend you, with their tips.</li>
        <li>You set your own prices, times, capacity and blackout dates.</li>
      </ul>
      <h2>Getting listed</h2>
      <p>
        We review every listing before it goes live. If you&rsquo;d rather not do the setup, we can build your listing for
        you and hand it over.
      </p>
      <p>
        <Link href="/signup?as=operator" className={`${btnPrimary} text-green-ink! no-underline!`}>
          Sign up as an operator
        </Link>
      </p>
    </ProsePage>
  );
}
