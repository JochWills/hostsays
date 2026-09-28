import { NextResponse, after, type NextRequest } from "next/server";
import { applyAttribution } from "@/lib/attribution-server";
import { isSameOrigin } from "@/lib/auth-routes";

export const dynamic = "force-dynamic";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Called by a host storefront once it's actually on screen (StorefrontBeacon), for visits that arrive by
 * client-side navigation, which the proxy can't tell apart from prefetches. Same rules as the proxy.
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new NextResponse(null, { status: 403 });
  const body = (await request.json().catch(() => null)) as { slug?: unknown } | null;
  const slug = typeof body?.slug === "string" ? body.slug : "";
  if (slug.length < 3 || slug.length > 40 || !SLUG.test(slug)) return new NextResponse(null, { status: 400 });

  const response = new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  const visit = await applyAttribution(request, response, [[slug, "storefront"]]);
  if (visit) after(visit);
  return response;
}
