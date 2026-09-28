import "server-only";
import { NextResponse, type NextRequest } from "next/server";

/** Reject cross-site form posts to the auth routes (login CSRF, forced sign-out). */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

/** 303 back to /login with a message (and the email and destination kept). */
export function backToLogin(request: NextRequest, params: Record<string, string | null | undefined>) {
  const url = new URL("/login", request.url);
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);
  return NextResponse.redirect(url, 303);
}
