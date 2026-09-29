import { z } from "zod";

export const passwordSignIn = z.object({
  email: z.email().max(254).transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1).max(200),
});

export const magicLinkRequest = z.object({
  email: z.email().max(254).transform((v) => v.trim().toLowerCase()),
});

// ---------- Sign-up ----------

export const ACCOUNT_TYPES = ["guest", "host", "operator"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const HOST_TYPES = [
  { value: "guesthouse", label: "Guesthouse" },
  { value: "bnb", label: "B&B" },
  { value: "self_catering", label: "Self-catering" },
  { value: "airbnb", label: "Airbnb" },
  { value: "lodge", label: "Lodge" },
  { value: "hotel", label: "Hotel" },
  { value: "other", label: "Other" },
] as const;

const text = (min: number, max: number, message: string) => z.string().trim().min(min, message).max(max, message);
const webAddress = z
  .string()
  .trim()
  .max(300)
  .transform((v) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v))
  .pipe(z.union([z.literal(""), z.url({ protocol: /^https?$/, message: "Enter a web address, e.g. airbnb.com/rooms/123" })]));
const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()-]{9,20}$/, "Enter a phone number, e.g. 082 123 4567");

/**
 * Where a host or operator is: an area id, or "other:<province id>" with the town typed in `town`
 * (an admin then adds or assigns the area).
 */
const areaChoice = z.string().regex(/^(other:)?[0-9a-f-]{36}$/i, "Choose your area");
const town = z.string().trim().max(60, "Keep the town name short").optional().default("");
/** The "Somewhere else" option needs a town. */
function checkTown(v: { areaId: string; town: string }, ctx: z.RefinementCtx) {
  if (v.areaId.startsWith("other:") && v.town.length < 2) ctx.addIssue({ code: "custom", path: ["town"], message: "Enter your town" });
}

/** Details kept (in the auth user's metadata) until the email is confirmed, then turned into the account. */
const guestDetails = z.object({ type: z.literal("guest"), fullName: text(2, 80, "Enter your name") });
const hostDetails = z.object({
  type: z.literal("host"),
  fullName: text(2, 80, "Enter your name"),
  name: text(2, 80, "Enter your property's name"),
  hostType: z.enum(HOST_TYPES.map((t) => t.value) as [string, ...string[]], "Choose the type of place"),
  areaId: areaChoice,
  town,
  listingUrl: webAddress.refine((v) => v !== "", "Add a link to your listing or website"),
  phone,
}).superRefine(checkTown);
const operatorDetails = z.object({
  type: z.literal("operator"),
  fullName: text(2, 80, "Enter your name"),
  name: text(2, 80, "Enter your business name"),
  areaId: areaChoice,
  town,
  website: webAddress,
  phone,
}).superRefine(checkTown);

export const signupDetails = z.discriminatedUnion("type", [guestDetails, hostDetails, operatorDetails]);
export type SignupDetails = z.infer<typeof signupDetails>;

export const signupCredentials = z.object({
  email: z.email("Enter your email address").max(254).transform((v) => v.trim().toLowerCase()),
  password: z.string().min(8, "Use at least 8 characters").max(72, "Use 72 characters or fewer"),
  agree: z.literal("on", "Please agree to the terms to continue"),
});
