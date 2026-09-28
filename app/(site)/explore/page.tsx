import type { Metadata } from "next";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { ExperienceGrid } from "@/components/cards/experience-card";
import { btnPrimary, input, label, pageTitle } from "@/components/ui/styles";
import { CATEGORIES, categoryLabel, type Category } from "@/lib/categories";
import { getProvinces, searchExperiences } from "@/lib/data/public";
import { formatDate, formatPeople, formatRand, provinceInSentence } from "@/lib/format";
import { minBookableDate } from "@/lib/dates";
import { exploreParams, firstValues, PRICE_CAPS } from "@/lib/validation/explore";

export const metadata: Metadata = {
  title: "Things to do on the Eastern Cape coast",
  description:
    "Safaris, ocean trips, adventures and local favourites along the Eastern Cape coast, sorted by how many local hosts recommend them.",
  alternates: { canonical: "/explore" },
};

export default async function ExplorePage({ searchParams }: PageProps<"/explore">) {
  const params = exploreParams.parse(firstValues(await searchParams));
  const provinces = await getProvinces();
  const areas = provinces.flatMap((p) => p.areas);

  // `area` may be a town or a whole province. The homepage search sends free text in `where`: treat a
  // matching town or province name as that filter, anything else as a search term.
  let areaSlug = params.area;
  let q = params.q;
  if (!areaSlug && params.where) {
    const w = params.where.toLowerCase();
    const match = [...areas, ...provinces].find((a) => a.name.toLowerCase() === w || a.slug === w);
    if (match) areaSlug = match.slug;
    else q = [params.where, q].filter(Boolean).join(" ");
  }
  const area = areas.find((a) => a.slug === areaSlug);
  const province = area ? undefined : provinces.find((p) => p.slug === areaSlug);
  const place = area ?? province;

  const results = await searchExperiences({
    area: area?.slug,
    areaSlugs: province?.areas.map((a) => a.slug),
    category: params.category as Category | undefined,
    q,
    date: params.date,
    people: params.people,
    maxPriceCents: params.max ? params.max * 100 : undefined,
    sort: params.sort,
  });

  const active = [
    place && place.name,
    params.category && categoryLabel(params.category as Category),
    q && `“${q}”`,
    params.date && formatDate(params.date, { year: false }),
    params.people && formatPeople(params.people),
    params.max && `Up to ${formatRand(params.max * 100)} pp`,
  ].filter(Boolean);

  const formProps: FormProps = {
    provinces: provinces.map((p) => ({ slug: p.slug, name: p.name, areas: p.areas.map((a) => ({ slug: a.slug, name: a.name })) })),
    areaSlug: place?.slug,
    category: params.category,
    date: params.date,
    people: params.people,
    max: params.max,
    sort: params.sort,
    q,
  };

  const heading = [params.category ? categoryLabel(params.category as Category) : "Things to do", place && `in ${province ? provinceInSentence(province.name) : place.name}`]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="wrap pt-8 pb-4">
      <h1 className={pageTitle}>{heading}</h1>
      <p className="mt-2 max-w-[640px] text-muted">
        Sorted by how many local hosts recommend them. No payment until your booking is confirmed.
      </p>

      {/* Phones: collapsed behind "Filters". Desktop: always visible. */}
      <details className="group mt-6 rounded-[14px] bg-surface shadow-card md:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-semibold">
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal size={18} strokeWidth={1.8} aria-hidden="true" /> Filters
            {active.length > 0 && <span className="text-[13px] font-medium text-muted">({active.length})</span>}
          </span>
          <span className="text-[13px] font-medium text-green group-open:hidden">Show</span>
          <span className="hidden text-[13px] font-medium text-green group-open:inline">Hide</span>
        </summary>
        <FilterForm idPrefix="m" {...formProps} />
      </details>
      <div className="mt-6 hidden rounded-[14px] bg-surface pt-5 shadow-card md:block">
        <FilterForm idPrefix="d" {...formProps} />
      </div>

      <div className="mt-6 mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-muted">
        <span>
          <b className="text-ink">{results.length}</b> {results.length === 1 ? "experience" : "experiences"}
          {active.length > 0 && <> · {active.join(" · ")}</>}
        </span>
        {active.length > 0 && (
          <Link href="/explore" className="font-semibold text-green hover:underline">Clear filters</Link>
        )}
      </div>

      {results.length ? (
        <ExperienceGrid experiences={results} priorityCount={4} />
      ) : (
        <div className="rounded-[14px] bg-surface px-6 py-10 text-center shadow-card">
          <p className="font-semibold">Nothing matches that yet.</p>
          <p className="mt-1 text-muted">Try another date or area, or see everything we have.</p>
          <Link href="/explore" className={`${btnPrimary} mt-5`}>Show all experiences</Link>
        </div>
      )}
    </div>
  );
}

type FormProps = {
  provinces: { slug: string; name: string; areas: { slug: string; name: string }[] }[];
  areaSlug?: string;
  category?: string;
  date?: string;
  people?: number;
  max?: number;
  sort?: string;
  q?: string;
};

function FilterForm({ idPrefix, provinces, areaSlug, category, date, people, max, sort, q }: FormProps & { idPrefix: string }) {
  return (
        <form action="/explore" className="grid grid-cols-2 gap-3 px-5 pb-5 md:grid-cols-[repeat(6,minmax(0,1fr))_auto] md:items-end ">
          <div className="col-span-2 md:col-span-1">
            <label htmlFor={`${idPrefix}-area`} className={label}>Area</label>
            <select id={`${idPrefix}-area`} name="area" defaultValue={areaSlug ?? ""} className={input}>
              <option value="">Anywhere</option>
              {provinces.map((p) => (
                <optgroup key={p.slug} label={p.name}>
                  <option value={p.slug}>All of {provinceInSentence(p.name)}</option>
                  {p.areas.map((a) => (
                    <option key={a.slug} value={a.slug}>{a.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="col-span-2 md:col-span-1">
            <label htmlFor={`${idPrefix}-cat`} className={label}>Category</label>
            <select id={`${idPrefix}-cat`} name="category" defaultValue={category ?? ""} className={input}>
              <option value="">All</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${idPrefix}-date`} className={label}>Date</label>
            <input id={`${idPrefix}-date`} type="date" name="date" min={minBookableDate()} defaultValue={date} className={input} />
          </div>
          <div>
            <label htmlFor={`${idPrefix}-people`} className={label}>People</label>
            <input id={`${idPrefix}-people`} type="number" name="people" min={1} max={50} inputMode="numeric" placeholder="Any" defaultValue={people} className={input} />
          </div>
          <div>
            <label htmlFor={`${idPrefix}-max`} className={label}>Price</label>
            <select id={`${idPrefix}-max`} name="max" defaultValue={max?.toString() ?? ""} className={input}>
              <option value="">Any price</option>
              {PRICE_CAPS.map((p) => (
                <option key={p} value={p}>Up to {formatRand(p * 100)} pp</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${idPrefix}-sort`} className={label}>Sort by</label>
            <select id={`${idPrefix}-sort`} name="sort" defaultValue={sort ?? "recommended"} className={input}>
              <option value="recommended">Most recommended</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </div>
          {q && <input type="hidden" name="q" value={q} />}
          <button type="submit" className={`${btnPrimary} col-span-2 md:col-span-1`}>Show results</button>
        </form>
  );
}
