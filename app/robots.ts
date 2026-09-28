import type { MetadataRoute } from "next";
import { ALLOW_INDEXING, absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!ALLOW_INDEXING) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Exact portal roots ($) and their subpaths, so /hosts and storefront slugs like /hostel-x stay crawlable.
      disallow: [
        "/b/",
        "/host$",
        "/host/",
        "/operator$",
        "/operator/",
        "/admin$",
        "/admin/",
        "/login",
        "/auth/",
        "/invite/",
        "/api/",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
