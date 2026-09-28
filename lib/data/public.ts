import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type { Row } from "@/lib/supabase/types";
import type { Category } from "@/lib/categories";
import { weekdayOf } from "@/lib/dates";

/**
 * Queries for public pages. Everything runs as an anonymous visitor, so RLS decides what's visible
 * (live experiences, verified operators and hosts, visible tips, reviews only once there are 3+).
 */

// ---------- Card shapes (views return nullable columns; normalise once here) ----------

export type ExperienceCard = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: Category;
  priceCents: number;
  isGroupPrice: boolean;
  durationMinutes: number;
  minPeople: number;
  maxPeople: number;
  featuredRank: number | null;
  area: { id: string; slug: string; name: string };
  operator: { id: string; slug: string; name: string };
  photo: { path: string; alt: string } | null;
  hostCount: number;
  hostPhotoPaths: string[];
  rating: number | null;
  reviewCount: number;
};

export type HostCard = {
  id: string;
  slug: string;
  name: string;
  photoPath: string | null;
  welcomeNote: string | null;
  featuredRank: number | null;
  area: { id: string; slug: string; name: string } | null;
  pickCount: number;
};

export type StorefrontPick = ExperienceCard & { recommendationId: string; tip: string; sortOrder: number };

type CardRow = Row<"experience_cards">;

function toExperienceCard(r: CardRow): ExperienceCard {
  return {
    id: r.id!,
    slug: r.slug!,
    title: r.title!,
    summary: r.summary!,
    category: r.category!,
    priceCents: r.price_cents!,
    isGroupPrice: r.is_group_price!,
    durationMinutes: r.duration_minutes!,
    minPeople: r.min_people!,
    maxPeople: r.max_people!,
    featuredRank: r.featured_rank,
    area: { id: r.area_id!, slug: r.area_slug!, name: r.area_name! },
    operator: { id: r.operator_id!, slug: r.operator_slug!, name: r.operator_name! },
    photo: r.photo_path ? { path: r.photo_path, alt: r.photo_alt ?? r.title! } : null,
    hostCount: r.host_count ?? 0,
    hostPhotoPaths: r.host_photo_paths ?? [],
    rating: r.rating,
    reviewCount: r.review_count ?? 0,
  };
}

function toHostCard(r: Row<"host_cards">): HostCard {
  return {
    id: r.id!,
    slug: r.slug!,
    name: r.name!,
    photoPath: r.photo_path,
    welcomeNote: r.welcome_note,
    featuredRank: r.featured_rank,
    area: r.area_id ? { id: r.area_id, slug: r.area_slug!, name: r.area_name! } : null,
    pickCount: r.pick_count ?? 0,
  };
}

type Result = { data: unknown; error: { message: string } | null };

/** Rows of a list query, or throw. */
function orThrow<R extends Result>(result: R, what: string): NonNullable<R["data"]> {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data as NonNullable<R["data"]>;
}

/** The row of a `.maybeSingle()` query (or null), or throw. */
function oneOrNull<R extends Result>(result: R, what: string): R["data"] {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data;
}

/** Most recommended first, then featured order, then title. */
function byMostRecommended(a: ExperienceCard, b: ExperienceCard) {
  return (
    b.hostCount - a.hostCount ||
    (a.featuredRank ?? 1e6) - (b.featuredRank ?? 1e6) ||
    a.title.localeCompare(b.title)
  );
}

// ---------- Areas ----------

export type Area = Row<"areas">;

export async function getLiveAreas(): Promise<Area[]> {
  const db = createPublicClient();
  return orThrow(await db.from("areas").select("*").eq("is_live", true).order("sort_order"), "areas");
}

/** Every area (live or not), for sign-up forms. */
export async function getAllAreas(): Promise<Pick<Area, "id" | "name">[]> {
  const db = createPublicClient();
  return orThrow(await db.from("areas").select("id, name").order("sort_order"), "areas");
}

export async function getAreaBySlug(slug: string): Promise<Area | null> {
  const db = createPublicClient();
  return oneOrNull(await db.from("areas").select("*").eq("slug", slug).maybeSingle(), "area");
}

// ---------- Experiences ----------

export async function getFeaturedExperiences(limit = 4): Promise<ExperienceCard[]> {
  const db = createPublicClient();
  const rows = orThrow(await db.from("experience_cards").select("*"), "experience cards");
  const cards = rows.map(toExperienceCard);
  const featured = cards
    .filter((c) => c.featuredRank != null)
    .sort((a, b) => a.featuredRank! - b.featuredRank!);
  const rest = cards.filter((c) => c.featuredRank == null).sort(byMostRecommended);
  return [...featured, ...rest].slice(0, limit);
}

export type ExploreFilters = {
  area?: string;
  category?: Category;
  q?: string;
  date?: string;
  people?: number;
  maxPriceCents?: number;
  sort?: "recommended" | "price-asc" | "price-desc";
};

export async function searchExperiences(f: ExploreFilters): Promise<ExperienceCard[]> {
  const db = createPublicClient();
  let query = db.from("experience_cards").select("*");
  if (f.area) query = query.eq("area_slug", f.area);
  if (f.category) query = query.eq("category", f.category);
  if (f.people) query = query.lte("min_people", f.people).gte("max_people", f.people);
  if (f.maxPriceCents != null) query = query.lte("price_cents", f.maxPriceCents);
  if (f.q) {
    // Keep only characters that are safe inside a PostgREST filter string.
    const term = f.q.replace(/[^\p{L}\p{N}\s'-]/gu, " ").trim().slice(0, 60);
    if (term) {
      const like = `"*${term}*"`; // quoted so spaces are allowed
      query = query.or(`title.ilike.${like},summary.ilike.${like},area_name.ilike.${like},operator_name.ilike.${like}`);
    }
  }
  let cards = orThrow(await query, "search").map(toExperienceCard);

  if (f.date && cards.length) {
    const ids = cards.map((c) => c.id);
    const [slots, blackouts] = await Promise.all([
      db.from("experience_slots").select("experience_id").in("experience_id", ids).eq("weekday", weekdayOf(f.date)),
      db.from("experience_blackouts").select("experience_id").in("experience_id", ids).eq("date", f.date),
    ]);
    const open = new Set(orThrow(slots, "slots").map((s) => s.experience_id));
    const closed = new Set(orThrow(blackouts, "blackouts").map((b) => b.experience_id));
    cards = cards.filter((c) => open.has(c.id) && !closed.has(c.id));
  }

  const sorters = {
    recommended: byMostRecommended,
    "price-asc": (a: ExperienceCard, b: ExperienceCard) => a.priceCents - b.priceCents || byMostRecommended(a, b),
    "price-desc": (a: ExperienceCard, b: ExperienceCard) => b.priceCents - a.priceCents || byMostRecommended(a, b),
  };
  return cards.sort(sorters[f.sort ?? "recommended"]);
}

export async function getExperiencesByArea(areaId: string): Promise<ExperienceCard[]> {
  const db = createPublicClient();
  const rows = orThrow(await db.from("experience_cards").select("*").eq("area_id", areaId), "area experiences");
  return rows.map(toExperienceCard).sort(byMostRecommended);
}

export async function getExperiencesByOperator(operatorId: string): Promise<ExperienceCard[]> {
  const db = createPublicClient();
  const rows = orThrow(await db.from("experience_cards").select("*").eq("operator_id", operatorId), "operator experiences");
  return rows.map(toExperienceCard).sort(byMostRecommended);
}

export async function getExperienceCardsByIds(ids: string[]): Promise<ExperienceCard[]> {
  if (!ids.length) return [];
  const db = createPublicClient();
  const rows = orThrow(await db.from("experience_cards").select("*").in("id", ids), "experience cards");
  return rows.map(toExperienceCard).sort(byMostRecommended);
}

export type ExperienceDetail = NonNullable<Awaited<ReturnType<typeof getExperienceBySlug>>>;

// One line: supabase-js parses this string to type the result, and doesn't accept line breaks.
const EXPERIENCE_SELECT =
  "id, slug, title, summary, description, category, duration_minutes, price_cents, is_group_price, min_people, max_people, included, what_to_bring, meeting_point, meeting_point_map_url, operator_cancellation_terms, operator:operators!inner(id, slug, name, is_demo), area:areas!inner(id, slug, name)";

/** Everything the experience page needs. Null if the experience isn't live (RLS hides it). */
export async function getExperienceBySlug(slug: string, fromDate: string) {
  const db = createPublicClient();
  const experience = oneOrNull(
    await db
      .from("experiences")
      .select(EXPERIENCE_SELECT)
      .eq("slug", slug)
      .maybeSingle(),
    "experience",
  );
  if (!experience) return null;

  const [photos, slots, blackouts, recommendations, reviews, card] = await Promise.all([
    db.from("experience_photos").select("path, alt, sort_order").eq("experience_id", experience.id).order("sort_order"),
    db
      .from("experience_slots")
      .select("weekday, start_time, capacity")
      .eq("experience_id", experience.id)
      .order("start_time"),
    db.from("experience_blackouts").select("date").eq("experience_id", experience.id).gte("date", fromDate),
    db
      .from("recommendations")
      .select("id, tip, created_at, host:hosts!inner(id, slug, name, photo_path, area:areas(name, slug))")
      .eq("experience_id", experience.id)
      .order("created_at"),
    db
      .from("reviews")
      .select("id, rating, body, guest_display_name, created_at")
      .eq("experience_id", experience.id)
      .order("created_at", { ascending: false })
      .limit(20),
    db.from("experience_cards").select("rating, review_count").eq("id", experience.id).maybeSingle(),
  ]);

  return {
    ...experience,
    photos: orThrow(photos, "photos"),
    slots: orThrow(slots, "slots"),
    blackoutDates: orThrow(blackouts, "blackouts").map((b) => b.date),
    recommendations: orThrow(recommendations, "recommendations"),
    reviews: orThrow(reviews, "reviews"),
    rating: oneOrNull(card, "rating")?.rating ?? null,
    reviewCount: oneOrNull(card, "rating")?.review_count ?? 0,
  };
}

/** Other experiences recommended by the hosts who recommend this one. */
export async function getHostsAlsoRecommend(experienceId: string, hostIds: string[], limit = 4) {
  if (!hostIds.length) return [];
  const db = createPublicClient();
  const recs = orThrow(
    await db.from("recommendations").select("experience_id").in("host_id", hostIds).neq("experience_id", experienceId),
    "also recommend",
  );
  const counts = new Map<string, number>();
  for (const r of recs) counts.set(r.experience_id, (counts.get(r.experience_id) ?? 0) + 1);
  const cards = await getExperienceCardsByIds([...counts.keys()]);
  return cards.sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || byMostRecommended(a, b)).slice(0, limit);
}

// ---------- Operators ----------

export async function getOperatorBySlug(slug: string) {
  const db = createPublicClient();
  return oneOrNull(
    await db
      .from("operators")
      .select("id, slug, name, description, website, logo_path, is_demo, area:areas(name, slug)")
      .eq("slug", slug)
      .eq("status", "verified")
      .maybeSingle(),
    "operator",
  );
}

// ---------- Hosts ----------

export async function getHostCards(opts: { areaId?: string; featuredFirst?: boolean; limit?: number } = {}) {
  const db = createPublicClient();
  let query = db.from("host_cards").select("*");
  if (opts.areaId) query = query.eq("area_id", opts.areaId);
  const cards = orThrow(await query, "host cards").map(toHostCard);
  cards.sort((a, b) =>
    opts.featuredFirst
      ? (a.featuredRank ?? 1e6) - (b.featuredRank ?? 1e6) || b.pickCount - a.pickCount || a.name.localeCompare(b.name)
      : b.pickCount - a.pickCount || a.name.localeCompare(b.name),
  );
  return opts.limit ? cards.slice(0, opts.limit) : cards;
}

export async function getHostBySlug(slug: string): Promise<HostCard | null> {
  const db = createPublicClient();
  const row = oneOrNull(await db.from("host_cards").select("*").eq("slug", slug).maybeSingle(), "host");
  return row ? toHostCard(row) : null;
}

export async function getStorefrontPicks(hostId: string): Promise<StorefrontPick[]> {
  const db = createPublicClient();
  const rows = orThrow(
    await db.from("host_storefront").select("*").eq("host_id", hostId).order("sort_order"),
    "storefront",
  );
  return rows.map((r) => ({
    ...toExperienceCard(r),
    recommendationId: r.recommendation_id!,
    tip: r.tip!,
    sortOrder: r.sort_order ?? 0,
  }));
}

// ---------- Slug resolution (/[slug]) ----------

export type TopLevel =
  | { kind: "area"; area: Area }
  | { kind: "host"; host: HostCard }
  | null;

/** Areas first, then verified hosts (docs/03-site-structure.md). */
export async function resolveTopLevelSlug(slug: string): Promise<TopLevel> {
  const area = await getAreaBySlug(slug);
  if (area) return { kind: "area", area };
  const host = await getHostBySlug(slug);
  if (host) return { kind: "host", host };
  return null;
}

// ---------- Sitemap ----------

export async function getSitemapData() {
  const db = createPublicClient();
  const [areas, experiences, operators, hosts] = await Promise.all([
    db.from("areas").select("slug, id").eq("is_live", true),
    db.from("experience_cards").select("slug, area_slug, category, operator_slug"),
    db.from("operators").select("slug").eq("status", "verified"),
    db.from("host_cards").select("slug"),
  ]);
  return {
    areas: orThrow(areas, "areas"),
    experiences: orThrow(experiences, "experiences"),
    operators: orThrow(operators, "operators"),
    hosts: orThrow(hosts, "hosts"),
  };
}
