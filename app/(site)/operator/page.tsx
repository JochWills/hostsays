import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { getMyOperator } from "@/lib/data/portal";
import { ApprovalStatus } from "@/components/site/approval-status";
import { PortalPlaceholder } from "@/components/site/portal-placeholder";

export const metadata: Metadata = { title: "Operator dashboard", robots: { index: false, follow: false } };

export default async function OperatorHome() {
  const user = await requireRole("operator", "/operator");
  const operator = await getMyOperator(user.id);
  return (
    <PortalPlaceholder user={user} title="Operator dashboard">
      <ApprovalStatus membership={operator} kind="operator" />
      <p>
        Your dashboard is on its way. Soon you&rsquo;ll accept booking requests, manage your experiences and set your
        availability here.
      </p>
    </PortalPlaceholder>
  );
}
