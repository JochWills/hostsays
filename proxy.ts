import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { COMING_SOON, PREVIEW_COOKIE, matchesPreviewKey } from "@/lib/preview";
import { refreshSession } from "@/lib/supabase/proxy";
import type { Via } from "@/lib/attribution";
import { applyAttribution } from "@/lib/attribution-server";

// Signed-in areas. Public pages never read the session, so they skip the refresh and stay cacheable.
const SESSION_PATHS = /^\/(admin|host|operator|account|login|signup|auth)(\/|$)/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const STOREFRONT_PATH = /^\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/;

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  if (COMING_SOON && pathname !== "/coming-soon" && pathname !== "/preview") {
    if (!(await matchesPreviewKey(request.cookies.get(PREVIEW_COOKIE)?.value))) {
      const response = NextResponse.rewrite(new URL("/coming-soon", request.url));
      response.headers.set("X-Robots-Tag", "noindex");
      return response;
    }
  }

  if (SESSION_PATHS.test(pathname)) return refreshSession(request);
  const response = NextResponse.next();
  await attributeHost(request, response, event);
  return response;
}

/**
 * Remember which host sent this guest (docs/07-host-attribution.md) when a page is actually opened: a
 * verified host's storefront or any page with ?ref=<slug>. Only real page loads count. Next.js prefetches
 * (and client-side navigations) are fetches, not documents; on the live server the prefetch header isn't
 * visible here, so rely on the browser's Sec-Fetch-Dest instead. Client-side visits to a storefront are
 * recorded by the page itself (StorefrontBeacon → /api/attribution).
 */
async function attributeHost(request: NextRequest, response: NextResponse, event: NextFetchEvent) {
  if (request.method !== "GET") return;
  const dest = request.headers.get("sec-fetch-dest");
  if ((dest && dest !== "document") || request.headers.get("rsc") || request.nextUrl.searchParams.has("_rsc")) return;

  const storefrontSlug = request.nextUrl.pathname.match(STOREFRONT_PATH)?.[1];
  const ref = request.nextUrl.searchParams.get("ref")?.toLowerCase();
  const candidates: [string, Via][] = [];
  if (storefrontSlug && storefrontSlug.length >= 3) candidates.push([storefrontSlug, "storefront"]);
  if (ref && ref.length <= 40 && SLUG.test(ref)) candidates.push([ref, "ref_link"]);
  if (!candidates.length) return;

  const visit = await applyAttribution(request, response, candidates);
  if (visit) event.waitUntil(visit);
}

export const config = {
  // Skip Next.js assets, public images, API routes (health check, future webhooks and cron) and crawler files.
  matcher: ["/((?!_next/static|_next/image|images/|api/|favicon.ico|robots.txt|sitemap.xml).*)"],
};
