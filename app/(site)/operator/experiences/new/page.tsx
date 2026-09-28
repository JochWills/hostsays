import type { Metadata } from "next";
import Link from "next/link";
import { requireOperator } from "@/lib/portal";
import { getAllAreas } from "@/lib/data/public";
import { createExperience } from "../../actions";
import { ExperienceForm } from "@/components/portal/experience-form";
import { PageHeading } from "@/components/portal/ui";
import { panel } from "@/components/ui/styles";

export const metadata: Metadata = { title: "New experience", robots: { index: false, follow: false } };

export default async function NewExperience() {
  await requireOperator("/operator/experiences/new");
  const areas = await getAllAreas();
  return (
    <>
      <Link href="/operator/experiences" className="text-[14px] font-semibold text-green hover:underline">
        &larr; All experiences
      </Link>
      <div className="mt-3" />
      <PageHeading title="New experience" intro="Start with the details. You'll add photos and your days and times on the next step." />
      <div className={panel}>
        <ExperienceForm action={createExperience} areas={areas} submitLabel="Save and continue" />
      </div>
    </>
  );
}
