import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { requireHost } from "@/lib/portal";
import { getHostSettings } from "@/lib/data/portal";
import { formatPercent } from "@/lib/format";
import { ComingSoon, PageHeading } from "@/components/portal/ui";

export const metadata: Metadata = { title: "Earnings", robots: { index: false, follow: false } };

export default async function HostEarnings() {
  const { host } = await requireHost("/host/earnings");
  const s = await getHostSettings(host.id);
  return (
    <>
      <PageHeading title="Earnings" />
      <ComingSoon icon={Wallet} title="No bookings yet" action={s.bank ? undefined : { href: "/host/settings#bank", label: "Add your bank details" }}>
        <p>
          You earn {formatPercent(Number(s.commission_rate))} of every booking made by a guest staying with you. Bookings,
          monthly statements and payouts will show here.
        </p>
        <p>We pay by EFT in the first week of each month, for trips that happened the month before.</p>
      </ComingSoon>
    </>
  );
}
