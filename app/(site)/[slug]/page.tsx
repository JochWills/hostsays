import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { MapPin } from "lucide-react";
import { ExperienceCard, ExperienceGrid } from "@/components/cards/experience-card";
import { HostGrid } from "@/components/cards/host-card";
import { CategoryChips } from "@/components/home/category-chips";
import { PickFilter } from "@/components/storefront/pick-filter";
import { StorefrontBeacon } from "@/components/site/storefront-beacon";
import { SectionHead } from "@/components/ui/section-head";
import { CATEGORIES } from "@/lib/categories";
import {
  getExperiencesByArea,
  getHostCards,
  getStorefrontPicks,
  resolveTopLevelSlug,
  type Area,
  type HostCard,
  type Province,
} from "@/lib/data/public";
import { btnSecondary, pageTitle } from "@/components/ui/styles";
import { publicImageUrl } from "@/lib/storage";
import { provinceInSentence } from "@/lib/format";

export const revalidate = 300;

// Empty list = render each page on its first visit, then cache it (ISR) instead of rendering per request.
export function generateStaticParams() {
  return [];
}

// Areas, provinces and hosts share the top-level namespace (docs/03-site-structure.md); slugs never clash.
export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const found = await resolveTopLevelSlug(slug);
  if (!found || found.kind === "redirect") return {};
  if (found.kind === "area") {
    const { area } = found;
    return {
      title: `Things to do in ${area.name}, recommended by local hosts`,
      description: area.intro ?? `What hosts in ${area.name} tell their guests to do.`,
      alternates: { canonical: `/${area.slug}` },
    };
  }
  if (found.kind === "province") {
    const { province } = found;
    return {
      title: `Things to do in ${provinceInSentence(province.name)}, recommended by local hosts`,
      description: province.intro ?? `What hosts in ${provinceInSentence(province.name)} tell their guests to do.`,
      alternates: { canonical: `/${province.slug}` },
    };
  }
  const { host } = found;
  return {
    title: `${host.name}: our favourite things to do${host.area ? ` in ${host.area.name}` : ""}`,
    description: host.welcomeNote ?? `Local experiences recommended by ${host.name}.`,
    alternates: { canonical: `/${host.slug}` },
    openGraph: host.photoPath ? { images: [publicImageUrl("host-photos", host.photoPath)] } : undefined,
  };
}

export default async function TopLevelPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const found = await resolveTopLevelSlug(slug);
  if (!found) notFound();
  if (found.kind === "redirect") permanentRedirect(`/${found.to}`);
  if (found.kind === "area") return <AreaPage area={found.area} />;
  if (found.kind === "province") return <ProvincePage province={found.province} />;
  return <Storefront host={found.host} />;
}

// ---------- Province page ----------

async function ProvincePage({ province }: { province: Province }) {
  const areaIds = province.areas.map((a) => a.id);
  const [experiences, hosts] = await Promise.all([getExperiencesByArea(areaIds), getHostCards({ areaId: areaIds })]);
  const liveAreas = province.areas.filter((a) => a.is_live);
  const categories = CATEGORIES.filter((c) => experiences.some((e) => e.category === c.value));
  const empty = experiences.length === 0;

  return (
    <div className="wrap pt-8">
      <p className="mb-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted">
        <MapPin size={15} strokeWidth={1.8} aria-hidden="true" />
        <Link href="/areas" className="hover:underline">
          South Africa
        </Link>
      </p>
      <h1 className={pageTitle}>
        What {province.name} hosts <em className="font-serif font-semibold">say to do</em>
      </h1>
      {province.intro && <p className="mt-3 max-w-[640px] text-[16px] text-muted">{province.intro}</p>}

      {liveAreas.length > 0 && (
        <nav aria-label={`Areas in ${provinceInSentence(province.name)}`} className="mt-6 flex flex-wrap gap-2">
          {liveAreas.map((a) => (
            <Link key={a.id} href={`/${a.slug}`} className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-[14px] font-semibold hover:border-green">
              {a.name}
            </Link>
          ))}
        </nav>
      )}

      {empty ? (
        <section className="mt-8 max-w-[640px] rounded-[14px] bg-surface p-6 shadow-card">
          <h2 className="text-[20px] font-bold">Coming soon to {provinceInSentence(province.name)}</h2>
          <p className="mt-2 text-muted">
            We&rsquo;re adding places as local hosts and operators join. Run a guesthouse or a tour here? Join now and be
            among the first listed.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link href="/signup?as=host" className={btnSecondary}>
              Join as a host
            </Link>
            <Link href="/signup?as=operator" className={btnSecondary}>
              List your experience
            </Link>
          </div>
        </section>
      ) : (
        <>
          {categories.length > 1 && (
            <div className="mt-6">
              <CategoryChips only={categories.map((c) => c.value)} hrefFor={(c) => `/explore?area=${province.slug}&category=${c}`} />
            </div>
          )}
          <section aria-labelledby="h-prov-exp" className="mt-8">
            <SectionHead id="h-prov-exp" title="Most recommended" href={`/explore?area=${province.slug}`} />
            <ExperienceGrid experiences={experiences.slice(0, 8)} priorityCount={4} />
          </section>
        </>
      )}

      {hosts.length > 0 && (
        <section aria-labelledby="h-prov-hosts" className="mt-8">
          <SectionHead id="h-prov-hosts" title={`Hosts in ${provinceInSentence(province.name)}`} href="/hosts" />
          <HostGrid hosts={hosts} />
        </section>
      )}
    </div>
  );
}

// ---------- Area page ----------

async function AreaPage({ area }: { area: Area }) {
  const [experiences, hosts] = await Promise.all([getExperiencesByArea(area.id), getHostCards({ areaId: area.id })]);
  const categories = CATEGORIES.filter((c) => experiences.some((e) => e.category === c.value));

  return (
    <div className="wrap pt-8">
      <p className="mb-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted">
        <MapPin size={15} strokeWidth={1.8} aria-hidden="true" />
        {area.province ? (
          <Link href={`/${area.province.slug}`} className="hover:underline">
            {area.province.name}
          </Link>
        ) : (
          "South Africa"
        )}
      </p>
      <h1 className={pageTitle}>
        What {area.name} hosts <em className="font-serif font-semibold">say to do</em>
      </h1>
      {area.intro && <p className="mt-3 max-w-[640px] text-[16px] text-muted">{area.intro}</p>}

      {categories.length > 1 && (
        <div className="mt-6">
          <CategoryChips only={categories.map((c) => c.value)} hrefFor={(c) => `/${area.slug}/${c}`} />
        </div>
      )}

      <section aria-labelledby="h-area-exp" className="mt-8">
        <SectionHead id="h-area-exp" title="Most recommended" href={`/explore?area=${area.slug}`} />
        {experiences.length ? (
          <ExperienceGrid experiences={experiences.slice(0, 8)} priorityCount={4} />
        ) : (
          <p className="text-muted">
            Nothing listed in {area.name} yet.{" "}
            {area.province && (
              <Link href={`/${area.province.slug}`} className="font-semibold text-green">
                See the rest of {provinceInSentence(area.province.name)}
              </Link>
            )}
          </p>
        )}
      </section>

      {/* Per-category rows only once "Most recommended" can't show everything; otherwise they'd repeat the same cards. */}
      {categories.length > 1 &&
        experiences.length > 8 &&
        categories.map((c) => {
          const inCat = experiences.filter((e) => e.category === c.value);
          return (
            <section key={c.value} aria-labelledby={`h-${c.value}`} className="mt-8">
              <SectionHead id={`h-${c.value}`} title={c.label} href={`/${area.slug}/${c.value}`} />
              <ExperienceGrid experiences={inCat.slice(0, 4)} />
            </section>
          );
        })}

      {hosts.length > 0 && (
        <section aria-labelledby="h-area-hosts" className="mt-8">
          <SectionHead id="h-area-hosts" title={`Hosts in ${area.name}`} href="/hosts" />
          <HostGrid hosts={hosts} />
        </section>
      )}
    </div>
  );
}

// ---------- Host storefront ----------

async function Storefront({ host }: { host: HostCard }) {
  const picks = await getStorefrontPicks(host.id);

  return (
    <div className="wrap pt-8">
      <StorefrontBeacon slug={host.slug} />
      <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <div>
          {host.area && (
            <p className="mb-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted">
              <MapPin size={15} strokeWidth={1.8} aria-hidden="true" />
              <Link href={`/${host.area.slug}`} className="hover:text-green">{host.area.name}</Link>
            </p>
          )}
          <h1 className={pageTitle}>{host.name}</h1>
          <p className="mt-1 text-[15px] font-semibold text-green">Our picks near you</p>
          {host.welcomeNote && <p className="mt-3 max-w-[560px] text-[16px] leading-[1.55]">{host.welcomeNote}</p>}
          <p className="mt-4 inline-flex rounded-full bg-panel px-3.5 py-2 text-[13px] text-muted">
            Book here and {host.name} is credited automatically.
          </p>
        </div>
        {host.photoPath && (
          <div className="relative aspect-[16/10] overflow-hidden rounded-[14px] shadow-card">
            <Image
              src={publicImageUrl("host-photos", host.photoPath)}
              alt={host.name}
              fill
              priority
              sizes="(max-width: 620px) 100vw, 360px"
              className="object-cover"
            />
          </div>
        )}
      </div>

      <section aria-labelledby="h-picks" className="mt-8">
        <h2 id="h-picks" className="mb-3 text-[20px] font-bold">
          Our picks
        </h2>
        {picks.length ? (
          <PickFilter
            items={picks.map((p, i) => ({
              key: p.recommendationId,
              category: p.category,
              node: <ExperienceCard experience={p} tip={p.tip} priority={i < 4} />,
            }))}
          />
        ) : (
          <p className="text-muted">
            {host.name} hasn&rsquo;t added their picks yet. <Link href="/explore" className="font-semibold text-green">See what other hosts recommend</Link>.
          </p>
        )}
      </section>

      <p className="mt-10 text-center text-[12.5px] text-muted">
        Powered by <Link href="/" className="font-semibold text-ink">HostSays</Link>. Hosts earn a commission when you book through them.
      </p>
    </div>
  );
}
