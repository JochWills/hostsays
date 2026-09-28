import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { getMyHost } from "@/lib/data/portal";
import { ApprovalStatus } from "@/components/site/approval-status";
import { PortalPlaceholder } from "@/components/site/portal-placeholder";

export const metadata: Metadata = { title: "Host dashboard", robots: { index: false, follow: false } };

export default async function HostHome() {
  const user = await requireRole("host", "/host");
  const host = await getMyHost(user.id);
  return (
    <PortalPlaceholder user={user} title="Host dashboard">
      <ApprovalStatus membership={host} kind="host" />
      <p>
        Your dashboard is on its way. Soon you&rsquo;ll manage your picks, share your storefront and track your
        earnings here.
      </p>
    </PortalPlaceholder>
  );
}
