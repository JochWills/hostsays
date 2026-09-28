import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireOperator } from "@/lib/portal";
import { getOperatorExperiences, getOperatorSettings } from "@/lib/data/portal";
import { CONFIRM_WINDOW_HOURS } from "@/lib/config";
import { ApprovalStatus } from "@/components/site/approval-status";
import { PageHeading, StatCard, Step } from "@/components/portal/ui";
import { btnPrimary, panel, sectionTitle } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Operator dashboard", robots: { index: false, follow: false } };

export default async function OperatorHome() {
  const { user, operator } = await requireOperator();
  const [experiences, settings] = await Promise.all([getOperatorExperiences(operator.id), getOperatorSettings(operator.id)]);
  const count = (s: string) => experiences.filter((e) => e.status === s).length;
  const first = user.fullName?.split(" ")[0];

  return (
    <>
      <PageHeading
        title={first ? `Hi ${first}` : "Overview"}
        intro="Here's where your HostSays listings and bookings live."
        actions={
          <Link href="/operator/experiences/new" className={btnPrimary}>
            <Plus size={18} aria-hidden="true" /> New experience
          </Link>
        }
      />
      <ApprovalStatus membership={operator} kind="operator" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Live experiences" value={count("live")} href="/operator/experiences" />
        <StatCard label="In review" value={count("pending_review")} note="We usually review within 2 working days" href="/operator/experiences" />
        <StatCard label="Booking requests" value="—" note="Bookings open soon" href="/operator/requests" />
      </div>

      <section className={`${panel} mt-6`}>
        <h2 className={sectionTitle}>Get ready for your first booking</h2>
        <ol className="mt-2 divide-y divide-line">
          <Step done title="Create your account" />
          <Step done={operator.status === "verified"} title="Get verified by HostSays">
            We check every business. We&rsquo;ll email you when you&rsquo;re verified.
          </Step>
          <Step done={Boolean(settings.description)} title="Tell guests about your business" href="/operator/settings">
            A short description shows on your operator page.
          </Step>
          <Step done={experiences.length > 0} title="Add your first experience" href="/operator/experiences/new">
            Title, price, photos and the days and times you run it.
          </Step>
          <Step
            done={experiences.some((e) => e.status === "pending_review" || e.status === "live")}
            title="Submit it for review"
            href={experiences[0] ? `/operator/experiences/${experiences[0].id}` : "/operator/experiences/new"}
          >
            Once approved, it goes live and hosts can recommend it.
          </Step>
        </ol>
      </section>

      <section className={`${panel} mt-6 text-[15px]`}>
        <h2 className={sectionTitle}>How bookings will work</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted">
          <li>Guests send a request for a date and time. You accept, offer another time, or decline within {CONFIRM_WINDOW_HOURS} hours.</li>
          <li>Once you accept, the guest pays a 10% deposit online to HostSays. That&rsquo;s our fee.</li>
          <li>You collect the rest from the guest, the way you normally take payment.</li>
        </ul>
      </section>
    </>
  );
}
