import "server-only";
import { createPublicClient } from "@/lib/supabase/public";

type Host = { id: string; slug: string; name: string };

// Verified hosts by slug, kept in memory for a few minutes so the proxy doesn't query on every page view.
const TTL_MS = 5 * 60 * 1000;
let cache: { at: number; hosts: Map<string, Host> } | null = null;
let inflight: Promise<Map<string, Host>> | null = null;

async function load(): Promise<Map<string, Host>> {
  const db = createPublicClient();
  const { data, error } = await db.from("hosts").select("id, slug, name").eq("status", "verified");
  if (error) throw new Error(`verified hosts: ${error.message}`);
  return new Map(data.map((h) => [h.slug, h]));
}

/** A verified host by slug, or null. Unknown and unverified slugs are ignored (attribution rule 3). */
export async function findVerifiedHost(slug: string): Promise<Host | null> {
  if (!cache || Date.now() - cache.at > TTL_MS) {
    try {
      inflight ??= load().finally(() => (inflight = null));
      cache = { at: Date.now(), hosts: await inflight };
    } catch (e) {
      console.error(e);
      if (!cache) return null; // keep the last good list if a refresh fails
    }
  }
  return cache.hosts.get(slug) ?? null;
}

// Common crawlers and link-preview bots (they shouldn't count as storefront visits).
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|headless|lighthouse|curl|wget|python|axios|node-fetch/i;

export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT.test(userAgent);
}
