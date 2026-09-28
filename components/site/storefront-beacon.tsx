"use client";

import { useEffect } from "react";
import { HOST_CHANGE_EVENT, readStayingHost } from "@/lib/attribution";

/**
 * On a host storefront: if this host isn't already the session host (e.g. the guest clicked through from
 * /hosts, a client-side navigation the proxy doesn't see), tell the server so it sets the host and counts
 * the visit. Direct visits and QR scans are already handled by the proxy, so this does nothing then.
 */
// Slugs already reported by this tab (guards against effects running twice and quick back-and-forth).
const sent = new Set<string>();

export function StorefrontBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    if (readStayingHost()?.slug === slug || sent.has(slug)) return;
    sent.add(slug);
    fetch("/api/attribution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    })
      .then(() => window.dispatchEvent(new Event(HOST_CHANGE_EVENT)))
      .catch(() => {});
  }, [slug]);
  return null;
}
