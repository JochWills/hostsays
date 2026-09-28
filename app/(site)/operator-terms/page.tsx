import type { Metadata } from "next";
import { ProsePage } from "@/components/site/prose-page";
import { CONFIRM_WINDOW_HOURS, DEPOSIT_RATE, STRIKE_LIMIT, STRIKE_WINDOW_DAYS } from "@/lib/config";
import { formatPercent } from "@/lib/format";

export const metadata: Metadata = {
  title: "Operator agreement",
  alternates: { canonical: "/operator-terms" },
};

export default function OperatorTermsPage() {
  const rate = formatPercent(DEPOSIT_RATE);
  return (
    <ProsePage title="Operator agreement" placeholder>
      <p>The final agreement will cover these points. Operators accept it before their listings go live.</p>
      <h2>Commission</h2>
      <p>
        HostSays earns {rate} of the booking total, collected as the guest&rsquo;s deposit. The guest pays you the balance
        directly on the day.
      </p>
      <h2>Responding to requests</h2>
      <p>Accept or decline requests within {CONFIRM_WINDOW_HOURS} hours. Unanswered requests expire.</p>
      <h2>Cancellations and reliability</h2>
      <p>
        If you cancel a paid booking, the guest gets a full refund. Expired requests and cancellations (other than for
        weather) count as strikes. {STRIKE_LIMIT} strikes in {STRIKE_WINDOW_DAYS} days leads to a review of your account.
      </p>
      <h2>Listings</h2>
      <p>We review new listings and changes to live listings before they&rsquo;re published. Availability changes are instant.</p>
    </ProsePage>
  );
}
