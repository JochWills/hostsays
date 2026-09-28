import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/site/prose-page";

export const metadata: Metadata = {
  title: "Terms of service",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <ProsePage title="Terms of service" placeholder>
      <p>These are the main points the final terms will cover.</p>
      <h2>HostSays is a booking intermediary</h2>
      <p>
        HostSays helps you find and request experiences. The experiences are provided by independent operators, who are
        responsible for running them safely and as described.
      </p>
      <h2>Bookings and payment</h2>
      <p>
        A request isn&rsquo;t a booking until the operator confirms and you pay the deposit online. The balance is paid
        directly to the operator on the day.
      </p>
      <h2>Cancellations</h2>
      <p>
        See the <Link href="/cancellations">cancellation policy</Link>.
      </p>
      <h2>Host recommendations</h2>
      <p>Hosts earn a commission when you book through them. It doesn&rsquo;t change your price.</p>
    </ProsePage>
  );
}
