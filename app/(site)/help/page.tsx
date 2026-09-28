import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/site/prose-page";
import {
  CONFIRM_WINDOW_HOURS,
  DEPOSIT_RATE,
  FREE_CANCELLATION_DAYS,
  HOST_COMMISSION_RATE,
  PAYMENT_WINDOW_HOURS,
  TIP_MAX_LENGTH,
} from "@/lib/config";
import { formatPercent } from "@/lib/format";

export const metadata: Metadata = {
  title: "Help and questions",
  description: "Answers for guests, hosts and operators: booking, deposits, cancellations, commission and payouts.",
  alternates: { canonical: "/help" },
};

const deposit = formatPercent(DEPOSIT_RATE);

const SECTIONS: { title: string; items: { q: string; a: React.ReactNode }[] }[] = [
  {
    title: "Guests",
    items: [
      {
        q: "Do I pay when I send a request?",
        a: `No. Sending a request is free. You only pay a ${deposit} deposit once the operator confirms.`,
      },
      {
        q: "How long does confirmation take?",
        a: `Operators have ${CONFIRM_WINDOW_HOURS} hours to accept or decline. We email you as soon as they do.`,
      },
      {
        q: "How long do I have to pay the deposit?",
        a: `${PAYMENT_WINDOW_HOURS} hours after the booking is confirmed. After that the spot is released.`,
      },
      {
        q: "Is the deposit extra?",
        a: "No. It counts toward the total. You pay the rest directly to the operator on the day.",
      },
      {
        q: "Can I cancel?",
        a: (
          <>
            Yes. Cancel {FREE_CANCELLATION_DAYS} or more days before and your deposit is refunded in full. Within{" "}
            {FREE_CANCELLATION_DAYS} days the deposit isn&rsquo;t refundable. If the operator cancels, you always get a full
            refund. <Link href="/cancellations">Full policy</Link>
          </>
        ),
      },
      {
        q: "Do I need an account?",
        a: "No. Every email links to your own booking page where you can pay, see your voucher or cancel.",
      },
      {
        q: "Why is there a “Where are you staying?” question?",
        a: "So your host gets credit for recommending the experience. It doesn't change your price. Choose “Somewhere else” if your stay isn't listed.",
      },
    ],
  },
  {
    title: "Hosts",
    items: [
      {
        q: "What does it cost?",
        a: `Nothing. You earn ${formatPercent(HOST_COMMISSION_RATE)} of the booking total when a guest you referred books.`,
      },
      {
        q: "When do I get paid?",
        a: "Monthly by EFT, in the first week of the month, for completed bookings from the month before.",
      },
      {
        q: "How do guests get linked to me?",
        a: "When a guest opens your page, link or QR code, you're pre-selected as their stay when they book. The guest can change it.",
      },
      {
        q: "How long can a tip be?",
        a: `Up to ${TIP_MAX_LENGTH} characters. Keep it practical: when to go, what to bring, what not to miss.`,
      },
    ],
  },
  {
    title: "Operators",
    items: [
      {
        q: "What does it cost to list?",
        a: `Nothing upfront and no monthly fee. The guest's ${deposit} deposit is our fee, on completed bookings.`,
      },
      {
        q: "Who collects the balance?",
        a: "You do, directly from the guest on the day.",
      },
      {
        q: "What if I need to cancel, for example for weather?",
        a: "Cancel from your portal with a reason. The guest gets a full refund and we suggest alternatives.",
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <ProsePage title="Help" intro="Quick answers for guests, hosts and operators.">
      {SECTIONS.map((s) => (
        <section key={s.title} aria-label={s.title}>
          <h2>{s.title}</h2>
          <div className="mt-3 divide-y divide-line rounded-[14px] bg-surface shadow-card">
            {s.items.map((i) => (
              <details key={i.q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {i.q}
                  <span aria-hidden="true" className="text-[20px] leading-none text-muted transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="mt-2 text-muted [&_a]:text-green">{i.a}</div>
              </details>
            ))}
          </div>
        </section>
      ))}
    </ProsePage>
  );
}
