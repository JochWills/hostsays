import { requireRole } from "@/lib/auth";
import { getAdminCounts } from "@/lib/data/portal";
import { PortalShell } from "@/components/portal/portal-shell";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireRole("admin", "/admin");
  const counts = await getAdminCounts();
  return (
    <PortalShell role="admin" eyebrow="HostSays" title="Admin" badges={{ "/admin/approvals": counts.pendingTotal }}>
      {children}
    </PortalShell>
  );
}
