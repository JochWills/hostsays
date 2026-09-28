import { NextResponse, type NextRequest } from "next/server";
import { PREVIEW_COOKIE, matchesPreviewKey } from "@/lib/preview";
import { publicUrl } from "@/lib/request-url";

export const dynamic = "force-dynamic";

/**
 * /preview?key=<key> lets this browser past the coming-soon page (for a year).
 * /preview?off locks it again. A wrong key just lands on the coming-soon page.
 */
export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(publicUrl("/", request));
  const params = request.nextUrl.searchParams;
  const key = params.get("key");

  if (params.has("off")) {
    response.cookies.delete(PREVIEW_COOKIE);
  } else if (key && (await matchesPreviewKey(key))) {
    response.cookies.set(PREVIEW_COOKIE, key, {
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
