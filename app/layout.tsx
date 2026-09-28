import type { Metadata, Viewport } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import { ALLOW_INDEXING, SITE_URL } from "@/lib/site";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Serif accent: only for the emphasised phrase in big headlines.
// Variable font, so no `weight` needed for 600/700 (Turbopack fails on italic + a weight list).
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "HostSays — Things to do, recommended by local hosts",
    template: "%s · HostSays",
  },
  description:
    "Discover and book tours, safaris and ocean experiences on the Eastern Cape coast, recommended by the hosts you stay with.",
  openGraph: {
    siteName: "HostSays",
    locale: "en_ZA",
    type: "website",
    images: [{ url: "/images/hero.jpg", width: 1186, height: 603, alt: "Game drive at golden hour" }],
  },
  robots: ALLOW_INDEXING ? { index: true, follow: true } : { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-ZA" className={`${manrope.variable} ${playfair.variable}`}>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
