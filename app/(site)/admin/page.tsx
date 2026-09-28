import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { getAdminCounts } from "@/lib/data/portal";
import { PageHeading, StatCard } from "@/components/portal/ui";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminHome() {
  await requireRole("admin", "/admin");
  const c = await getAdminCounts();
  return (
    <>
      <PageHeading title="Overview" intro="Where HostSays stands today." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Waiting for you"
          value={c.pendingTotal}
          note={`${c.pendingHosts} hosts · ${c.pendingOperators} operators · ${c.pendingListings} listings`}
          href="/admin/approvals"
        />
        <StatCard label="Live experiences" value={c.liveExperiences} href="/admin/experiences" />
        <StatCard label="Bookings today" value="—" note="Bookings open soon" href="/admin/bookings" />
        <StatCard label="Verified hosts" value={c.verifiedHosts} href="/admin/hosts" />
        <StatCard label="Verified operators" value={c.verifiedOperators} href="/admin/operators" />
        <StatCard label="Traveller accounts" value={c.guests} />
      </div>
    </>
  );
}
