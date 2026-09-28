import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getMyHost, getMyOperator } from "@/lib/data/portal";

/** The signed-in operator user and their business. Cached per request (layout + page share it). */
export const requireOperator = cache(async (path = "/operator") => {
  const user = await requireRole("operator", path);
  const operator = await getMyOperator(user.id);
  if (!operator) redirect("/login?error=no-account");
  return { user, operator };
});

/** The signed-in host user and their property. */
export const requireHost = cache(async (path = "/host") => {
  const user = await requireRole("host", path);
  const host = await getMyHost(user.id);
  if (!host) redirect("/login?error=no-account");
  return { user, host };
});
