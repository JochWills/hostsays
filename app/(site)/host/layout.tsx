import { requireHost } from "@/lib/portal";
import { PortalShell } from "@/components/portal/portal-shell";

export default async function HostLayout({ children }: LayoutProps<"/host">) {
  const { host } = await requireHost();
  return (
    <PortalShell role="host" eyebrow="Host" title={host.name} status={host.status}>
      {children}
    </PortalShell>
  );
}
