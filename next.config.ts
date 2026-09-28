import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";

const nextConfig: NextConfig = {
  // Pin the project root so a stray lockfile higher up the tree isn't picked up.
  turbopack: { root: __dirname },
  images: {
    // Photos come from the public Supabase Storage buckets.
    remotePatterns: [new URL(`${supabaseUrl}/storage/v1/object/public/**`)],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
