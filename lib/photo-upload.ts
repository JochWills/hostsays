import "server-only";
import sharp from "sharp";

/** Uploaded photos are checked, turned upright and saved as WebP no bigger than this on the long side. */
const MAX_EDGE = 2400;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp"]);

export type PreparedPhoto = { ok: true; body: Buffer; contentType: "image/webp"; ext: "webp" } | { ok: false; error: string };

/**
 * Check an uploaded photo is big enough to look sharp, then prepare it for storage: rotate it the right way
 * up (phone photos), strip location data, shrink it to MAX_EDGE and save as high-quality WebP.
 * `minLongEdge`: the smallest allowed long side in pixels, e.g. 1200 for experience photos.
 */
export async function preparePhoto(file: FormDataEntryValue | null, minLongEdge: number): Promise<PreparedPhoto> {
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose a photo to upload" };
  if (!ACCEPTED.has(file.type)) return { ok: false, error: "Use a JPG, PNG or WebP photo" };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "Photos must be 5 MB or smaller" };

  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), { failOn: "error" }).rotate(); // upright per EXIF
    const meta = await image.metadata();
    // After rotation the sides may swap, but the long edge stays the same.
    const longEdge = Math.max(meta.width ?? 0, meta.height ?? 0);
    if (longEdge < minLongEdge) {
      return {
        ok: false,
        error: `This photo is too small (${meta.width}×${meta.height} pixels), so it would look blurry. Use one at least ${minLongEdge} pixels wide: the original from your camera or phone works best.`,
      };
    }
    const body = await image
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 86 })
      .toBuffer();
    return { ok: true, body, contentType: "image/webp", ext: "webp" };
  } catch (err) {
    console.error("preparePhoto failed", err instanceof Error ? err.message : err);
    return { ok: false, error: "We couldn't read that photo. Try another one (JPG, PNG or WebP)." };
  }
}
