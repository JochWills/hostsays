/**
 * Coming-soon gate. While COMING_SOON=true, every page shows /coming-soon unless the browser
 * has the preview cookie, which is set by visiting /preview?key=<PREVIEW_KEY>.
 * Set COMING_SOON=false in Render at launch.
 */
export const COMING_SOON = process.env.COMING_SOON === "true";
export const PREVIEW_KEY = process.env.PREVIEW_KEY ?? "";
export const PREVIEW_COOKIE = "hs_preview";

/** Constant-time string compare, so the key can't be guessed from response timing. */
export function matchesPreviewKey(value: string | undefined | null): boolean {
  if (!PREVIEW_KEY || !value || value.length !== PREVIEW_KEY.length) return false;
  let diff = 0;
  for (let i = 0; i < value.length; i++) diff |= value.charCodeAt(i) ^ PREVIEW_KEY.charCodeAt(i);
  return diff === 0;
}
