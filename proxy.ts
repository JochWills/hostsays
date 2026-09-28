import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { COMING_SOON, PREVIEW_COOKIE, matchesPreviewKey } from "@/lib/preview";
import { refreshSession } from "@/lib/supabase/proxy";
import { createAdminClient } from "@/lib/supabase/admin";
import { HOST_COOKIE, HOST_NAME_COOKIE, HOST_VIA_COOKIE, SEEN_COOKIE, type Via } from "@/lib/attribution";
import { findVerifiedHost, isBot } from "@/lib/attribution-server";

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
 * Remember which host sent this guest (docs/07-host-attribution.md): a verified host's storefront or any
 * page with ?ref=<slug> sets the session host (last touch wins), and a storefront visit is counted once
 * per session. Link prefetches are ignored, so hovering over a host card doesn't change anything.
 */
async function attributeHost(request: NextRequest, response: NextResponse, event: NextFetchEvent) {
  if (request.method !== "GET") return;
  if (request.headers.get("next-router-prefetch") || request.headers.get("purpose") === "prefetch") return;

  const storefrontSlug = request.nextUrl.pathname.match(STOREFRONT_PATH)?.[1];
  const ref = request.nextUrl.searchParams.get("ref")?.toLowerCase();
  const candidates: [string, Via][] = [];
  if (storefrontSlug && storefrontSlug.length >= 3) candidates.push([storefrontSlug, "storefront"]);
  if (ref && ref.length <= 40 && SLUG.test(ref)) candidates.push([ref, "ref_link"]);
  if (!candidates.length) return;

  for (const [slug, via] of candidates) {
    const host = await findVerifiedHost(slug);
    if (!host) continue;

    const session = { path: "/", sameSite: "lax" as const, secure: process.env.NODE_ENV === "production" };
    response.cookies.set(HOST_COOKIE, host.slug, session);
    response.cookies.set(HOST_NAME_COOKIE, host.name, session);
    response.cookies.set(HOST_VIA_COOKIE, via, session);

    if (via === "storefront" && !isBot(request.headers.get("user-agent"))) {
      const seen = (request.cookies.get(SEEN_COOKIE)?.value ?? "").split(",").filter(Boolean);
      if (!seen.includes(host.slug)) {
        response.cookies.set(SEEN_COOKIE, [...seen, host.slug].slice(-30).join(","), { ...session, httpOnly: true });
        event.waitUntil(
          Promise.resolve(createAdminClient().rpc("record_storefront_visit", { p_host_id: host.id })).then(({ error }) => {
            if (error) console.error("record_storefront_visit failed", error.message);
          }),
        );
      }
    }
    return;
  }
}

export const config = {
  // Skip Next.js assets, public images, API routes (health check, future webhooks and cron) and crawler files.
  matcher: ["/((?!_next/static|_next/image|images/|api/|favicon.ico|robots.txt|sitemap.xml).*)"],
};
