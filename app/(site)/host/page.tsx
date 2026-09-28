import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireHost } from "@/lib/portal";
import { getHostPicks, getHostSettings, getStorefrontVisits } from "@/lib/data/portal";
import { formatPercent } from "@/lib/format";
import { ApprovalStatus } from "@/components/site/approval-status";
import { PageHeading, StatCard, Step } from "@/components/portal/ui";
import { btnSecondary, panel, sectionTitle } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Host dashboard", robots: { index: false, follow: false } };

export default async function HostHome() {
  const { user, host } = await requireHost();
  const [settings, picks, visits] = await Promise.all([getHostSettings(host.id), getHostPicks(host.id), getStorefrontVisits(host.id)]);
  const verified = host.status === "verified";
  const first = user.fullName?.split(" ")[0];

  return (
    <>
      <PageHeading
        title={first ? `Hi ${first}` : "Overview"}
        intro="Recommend the experiences you love. When your guests book, you earn commission."
        actions={
          verified ? (
            <Link href={`/${host.slug}`} className={btnSecondary}>
              Your storefront <ExternalLink size={15} aria-hidden="true" />
            </Link>
          ) : undefined
        }
      />
      <ApprovalStatus membership={host} kind="host" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Storefront visits" value={visits} note="Last 30 days" />
        <StatCard label="Your picks" value={picks.length} href="/host/picks" />
        <StatCard label="Commission earned" value="R0" note={`Your rate: ${formatPercent(Number(settings.commission_rate))} of each booking`} href="/host/earnings" />
      </div>

      <section className={`${panel} mt-6`}>
        <h2 className={sectionTitle}>Set up your storefront</h2>
        <ol className="mt-2 divide-y divide-line">
          <Step done title="Create your account" />
          <Step done={verified} title="Get verified by HostSays">
            We check your listing, usually within two working days, and email you.
          </Step>
          <Step done={Boolean(settings.photo_path && settings.welcome_note)} title="Add a photo and welcome note" href="/host/storefront">
            Guests see these at the top of your storefront.
          </Step>
          <Step done={picks.length >= 3} title="Recommend at least 3 experiences" href="/host/picks">
            {verified ? "Pick the ones you'd send your own friends to, with a short tip." : "You can add picks once you're verified."}
          </Step>
          <Step done={false} title="Share your storefront with guests" href="/host/share">
            A link and QR code for your welcome message, room card or booking confirmation.
          </Step>
        </ol>
      </section>
    </>
  );
}
