import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Clock, ExternalLink, MapPin, Users } from "lucide-react";
import { BookBar } from "@/components/booking/book-bar";
import { BookingPanel } from "@/components/booking/booking-panel";
import { ExperienceGrid } from "@/components/cards/experience-card";
import { CategoryIcon } from "@/components/icons/category-icon";
import { SectionHead } from "@/components/ui/section-head";
import { Stars } from "@/components/ui/stars";
import { btnPrimary, pageTitle } from "@/components/ui/styles";
import { categoryLabel } from "@/lib/categories";
import { MIN_REVIEWS_TO_SHOW } from "@/lib/config";
import { getExperienceBySlug, getExperiencesByOperator, getHostCards, getHostsAlsoRecommend } from "@/lib/data/public";
import { addDays, minBookableDate } from "@/lib/dates";
import { formatDuration, formatRand } from "@/lib/format";
import { CANCELLATION_POLICY } from "@/lib/policy";
import { absoluteUrl } from "@/lib/site";
import { publicImageUrl } from "@/lib/storage";

export const revalidate = 300;

// Empty list = render each page on its first visit, then cache it (ISR) instead of rendering per request.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/x/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const e = await getExperienceBySlug(slug, minBookableDate());
  if (!e) return {};
  const photo = e.photos[0];
  return {
    title: `${e.title}, ${e.area.name}`,
    description: `${e.summary}. ${formatRand(e.price_cents)} ${e.is_group_price ? "per group" : "per person"}, recommended by local hosts.`,
    alternates: { canonical: `/x/${e.slug}` },
    openGraph: photo
      ? { images: [{ url: publicImageUrl("experience-photos", photo.path), alt: photo.alt }] }
      : undefined,
  };
}

export default async function ExperiencePage({ params }: PageProps<"/x/[slug]">) {
  const { slug } = await params;
  const minDate = minBookableDate();
  const e = await getExperienceBySlug(slug, minDate);
  if (!e) notFound();

  const hostIds = e.recommendations.map((r) => r.host.id);
  const [fromOperator, alsoRecommended, allHosts] = await Promise.all([
    getExperiencesByOperator(e.operator.id),
    getHostsAlsoRecommend(e.id, hostIds),
    getHostCards(),
  ]);
  // For "Where are you staying?": every verified host, grouped by area in the form.
  const hostOptions = allHosts
    .map((h) => ({ slug: h.slug, name: h.name, area: h.area?.name ?? "Other" }))
    .sort((a, b) => a.area.localeCompare(b.area) || a.name.localeCompare(b.name));
  const moreFromOperator = fromOperator.filter((x) => x.id !== e.id).slice(0, 4);
  const hostCount = e.recommendations.length;
  const showReviews = e.reviewCount >= MIN_REVIEWS_TO_SHOW && e.rating != null;
  const [cover, ...rest] = e.photos;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: e.title,
    description: e.summary,
    category: categoryLabel(e.category),
    image: e.photos.map((p) => publicImageUrl("experience-photos", p.path)),
    brand: { "@type": "Organization", name: e.operator.name },
    offers: {
      "@type": "Offer",
      price: (e.price_cents / 100).toFixed(2),
      priceCurrency: "ZAR",
      availability: "https://schema.org/InStock",
      url: absoluteUrl(`/x/${e.slug}`),
    },
    ...(showReviews
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: e.rating, reviewCount: e.reviewCount } }
      : {}),
  };

  return (
    <div className="wrap pt-6 pb-24 md:pb-0">
      <script
        type="application/ld+json"
        // Escape "<" so the JSON can't close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <nav aria-label="Breadcrumb" className="mb-3 text-[13px] text-muted">
        <Link href={`/${e.area.slug}`} className="hover:text-green">{e.area.name}</Link> /{" "}
        <Link href={`/${e.area.slug}/${e.category}`} className="hover:text-green">{categoryLabel(e.category)}</Link>
      </nav>

      {/* Gallery: first photo large */}
      {cover && (
        <div className={`grid gap-2 overflow-hidden rounded-[14px] ${rest.length ? "md:grid-cols-[2fr_1fr]" : ""}`}>
          <div className={`relative bg-[#cfc6b6] ${rest.length ? "aspect-[16/10] md:aspect-auto md:min-h-[380px]" : "aspect-[16/10] md:aspect-[21/8]"}`}>
            <Image
              src={publicImageUrl("experience-photos", cover.path)}
              alt={cover.alt}
              fill
              priority
              sizes="(max-width: 980px) 100vw, 66vw"
              className="object-cover"
            />
          </div>
          {rest.length > 0 && (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
              {rest.slice(0, 2).map((p) => (
                <div key={p.path} className="relative aspect-[16/10] bg-[#cfc6b6]">
                  <Image src={publicImageUrl("experience-photos", p.path)} alt={p.alt} fill sizes="(max-width: 980px) 50vw, 33vw" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 text-[13px] font-semibold text-green">
            <CategoryIcon category={e.category} size={16} /> {categoryLabel(e.category)}
          </p>
          <h1 className={pageTitle}>{e.title}</h1>
          <p className="mt-2 text-[15px] text-muted">
            By <Link href={`/o/${e.operator.slug}`} className="font-semibold text-ink hover:text-green">{e.operator.name}</Link>
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[14px]">
            <li className="inline-flex items-center gap-1.5"><MapPin size={16} strokeWidth={1.8} aria-hidden="true" /> {e.area.name}</li>
            <li className="inline-flex items-center gap-1.5"><Clock size={16} strokeWidth={1.8} aria-hidden="true" /> {formatDuration(e.duration_minutes)}</li>
            <li className="inline-flex items-center gap-1.5">
              <Users size={16} strokeWidth={1.8} aria-hidden="true" />
              {e.min_people === e.max_people ? `${e.max_people} people` : `${e.min_people}–${e.max_people} people`}
            </li>
            <li className="font-semibold">
              {formatRand(e.price_cents)} {e.is_group_price ? "per group" : "per person"}
            </li>
          </ul>
          {showReviews && (
            <p className="mt-3 flex items-center gap-2 text-[14px] text-muted">
              <Stars rating={e.rating!} /> {e.rating} ({e.reviewCount} reviews)
            </p>
          )}

          {/* Host recommendations: the heart of the product */}
          {hostCount > 0 && (
            <section aria-labelledby="h-recs" className="mt-7 rounded-[14px] bg-panel p-5">
              <div className="flex items-center gap-3">
                <div className="flex" aria-hidden="true">
                  {e.recommendations.slice(0, 5).map((r, i) => (
                    <span key={r.id} className={`relative block h-9 w-9 overflow-hidden rounded-full border-2 border-surface bg-line ${i ? "-ml-2.5" : ""}`}>
                      {r.host.photo_path && (
                        <Image src={publicImageUrl("host-photos", r.host.photo_path)} alt="" fill sizes="36px" className="object-cover" />
                      )}
                    </span>
                  ))}
                </div>
                <h2 id="h-recs" className="text-[17px] font-bold">
                  Recommended by {hostCount} local {hostCount === 1 ? "host" : "hosts"}
                </h2>
              </div>
              <ul className="mt-4 space-y-4">
                {e.recommendations.slice(0, 3).map((r) => (
                  <li key={r.id}>
                    <blockquote className="text-[15px] leading-[1.5]">&ldquo;{r.tip}&rdquo;</blockquote>
                    <p className="mt-1 text-[13px] text-muted">
                      <Link href={`/${r.host.slug}`} className="font-semibold text-green hover:underline">{r.host.name}</Link>
                      {r.host.area && <>, {r.host.area.name}</>}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="h-about" className="mt-8">
            <h2 id="h-about" className="text-[20px] font-bold">About this experience</h2>
            <div className="mt-2 text-[15.5px] leading-[1.6] whitespace-pre-line">{e.description}</div>
            {e.operator.is_demo && (
              <p className="mt-3 rounded-[10px] bg-panel px-3.5 py-2.5 text-[13px] text-muted">
                This is a demo listing. Details and prices may change before bookings open.
              </p>
            )}
          </section>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {e.included.length > 0 && (
              <section aria-labelledby="h-incl">
                <h2 id="h-incl" className="text-[17px] font-bold">What&rsquo;s included</h2>
                <ul className="mt-2 space-y-1.5">
                  {e.included.map((x) => (
                    <li key={x} className="flex gap-2"><Check size={18} strokeWidth={1.8} className="mt-0.5 flex-none text-green" aria-hidden="true" />{x}</li>
                  ))}
                </ul>
              </section>
            )}
            {e.what_to_bring.length > 0 && (
              <section aria-labelledby="h-bring">
                <h2 id="h-bring" className="text-[17px] font-bold">What to bring</h2>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 marker:text-muted">
                  {e.what_to_bring.map((x) => <li key={x}>{x}</li>)}
                </ul>
              </section>
            )}
          </div>

          <section aria-labelledby="h-meet" className="mt-8">
            <h2 id="h-meet" className="text-[17px] font-bold">Meeting point</h2>
            <p className="mt-1.5">{e.meeting_point}</p>
            {e.meeting_point_map_url && (
              <a href={e.meeting_point_map_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1.5 font-semibold text-green hover:underline">
                Open in maps <ExternalLink size={14} strokeWidth={1.8} aria-hidden="true" />
              </a>
            )}
          </section>

          <section aria-labelledby="h-cancel" className="mt-8">
            <h2 id="h-cancel" className="text-[17px] font-bold">Cancellation policy</h2>
            <p className="mt-1.5">{CANCELLATION_POLICY}</p>
            {e.operator_cancellation_terms && (
              <p className="mt-2 text-muted">
                <b className="text-ink">{e.operator.name}&rsquo;s terms for the balance:</b> {e.operator_cancellation_terms}
              </p>
            )}
            <Link href="/cancellations" className="mt-1 inline-block text-[14px] font-semibold text-green hover:underline">Full cancellation policy</Link>
          </section>

          {showReviews && e.reviews.length > 0 && (
            <section aria-labelledby="h-reviews" className="mt-8">
              <h2 id="h-reviews" className="text-[20px] font-bold">Reviews</h2>
              <ul className="mt-3 space-y-4">
                {e.reviews.map((r) => (
                  <li key={r.id} className="border-b border-line pb-4">
                    <Stars rating={r.rating} />
                    {r.body && <p className="mt-1.5">{r.body}</p>}
                    {r.guest_display_name && <p className="mt-1 text-[13px] text-muted">{r.guest_display_name}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside id="book" aria-label="Request a booking" className="scroll-mt-4 md:sticky md:top-4 md:self-start">
          <BookingPanel
            operatorName={e.operator.name}
            priceCents={e.price_cents}
            isGroupPrice={e.is_group_price}
            minPeople={e.min_people}
            maxPeople={e.max_people}
            slots={e.slots}
            blackoutDates={e.blackoutDates}
            minDate={minDate}
            maxDate={addDays(minDate, 365)}
            hosts={hostOptions}
          />
        </aside>
      </div>

      {moreFromOperator.length > 0 && (
        <section aria-labelledby="h-more-op" className="mt-12">
          <SectionHead id="h-more-op" title={`More from ${e.operator.name}`} href={`/o/${e.operator.slug}`} />
          <ExperienceGrid experiences={moreFromOperator} />
        </section>
      )}
      {alsoRecommended.length > 0 && (
        <section aria-labelledby="h-also" className="mt-10">
          <SectionHead id="h-also" title="Hosts also recommend" href="/explore" />
          <ExperienceGrid experiences={alsoRecommended} />
        </section>
      )}

      {/* Phones: price + jump to the booking panel, always in reach. */}
      <BookBar>
        <p className="text-[15px] font-bold">
          {formatRand(e.price_cents)} <span className="text-[13px] font-medium text-muted">{e.is_group_price ? "per group" : "pp"}</span>
        </p>
        <a href="#book" className={btnPrimary}>Check dates</a>
      </BookBar>
    </div>
  );
}
