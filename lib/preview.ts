/**
 * Coming-soon gate. While on, every page shows /coming-soon unless the browser has the preview
 * cookie, which is set by visiting /preview?key=<key>.
 *
 * On by default. To launch, set COMING_SOON = false below (or COMING_SOON=false in the environment,
 * e.g. in .env.local to skip the gate during development).
 */
export const COMING_SOON = process.env.COMING_SOON !== "false";
export const PREVIEW_COOKIE = "hs_preview";

// SHA-256 of Josh's preview key. Only the hash is stored, so the key itself never lands in git.
// To change the key: `printf %s NEWKEY | shasum -a 256` and replace this value.
const PREVIEW_KEY_SHA256 = "604c55a848b70098a642209514408638320010b04240fd4a7a647eb975530ace";

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** True if `value` is the preview key. Compares hashes, so timing reveals nothing about the key. */
export async function matchesPreviewKey(value: string | undefined | null): Promise<boolean> {
  if (!value || value.length > 200) return false;
  return (await sha256Hex(value)) === PREVIEW_KEY_SHA256;
}
