import { NextResponse, type NextRequest } from "next/server";
import { COMING_SOON, PREVIEW_COOKIE, matchesPreviewKey } from "@/lib/preview";
import { refreshSession } from "@/lib/supabase/proxy";

// Signed-in areas. Public pages never read the session, so they skip the refresh and stay cacheable.
const SESSION_PATHS = /^\/(admin|host|operator|login|auth)(\/|$)/;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (COMING_SOON && pathname !== "/coming-soon" && pathname !== "/preview") {
    if (!(await matchesPreviewKey(request.cookies.get(PREVIEW_COOKIE)?.value))) {
      const response = NextResponse.rewrite(new URL("/coming-soon", request.url));
      response.headers.set("X-Robots-Tag", "noindex");
      return response;
    }
  }

  return SESSION_PATHS.test(pathname) ? refreshSession(request) : NextResponse.next();
}

export const config = {
  // Skip Next.js assets, public images, API routes (health check, future webhooks and cron) and crawler files.
  matcher: ["/((?!_next/static|_next/image|images/|api/|favicon.ico|robots.txt|sitemap.xml).*)"],
};
