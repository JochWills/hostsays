import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { AccountSettings } from "@/components/portal/account-settings";
import { PageHeading } from "@/components/portal/ui";

export const metadata: Metadata = { title: "Settings", robots: { index: false, follow: false } };

export default async function AdminSettings() {
  const user = await requireRole("admin", "/admin/settings");
  return (
    <>
      <PageHeading title="Settings" />
      <AccountSettings user={user} />
    </>
  );
}
