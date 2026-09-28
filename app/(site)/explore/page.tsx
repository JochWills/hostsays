import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpDown, CalendarDays, ChevronDown, Compass, LayoutGrid, MapPin, Search, SlidersHorizontal, Tag, UsersRound } from "lucide-react";
import { ExperienceGrid } from "@/components/cards/experience-card";
import { PriceRange } from "@/components/explore/price-range";
import { CategoryIcon } from "@/components/icons/category-icon";
import { btnPrimary } from "@/components/ui/styles";
import { CATEGORIES, categoryLabel, type Category } from "@/lib/categories";
import { getProvinces, searchExperiences } from "@/lib/data/public";
import { formatDate, formatPeople, formatRand, provinceInSentence } from "@/lib/format";
import { minBookableDate } from "@/lib/dates";
import { exploreParams, firstValues, PRICE_CAPS, PRICE_SLIDER_MAX, PRICE_STEP } from "@/lib/validation/explore";

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
  const category = params.category as Category | undefined;

  const results = await searchExperiences({
    area: area?.slug,
    areaSlugs: province?.areas.map((a) => a.slug),
    category,
    q,
    date: params.date,
    people: params.people,
    minPriceCents: params.min ? params.min * 100 : undefined,
    maxPriceCents: params.max ? params.max * 100 : undefined,
    sort: params.sort,
  });

  const active = [
    place && place.name,
    category && categoryLabel(category),
    q && `“${q}”`,
    params.date && formatDate(params.date, { year: false }),
    params.people && formatPeople(params.people),
    params.min && `From ${formatRand(params.min * 100)}`,
    params.max && `Up to ${formatRand(params.max * 100)} pp`,
  ].filter(Boolean);

  // The current filters as a query string, for links that change one of them.
  const current: Record<string, string> = Object.fromEntries(
    Object.entries({
      area: place?.slug,
      category,
      q,
      date: params.date,
      people: params.people?.toString(),
      min: params.min?.toString(),
      max: params.max?.toString(),
      sort: params.sort,
    }).filter((e): e is [string, string] => Boolean(e[1])),
  );
  const withParam = (key: string, value?: string) => {
    const next = new URLSearchParams(current);
    if (value) next.set(key, value);
    else next.delete(key);
    return `/explore${next.size ? `?${next}` : ""}`;
  };
  const { min: _min, max: _max, ...withoutPrice } = current;

  const heading = category ? categoryLabel(category) : "Things to do";
  const where = place && (province ? provinceInSentence(province.name) : place.name);
  const count = `${results.length} ${results.length === 1 ? "experience" : "experiences"}`;

  const filterProps: FilterProps = {
    provinces: provinces.map((p) => ({ slug: p.slug, name: p.name, areas: p.areas.map((a) => ({ slug: a.slug, name: a.name })) })),
    areaSlug: place?.slug,
    category,
    date: params.date,
    people: params.people,
    max: params.max,
    min: params.min,
    sort: params.sort,
    q,
  };

  return (
    <>
      {/* Photo banner; the filter bar overlaps its bottom edge. */}
      <section className="relative overflow-hidden bg-hero bg-[url(/images/hero.jpg)] bg-cover bg-position-[70%_center] text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.55)_0%,rgba(0,0,0,.3)_45%,rgba(0,0,0,.05)_75%),linear-gradient(180deg,rgba(0,0,0,.15)_0%,rgba(0,0,0,0)_40%,rgba(0,0,0,.25)_100%)]"
        />
        <div className="wrap relative pt-10 pb-[72px] sm:pt-14 md:pb-[96px]">
          <p className="text-[12.5px] font-semibold tracking-[0.14em] uppercase opacity-90">Explore</p>
          <h1 className="mt-2 font-serif text-[clamp(40px,6vw,72px)] leading-[1.02] font-semibold tracking-[-0.01em] not-italic">
            {heading}
            {where && <span className="block text-[0.55em] font-medium italic">in {where}</span>}
          </h1>
          <p className="mt-4 max-w-[600px] text-[15.5px] leading-[1.5] opacity-95 sm:text-[17px]">
            Discover the best local experiences, recommended by trusted guesthouses and hosts across South Africa. No
            payment until your booking is confirmed.
          </p>
        </div>
      </section>

      <div className="wrap relative -mt-[44px] md:-mt-[52px]">
        {/* Phones: collapsed behind "Filters". Desktop: the full bar. */}
        <details className="group rounded-[16px] bg-surface shadow-card md:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-semibold [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal size={18} strokeWidth={1.8} aria-hidden="true" /> Filters
              {active.length > 0 && <span className="text-[13px] font-medium text-muted">({active.length})</span>}
            </span>
            <span className="text-[13px] font-medium text-green group-open:hidden">Show</span>
            <span className="hidden text-[13px] font-medium text-green group-open:inline">Hide</span>
          </summary>
          <FilterBar idPrefix="m" {...filterProps} />
        </details>
        <div className="hidden rounded-[16px] bg-surface shadow-[0_10px_30px_rgba(30,39,35,0.12)] md:block">
          <FilterBar idPrefix="d" {...filterProps} />
        </div>
      </div>

      <div className="wrap mt-7 grid grid-cols-[minmax(0,1fr)] gap-8 pb-6 md:grid-cols-[230px_minmax(0,1fr)] lg:gap-10">
        <aside className="hidden md:block" aria-label="More filters">
          <p className="text-[15px]">
            <b>{count}</b>
          </p>
          {active.length > 0 && (
            <p className="mt-1.5 text-[13px] text-muted">
              {active.join(" · ")}{" "}
              <Link href="/explore" className="font-semibold whitespace-nowrap text-green hover:underline">
                Clear all
              </Link>
            </p>
          )}

          <section className="mt-5 border-t border-line pt-5">
            <h2 className="text-[15px] font-bold">Categories</h2>
            <ul className="mt-3 space-y-1">
              <li>
                <SideLink href={withParam("category")} active={!category} icon={<LayoutGrid size={18} strokeWidth={1.6} />}>
                  All categories
                </SideLink>
              </li>
              {CATEGORIES.map((c) => (
                <li key={c.value}>
                  <SideLink href={withParam("category", c.value)} active={category === c.value} icon={<CategoryIcon category={c.value} size={18} />}>
                    {c.label}
                  </SideLink>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-5 border-t border-line pt-5">
            <h2 className="mb-2 text-[15px] font-bold">Price range</h2>
            <PriceRange key={`${params.min}-${params.max}`} min={params.min} max={params.max} limit={PRICE_SLIDER_MAX} step={PRICE_STEP} params={withoutPrice} />
            <p className="mt-3 text-[12.5px] text-muted">Per person, or per group for private trips.</p>
          </section>
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-[14px] text-muted md:hidden">
              <b className="text-ink">{count}</b>
              {active.length > 0 && (
                <>
                  {" · "}
                  <Link href="/explore" className="font-semibold text-green hover:underline">
                    Clear filters
                  </Link>
                </>
              )}
            </p>
            <p className="ml-auto hidden text-[13.5px] text-muted md:block">{count}</p>
          </div>

          {results.length ? (
            <ExperienceGrid
              experiences={results}
              priorityCount={3}
              detailed
              className="grid-cols-2 lg:grid-cols-3 min-[1440px]:grid-cols-4"
            />
          ) : (
            <div className="rounded-[14px] bg-surface px-6 py-10 text-center shadow-card">
              <p className="font-semibold">Nothing matches that yet.</p>
              <p className="mt-1 text-muted">Try another date, area or price, or see everything we have.</p>
              <Link href="/explore" className={`${btnPrimary} mt-5`}>
                Show all experiences
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SideLink({ href, active, icon, children }: { href: string; active: boolean; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-[10px] px-2 py-2 text-[14.5px] ${active ? "bg-green/10 font-semibold text-green" : "text-ink hover:bg-panel"}`}
    >
      <span aria-hidden="true" className="grid w-6 place-items-center">
        {icon}
      </span>
      {children}
    </Link>
  );
}

type FilterProps = {
  provinces: { slug: string; name: string; areas: { slug: string; name: string }[] }[];
  areaSlug?: string;
  category?: string;
  date?: string;
  people?: number;
  min?: number;
  max?: number;
  sort?: string;
  q?: string;
};

/** One labelled filter in the bar: icon, small label, and a borderless control (with a ▾ for selects). */
function Cell({ id, label, icon, select = true, children }: { id: string; label: string; icon: React.ReactNode; select?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-[12px] border border-line px-3.5 py-2.5 min-[1360px]:rounded-none min-[1360px]:border-0 min-[1360px]:border-r min-[1360px]:px-5 min-[1360px]:py-1">
      <span aria-hidden="true" className="shrink-0 text-ink">
        {icon}
      </span>
      <div className="relative min-w-0 flex-1">
        <label htmlFor={id} className="block text-[12px] font-semibold text-muted">
          {label}
        </label>
        {children}
        {select && (
          <ChevronDown size={16} strokeWidth={2} aria-hidden="true" className="pointer-events-none absolute right-0 bottom-1.5 text-ink" />
        )}
      </div>
    </div>
  );
}

const control =
  "w-full min-w-0 cursor-pointer appearance-none truncate bg-transparent py-0.5 pr-5 text-[15px] font-medium text-ink focus:outline-none";

function FilterBar({ idPrefix, provinces, areaSlug, category, date, people, min, max, sort, q }: FilterProps & { idPrefix: string }) {
  const icon = { size: 21, strokeWidth: 1.6 };
  return (
    <form action="/explore" className="grid gap-2.5 px-4 pb-4 md:grid-cols-4 md:items-center md:p-4 min-[1360px]:grid-cols-[1.1fr_1.1fr_1.1fr_0.8fr_0.95fr_1.55fr_auto] min-[1360px]:gap-0 min-[1360px]:p-3 min-[1360px]:pl-2">
      <Cell id={`${idPrefix}-area`} label="Area" icon={<MapPin {...icon} />}>
        <select id={`${idPrefix}-area`} name="area" defaultValue={areaSlug ?? ""} className={control}>
          <option value="">Anywhere</option>
          {provinces.map((p) => (
            <optgroup key={p.slug} label={p.name}>
              <option value={p.slug}>All of {provinceInSentence(p.name)}</option>
              {p.areas.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </Cell>
      <Cell id={`${idPrefix}-cat`} label="Category" icon={<Compass {...icon} />}>
        <select id={`${idPrefix}-cat`} name="category" defaultValue={category ?? ""} className={control}>
          <option value="">All</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </Cell>
      <Cell id={`${idPrefix}-date`} label="Date" icon={<CalendarDays {...icon} />} select={false}>
        <input id={`${idPrefix}-date`} type="date" name="date" min={minBookableDate()} defaultValue={date} className={`${control} pr-0`} />
      </Cell>
      <Cell id={`${idPrefix}-people`} label="People" icon={<UsersRound {...icon} />}>
        <select id={`${idPrefix}-people`} name="people" defaultValue={people?.toString() ?? ""} className={control}>
          <option value="">Any</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {formatPeople(n)}
            </option>
          ))}
        </select>
      </Cell>
      <Cell id={`${idPrefix}-max`} label="Price" icon={<Tag {...icon} />}>
        <select id={`${idPrefix}-max`} name="max" defaultValue={max?.toString() ?? ""} className={control}>
          <option value="">Any price</option>
          {PRICE_CAPS.map((p) => (
            <option key={p} value={p}>
              Up to {formatRand(p * 100)}
            </option>
          ))}
          {max && !PRICE_CAPS.includes(max) && <option value={max}>Up to {formatRand(max * 100)}</option>}
        </select>
      </Cell>
      <Cell id={`${idPrefix}-sort`} label="Sort by" icon={<ArrowUpDown {...icon} />}>
        <select id={`${idPrefix}-sort`} name="sort" defaultValue={sort ?? "recommended"} className={control}>
          <option value="recommended">Most recommended</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </Cell>
      {q && <input type="hidden" name="q" value={q} />}
      {min && <input type="hidden" name="min" value={min} />}
      <button type="submit" className={`${btnPrimary} mt-1 md:col-span-2 md:mt-0 md:h-full min-[1360px]:col-span-1 min-[1360px]:ml-3 min-[1360px]:h-auto min-[1360px]:py-[15px]`}>
        <Search size={18} strokeWidth={2} aria-hidden="true" /> Show results
      </button>
    </form>
  );
}
