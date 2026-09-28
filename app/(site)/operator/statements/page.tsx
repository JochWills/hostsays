import type { Metadata } from "next";
import { ReceiptText } from "lucide-react";
import { requireOperator } from "@/lib/portal";
import { ComingSoon, PageHeading } from "@/components/portal/ui";

export const metadata: Metadata = { title: "Statements", robots: { index: false, follow: false } };

export default async function OperatorStatements() {
  await requireOperator("/operator/statements");
  return (
    <>
      <PageHeading title="Statements" />
      <ComingSoon icon={ReceiptText} title="Nothing to show yet">
        <p>Each month you&rsquo;ll see your HostSays bookings, the deposits we collected and the balances you took on the day.</p>
      </ComingSoon>
    </>
  );
}
