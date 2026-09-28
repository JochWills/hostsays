/** Canonical site URL, e.g. https://www.hostsays.com (no trailing slash). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/**
 * Search engines are kept out until launch (demo listings use real business names with placeholder prices).
 * Set ALLOW_INDEXING=true in Render when the site goes live.
 */
export const ALLOW_INDEXING = process.env.ALLOW_INDEXING === "true";

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
