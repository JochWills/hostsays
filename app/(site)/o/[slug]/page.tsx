import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ExternalLink, MapPin } from "lucide-react";
import { ExperienceGrid } from "@/components/cards/experience-card";
import { pageTitle } from "@/components/ui/styles";
import { getExperiencesByOperator, getOperatorBySlug } from "@/lib/data/public";
import { publicImageUrl } from "@/lib/storage";

export const revalidate = 300;

// Empty list = render each page on its first visit, then cache it (ISR) instead of rendering per request.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/o/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const op = await getOperatorBySlug(slug);
  if (!op) return {};
  return {
    title: `${op.name}${op.area ? `, ${op.area.name}` : ""}`,
    description: op.description ?? `Experiences run by ${op.name}, recommended by local hosts.`,
    alternates: { canonical: `/o/${op.slug}` },
  };
}

export default async function OperatorPage({ params }: PageProps<"/o/[slug]">) {
  const { slug } = await params;
  const op = await getOperatorBySlug(slug);
  if (!op) notFound();
  const experiences = await getExperiencesByOperator(op.id);

  return (
    <div className="wrap pt-8">
      <div className="flex items-center gap-4">
        {op.logo_path && (
          <span className="relative block h-16 w-16 flex-none overflow-hidden rounded-[12px] bg-surface shadow-card">
            <Image src={publicImageUrl("operator-logos", op.logo_path)} alt="" fill sizes="64px" className="object-contain p-1.5" />
          </span>
        )}
        <div>
          <h1 className={pageTitle}>{op.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-muted">
            {op.area && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={15} strokeWidth={1.8} aria-hidden="true" /> {op.area.name}
              </span>
            )}
            {op.website && (
              <a href={op.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-green hover:underline">
                Website <ExternalLink size={14} strokeWidth={1.8} aria-hidden="true" />
              </a>
            )}
          </p>
        </div>
      </div>
      {op.description && <p className="mt-4 max-w-[680px] text-[16px] leading-[1.55]">{op.description}</p>}

      <section aria-labelledby="h-op-exp" className="mt-8">
        <h2 id="h-op-exp" className="mb-3 text-[20px] font-bold">Experiences</h2>
        {experiences.length ? (
          <ExperienceGrid experiences={experiences} priorityCount={4} />
        ) : (
          <p className="text-muted">No experiences listed right now.</p>
        )}
      </section>
    </div>
  );
}
