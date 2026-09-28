import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { PortalPlaceholder } from "@/components/site/portal-placeholder";

export const metadata: Metadata = { title: "Operator dashboard", robots: { index: false, follow: false } };

export default async function OperatorHome() {
  const user = await requireRole("operator", "/operator");
  return (
    <PortalPlaceholder user={user} title="Operator dashboard">
      <p>
        Your dashboard is on its way. Soon you&rsquo;ll accept booking requests, manage your experiences and set your
        availability here.
      </p>
    </PortalPlaceholder>
  );
}
