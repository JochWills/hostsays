import type { NextRequest } from "next/server";
import { SITE_URL } from "@/lib/site";

// Hosts this site answers on. Anything else (a forged Host header) falls back to SITE_URL.
const KNOWN_HOSTS = new Set([new URL(SITE_URL).host, "hostsays.com", "www.hostsays.com", "hostsays.onrender.com"]);

/**
 * The origin the visitor actually used, e.g. https://www.hostsays.com. Behind Render's proxy `request.url`
 * says https://localhost:10000, so never build redirects or origin checks from it; use this instead.
 */
export function publicOrigin(request: NextRequest): string {
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host"))?.split(",")[0].trim();
  if (!host) return SITE_URL;
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  if (!KNOWN_HOSTS.has(host) && !(local && process.env.NODE_ENV !== "production")) return SITE_URL;
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ?? (local ? "http" : "https");
  return `${proto}://${host}`;
}

/** An absolute URL on the origin the visitor used (for redirects from route handlers). */
export function publicUrl(path: string, request: NextRequest): URL {
  return new URL(path, publicOrigin(request));
}
