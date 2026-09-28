import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getAuthUser, requireRole } from "@/lib/auth";
import { getMyHost, getMyOperator } from "@/lib/data/portal";

/** The signed-in operator user and their business. Cached per request (layout + page share it). */
export const requireOperator = cache(async (path = "/operator") => {
  // The profile check and the business lookup run side by side (both only need the user id).
  const auth = await getAuthUser();
  const [user, operator] = await Promise.all([requireRole("operator", path), auth ? getMyOperator(auth.id) : null]);
  if (!operator) redirect("/login?error=no-account");
  return { user, operator };
});

/** The signed-in host user and their property. */
export const requireHost = cache(async (path = "/host") => {
  const auth = await getAuthUser();
  const [user, host] = await Promise.all([requireRole("host", path), auth ? getMyHost(auth.id) : null]);
  if (!host) redirect("/login?error=no-account");
  return { user, host };
});
