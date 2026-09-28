import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { ComingSoon, PageHeading } from "@/components/portal/ui";

export const metadata: Metadata = { title: "Payouts", robots: { index: false, follow: false } };

export default async function AdminPayouts() {
  await requireRole("admin", "/admin/payouts");
  return (
    <>
      <PageHeading title="Payouts" />
      <ComingSoon icon={Wallet} title="No payouts yet">
        <p>On the 1st of each month, host commission for the previous month is drafted here. Export the CSV for the bank, then mark it paid.</p>
      </ComingSoon>
    </>
  );
}
