export type Bucket = "experience-photos" | "host-photos" | "operator-logos" | "area-images";

/** Public URL for a file in one of the public image buckets. */
export function publicImageUrl(bucket: Bucket, path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}
