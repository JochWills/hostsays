import { requireOperator } from "@/lib/portal";
import { PortalShell } from "@/components/portal/portal-shell";

export default async function OperatorLayout({ children }: LayoutProps<"/operator">) {
  const { operator } = await requireOperator();
  return (
    <PortalShell role="operator" eyebrow="Operator" title={operator.name} status={operator.status}>
      {children}
    </PortalShell>
  );
}
