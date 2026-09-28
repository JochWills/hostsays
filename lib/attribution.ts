/**
 * Host attribution cookies (docs/07-host-attribution.md). All are session cookies: they end when the browser
 * closes. Set by the proxy; read in the browser for the "Staying at" pill and the booking form.
 * The server only ever trusts the slug, checked against verified hosts, never the display name.
 */
export const HOST_COOKIE = "hs_host"; // host slug
export const HOST_NAME_COOKIE = "hs_host_name"; // display only
export const HOST_VIA_COOKIE = "hs_host_via"; // "storefront" | "ref_link"
export const SEEN_COOKIE = "hs_seen"; // storefront slugs already counted this session

export type Via = "storefront" | "ref_link";
export type StayingHost = { slug: string; name: string; via: Via };

/** Fired on window when the guest clears (or changes) their host, so the pill and booking form stay in step. */
export const HOST_CHANGE_EVENT = "hs:host-change";

function readCookie(name: string): string | null {
  const hit = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : null;
}

/** The host remembered this session, in the browser. */
export function readStayingHost(): StayingHost | null {
  const slug = readCookie(HOST_COOKIE);
  if (!slug) return null;
  const via = readCookie(HOST_VIA_COOKIE) === "ref_link" ? "ref_link" : "storefront";
  return { slug, name: readCookie(HOST_NAME_COOKIE) || slug, via };
}

export function clearStayingHost() {
  for (const name of [HOST_COOKIE, HOST_NAME_COOKIE, HOST_VIA_COOKIE]) {
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
  window.dispatchEvent(new Event(HOST_CHANGE_EVENT));
}
