import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { PortalPlaceholder } from "@/components/site/portal-placeholder";

export const metadata: Metadata = { title: "Your account", robots: { index: false, follow: false } };

export default async function GuestAccount() {
  const user = await requireRole("guest", "/account");
  return (
    <PortalPlaceholder user={user} title="Your account">
      <p>
        Welcome! Your bookings will show here once bookings open. Until then,{" "}
        <Link href="/explore" className="font-semibold text-green hover:underline">
          explore experiences
        </Link>{" "}
        recommended by local hosts.
      </p>
    </PortalPlaceholder>
  );
}
