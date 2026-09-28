import { NextResponse, type NextRequest } from "next/server";
import { PREVIEW_COOKIE, PREVIEW_KEY, matchesPreviewKey } from "@/lib/preview";

export const dynamic = "force-dynamic";

/**
 * /preview?key=<PREVIEW_KEY> lets this browser past the coming-soon page (for a year).
 * /preview?off locks it again. A wrong key just lands on the coming-soon page.
 */
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url));
  const params = request.nextUrl.searchParams;

  if (params.has("off")) {
    response.cookies.delete(PREVIEW_COOKIE);
  } else if (matchesPreviewKey(params.get("key"))) {
    response.cookies.set(PREVIEW_COOKIE, PREVIEW_KEY, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  response.headers.set("Cache-Control", "no-store");
  return response;
}
