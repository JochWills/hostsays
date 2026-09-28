import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { AccountSettings } from "@/components/portal/account-settings";
import { PageHeading } from "@/components/portal/ui";

export const metadata: Metadata = { title: "Settings", robots: { index: false, follow: false } };

export default async function GuestSettings() {
  const user = await requireRole("guest", "/account/settings");
  return (
    <>
      <PageHeading title="Settings" />
      <AccountSettings user={user} />
    </>
  );
}
