import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { PortalPlaceholder } from "@/components/site/portal-placeholder";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminHome() {
  const user = await requireRole("admin", "/admin");
  return (
    <PortalPlaceholder user={user} title="Admin">
      <p>You&rsquo;re signed in as an admin. Approvals, bookings, payouts and content tools arrive in Phase 7.</p>
    </PortalPlaceholder>
  );
}
