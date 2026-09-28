import type { Metadata } from "next";
import { Luggage } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { ComingSoon, PageHeading } from "@/components/portal/ui";

export const metadata: Metadata = { title: "Your trips", robots: { index: false, follow: false } };

export default async function GuestTrips() {
  await requireRole("guest", "/account");
  return (
    <>
      <PageHeading title="Your trips" />
      <ComingSoon icon={Luggage} title="Bookings open soon" action={{ href: "/explore", label: "Explore experiences" }}>
        <p>Once bookings open, every trip you book with this email address will show here: requests, vouchers and receipts.</p>
      </ComingSoon>
    </>
  );
}
