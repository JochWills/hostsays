import type { Metadata } from "next";
import { Inbox } from "lucide-react";
import { requireOperator } from "@/lib/portal";
import { CONFIRM_WINDOW_HOURS } from "@/lib/config";
import { ComingSoon, PageHeading } from "@/components/portal/ui";

export const metadata: Metadata = { title: "Requests", robots: { index: false, follow: false } };

export default async function OperatorRequests() {
  await requireOperator("/operator/requests");
  return (
    <>
      <PageHeading title="Requests" />
      <ComingSoon icon={Inbox} title="Booking requests open soon">
        <p>
          When guests ask to book, their requests land here and in your email. You&rsquo;ll have {CONFIRM_WINDOW_HOURS} hours to
          accept, offer another time, or decline, with one tap from your phone.
        </p>
      </ComingSoon>
    </>
  );
}
