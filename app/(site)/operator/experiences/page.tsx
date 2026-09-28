import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Compass, ImageIcon, Plus } from "lucide-react";
import { requireOperator } from "@/lib/portal";
import { getOperatorExperiences } from "@/lib/data/portal";
import { formatRand } from "@/lib/format";
import { publicImageUrl } from "@/lib/storage";
import { ComingSoon, PageHeading, StatusPill } from "@/components/portal/ui";
import { btnPrimary, panel } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Your experiences", robots: { index: false, follow: false } };

export default async function OperatorExperiences() {
  const { operator } = await requireOperator("/operator/experiences");
  const experiences = await getOperatorExperiences(operator.id);

  return (
    <>
      <PageHeading
        title="Experiences"
        intro="Everything you offer on HostSays. New listings and changes are checked by us before they go live."
        actions={
          <Link href="/operator/experiences/new" className={btnPrimary}>
            <Plus size={18} aria-hidden="true" /> New experience
          </Link>
        }
      />
      {experiences.length === 0 ? (
        <ComingSoon icon={Compass} title="No experiences yet" action={{ href: "/operator/experiences/new", label: "Add your first experience" }}>
          <p>Add a tour, trip or activity with its price, photos and the days and times you run it.</p>
        </ComingSoon>
      ) : (
        <ul className="space-y-3">
          {experiences.map((e) => (
            <li key={e.id}>
              <Link href={`/operator/experiences/${e.id}`} className={`${panel} flex items-center gap-4 border border-transparent !p-3 hover:border-green sm:!p-4`}>
                <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-panel text-muted sm:size-20">
                  {e.photoPath ? (
                    <Image src={publicImageUrl("experience-photos", e.photoPath)} alt="" fill sizes="80px" className="object-cover" />
                  ) : (
                    <ImageIcon size={22} aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{e.title}</span>
                  <span className="mt-0.5 block text-[14px] text-muted">
                    {formatRand(e.priceCents)} {e.isGroupPrice ? "per group" : "per person"} ·{" "}
                    {e.slotCount ? `${e.slotCount} weekly time${e.slotCount === 1 ? "" : "s"}` : "no times yet"}
                  </span>
                </span>
                <StatusPill status={e.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
