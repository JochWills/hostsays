import { requireRole } from "@/lib/auth";
import { PortalShell } from "@/components/portal/portal-shell";

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const user = await requireRole("guest", "/account");
  return (
    <PortalShell role="guest" eyebrow="Your account" title={user.fullName ?? user.email}>
      {children}
    </PortalShell>
  );
}
