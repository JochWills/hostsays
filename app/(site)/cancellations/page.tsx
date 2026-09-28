import type { Metadata } from "next";
import { ProsePage } from "@/components/site/prose-page";
import { FREE_CANCELLATION_DAYS } from "@/lib/config";
import { CANCELLATION_POLICY } from "@/lib/policy";

export const metadata: Metadata = {
  title: "Cancellation policy",
  description: CANCELLATION_POLICY,
  alternates: { canonical: "/cancellations" },
};

export default function CancellationsPage() {
  const d = FREE_CANCELLATION_DAYS;
  return (
    <ProsePage title="Cancellation policy" intro={CANCELLATION_POLICY} placeholder>
      <h2>If you cancel</h2>
      <ul>
        <li>
          <strong>Before the operator confirms, or before you&rsquo;ve paid:</strong> cancel any time. Nothing was paid, so
          there&rsquo;s nothing to refund.
        </li>
        <li>
          <strong>{d} or more days before the experience:</strong> your deposit is refunded in full.
        </li>
        <li>
          <strong>Within {d} days of the experience:</strong> the deposit isn&rsquo;t refundable.
        </li>
        <li>
          <strong>If you don&rsquo;t show up:</strong> the deposit isn&rsquo;t refundable.
        </li>
      </ul>
      <p>Days are counted in South African time. Your booking page always shows exactly what will happen before you confirm a cancellation.</p>
      <h2>If the operator cancels</h2>
      <p>
        For any reason, including weather, you get your full deposit back, and we&rsquo;ll suggest other experiences you
        might like.
      </p>
      <h2>The balance</h2>
      <p>
        You pay the balance directly to the operator on the day, so HostSays doesn&rsquo;t hold it. Some operators have
        their own terms for the balance if you cancel late. These are shown on the experience page before you book.
      </p>
      <h2>Refunds</h2>
      <p>Refunds go back to the card you paid with. Your bank decides how long it takes to show.</p>
    </ProsePage>
  );
}
