import type { MetadataRoute } from "next";
import { getSitemapData } from "@/lib/data/public";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

const STATIC_PAGES = [
  "/",
  "/explore",
  "/hosts",
  "/areas",
  "/how-it-works",
  "/for-hosts",
  "/for-operators",
  "/about",
  "/help",
  "/terms",
  "/privacy",
  "/cancellations",
  "/operator-terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { areas, experiences, operators, hosts } = await getSitemapData();

  // Area + category pages only where there's something live.
  const areaCategories = new Set(experiences.map((e) => `/${e.area_slug}/${e.category}`));

  const paths = [
    ...STATIC_PAGES,
    ...areas.map((a) => `/${a.slug}`),
    ...areaCategories,
    ...experiences.map((e) => `/x/${e.slug}`),
    ...operators.map((o) => `/o/${o.slug}`),
    ...hosts.map((h) => `/${h.slug}`),
  ];

  return paths.map((p) => ({ url: absoluteUrl(p) }));
}
