import "server-only";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { FormState } from "@/lib/form-state";
import { preparePhoto } from "@/lib/photo-upload";

/** Host photos show as a round avatar and a storefront picture about 700px wide. */
const MIN_HOST_PHOTO_EDGE = 800;

/**
 * Replace a host's storefront photo. Shared by the host portal (their own client, RLS applies) and admin
 * pages (service role). Callers check who may edit first.
 */
export async function replaceHostPhoto(db: SupabaseClient<Database>, hostId: string, form: FormData): Promise<FormState> {
  const photo = await preparePhoto(form.get("photo"), MIN_HOST_PHOTO_EDGE);
  if (!photo.ok) return { errors: { photo: photo.error } };

  const { data: current } = await db.from("hosts").select("photo_path").eq("id", hostId).single();
  const path = `${hostId}/${randomUUID()}.${photo.ext}`;
  const upload = await db.storage.from("host-photos").upload(path, photo.body, { contentType: photo.contentType });
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
