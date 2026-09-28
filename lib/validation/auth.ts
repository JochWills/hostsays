import { z } from "zod";

export const passwordSignIn = z.object({
  email: z.email().max(254).transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1).max(200),
});

export const magicLinkRequest = z.object({
  email: z.email().max(254).transform((v) => v.trim().toLowerCase()),
});
