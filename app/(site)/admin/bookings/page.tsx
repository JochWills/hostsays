import type { Metadata } from "next";
import { CalendarCheck } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { ComingSoon, PageHeading } from "@/components/portal/ui";

export const metadata: Metadata = { title: "Bookings", robots: { index: false, follow: false } };

export default async function AdminBookings() {
  await requireRole("admin", "/admin/bookings");
  return (
    <>
      <PageHeading title="Bookings" />
      <ComingSoon icon={CalendarCheck} title="Bookings open soon">
        <p>Search every booking, see its payment and history, and step in when needed (change status, refund).</p>
      </ComingSoon>
    </>
  );
}
