import type { Metadata } from "next";
import { CalendarCheck } from "lucide-react";
import { requireOperator } from "@/lib/portal";
import { ComingSoon, PageHeading } from "@/components/portal/ui";

export const metadata: Metadata = { title: "Bookings", robots: { index: false, follow: false } };

export default async function OperatorBookings() {
  await requireOperator("/operator/bookings");
  return (
    <>
      <PageHeading title="Bookings" />
      <ComingSoon icon={CalendarCheck} title="No bookings yet">
        <p>
          Paid bookings will show here with the guest&rsquo;s details and the balance to collect on the day. After each trip,
          you&rsquo;ll mark it as done or a no-show.
        </p>
      </ComingSoon>
    </>
  );
}
