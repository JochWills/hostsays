import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { requireOperator } from "@/lib/portal";
import { getOperatorExperiences } from "@/lib/data/portal";
import { ComingSoon, PageHeading, StatusPill } from "@/components/portal/ui";
import { panel, sectionTitle } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Availability", robots: { index: false, follow: false } };

export default async function OperatorAvailability() {
  const { operator } = await requireOperator("/operator/availability");
  const experiences = await getOperatorExperiences(operator.id);
  return (
    <>
      <PageHeading title="Availability" intro="Set your weekly times and close dates for each experience. You can change these any time, even when live." />
      {experiences.length === 0 ? (
        <ComingSoon icon={CalendarDays} title="Add an experience first" action={{ href: "/operator/experiences/new", label: "New experience" }}>
          <p>Times and closed dates belong to each experience.</p>
        </ComingSoon>
      ) : (
        <ul className="space-y-3">
          {experiences.map((e) => (
            <li key={e.id}>
              <Link href={`/operator/experiences/${e.id}`} className={`${panel} flex items-center gap-3 border border-transparent hover:border-green`}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{e.title}</span>
                  <span className="text-[14px] text-muted">
                    {e.slotCount ? `${e.slotCount} weekly time${e.slotCount === 1 ? "" : "s"}` : "No times yet"} · Edit times and closed dates
                  </span>
                </span>
                <StatusPill status={e.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <section className={`${panel} mt-6 text-[15px]`}>
        <h2 className={sectionTitle}>Coming soon: calendar sync</h2>
        <p className="mt-2 text-muted">
          Connect your Google, Outlook or Apple calendar and we&rsquo;ll close times you&rsquo;re already busy automatically. Your
          HostSays bookings will show in your calendar too.
        </p>
      </section>
    </>
  );
}
