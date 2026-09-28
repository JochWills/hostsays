import { NextResponse, type NextRequest } from "next/server";
import { COMING_SOON, PREVIEW_COOKIE, matchesPreviewKey } from "@/lib/preview";

export function proxy(request: NextRequest) {
  if (!COMING_SOON) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (pathname === "/coming-soon" || pathname === "/preview") return NextResponse.next();
  if (matchesPreviewKey(request.cookies.get(PREVIEW_COOKIE)?.value)) return NextResponse.next();

  const response = NextResponse.rewrite(new URL("/coming-soon", request.url));
  response.headers.set("X-Robots-Tag", "noindex");
  return response;
}

export const config = {
  // Skip Next.js assets, public images, API routes (health check, future webhooks and cron) and crawler files.
  matcher: ["/((?!_next/static|_next/image|images/|api/|favicon.ico|robots.txt|sitemap.xml).*)"],
};
