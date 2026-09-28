import "server-only";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { FormState } from "@/lib/form-state";

const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/**
 * Replace a host's storefront photo. Shared by the host portal (their own client, RLS applies) and admin
 * pages (service role). Callers check who may edit first.
 */
export async function replaceHostPhoto(db: SupabaseClient<Database>, hostId: string, form: FormData): Promise<FormState> {
  const file = form.get("photo");
  if (!(file instanceof File) || file.size === 0) return { errors: { photo: "Choose a photo to upload" } };
  const ext = PHOTO_TYPES[file.type];
  if (!ext) return { errors: { photo: "Use a JPG, PNG or WebP photo" } };
  if (file.size > 5 * 1024 * 1024) return { errors: { photo: "Photos must be 5 MB or smaller" } };

  const { data: current } = await db.from("hosts").select("photo_path").eq("id", hostId).single();
  const path = `${hostId}/${randomUUID()}.${ext}`;
  const upload = await db.storage.from("host-photos").upload(path, file, { contentType: file.type });
  if (upload.error) {
    console.error("host photo upload failed", upload.error.message);
    return { error: "Couldn't upload the photo. Please try again." };
  }
  const { error } = await db.from("hosts").update({ photo_path: path }).eq("id", hostId);
  if (error) {
    await db.storage.from("host-photos").remove([path]);
    return { error: "Couldn't save. Please try again." };
  }
  // Remove the previous photo (always under this host's folder).
  if (current?.photo_path?.startsWith(`${hostId}/`)) await db.storage.from("host-photos").remove([current.photo_path]);
  return { ok: "Photo updated" };
}
