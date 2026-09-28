import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExperienceGrid } from "@/components/cards/experience-card";
import { CategoryChips } from "@/components/home/category-chips";
import { pageTitle } from "@/components/ui/styles";
import { categoryLabel, isCategory, CATEGORIES } from "@/lib/categories";
import { getAreaBySlug, getExperiencesByArea } from "@/lib/data/public";

export const revalidate = 300;

// Empty list = render each page on its first visit, then cache it (ISR) instead of rendering per request.
export function generateStaticParams() {
  return [];
}

// Area + category landing pages, e.g. /addo/safari. Only for areas (host slugs 404 here).
async function load(slug: string, category: string) {
  if (!isCategory(category)) return null;
  const area = await getAreaBySlug(slug);
  if (!area) return null;
  return { area, category };
}

export async function generateMetadata({ params }: PageProps<"/[slug]/[category]">): Promise<Metadata> {
  const { slug, category } = await params;
  const found = await load(slug, category);
  if (!found) return {};
  const label = categoryLabel(found.category);
  return {
    title: `${label} in ${found.area.name}`,
    description: `${label} in ${found.area.name}, recommended by local hosts. Request a booking and pay only once it's confirmed.`,
    alternates: { canonical: `/${found.area.slug}/${found.category}` },
  };
}

export default async function AreaCategoryPage({ params }: PageProps<"/[slug]/[category]">) {
  const { slug, category } = await params;
  const found = await load(slug, category);
  if (!found) notFound();
  const { area } = found;

  const all = await getExperiencesByArea(area.id);
  const experiences = all.filter((e) => e.category === found.category);
  const categories = CATEGORIES.filter((c) => all.some((e) => e.category === c.value)).map((c) => c.value);

  return (
    <div className="wrap pt-8">
      <nav aria-label="Breadcrumb" className="mb-2 text-[13px] text-muted">
        <Link href={`/${area.slug}`} className="hover:text-green">{area.name}</Link> / {categoryLabel(found.category)}
      </nav>
      <h1 className={pageTitle}>
        {categoryLabel(found.category)} in {area.name}
      </h1>
      <p className="mt-2 max-w-[640px] text-muted">Recommended by the hosts who live here. No payment until your booking is confirmed.</p>

      {categories.length > 1 && (
        <div className="mt-6">
          <CategoryChips only={categories} active={found.category} hrefFor={(c) => `/${area.slug}/${c}`} />
        </div>
      )}

      <div className="mt-8">
        {experiences.length ? (
          <ExperienceGrid experiences={experiences} priorityCount={4} />
        ) : (
          <p className="text-muted">
            Nothing in this category in {area.name} yet.{" "}
            <Link href={`/${area.slug}`} className="font-semibold text-green">See everything in {area.name}</Link>.
          </p>
        )}
      </div>
    </div>
  );
}
