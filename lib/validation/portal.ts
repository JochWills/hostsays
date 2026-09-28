import { z } from "zod";
import { CATEGORIES } from "@/lib/categories";
import { HOST_TYPES } from "@/lib/validation/auth";
import { TIP_MAX_LENGTH } from "@/lib/config";

const text = (min: number, max: number, message: string) => z.string().trim().min(min, message).max(max, message);
const optionalText = (max: number, message: string) => z.string().trim().max(max, message);
const phone = z.string().trim().regex(/^\+?[0-9 ()-]{9,20}$/, "Enter a phone number, e.g. 082 123 4567");
const optionalPhone = z.union([z.literal(""), phone]);
/** "airbnb.com/x" → "https://airbnb.com/x"; "" stays "". */
const webAddress = z
  .string()
  .trim()
  .max(300)
  .transform((v) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v))
  .pipe(z.union([z.literal(""), z.url({ protocol: /^https?$/, message: "Enter a web address, e.g. yourbusiness.co.za" })]));
const email = z.email("Enter an email address").max(254).transform((v) => v.trim().toLowerCase());
/** One item per line → trimmed, non-empty list. */
const lines = (maxItems: number) =>
  z
    .string()
    .transform((v) => v.split("\n").map((l) => l.trim()).filter(Boolean))
    .pipe(z.array(z.string().max(120, "Keep each line under 120 characters")).max(maxItems, `Up to ${maxItems} lines`));
/** "1 250,50" / "R1250.5" → 125050 cents. */
const rands = z
  .string()
  .transform((v) => v.replace(/[R\s,]/gi, ""))
  .pipe(z.string().regex(/^\d{1,6}(\.\d{1,2})?$/, "Enter a price in rand, e.g. 850"))
  .transform((v) => Math.round(Number(v) * 100))
  .pipe(z.number().int().min(100, "The price must be at least R1"));
const int = (min: number, max: number, message: string) => z.coerce.number(message).int(message).min(min, message).max(max, message);

// ---------- Your login ----------
export const profileUpdate = z.object({ fullName: text(2, 80, "Enter your name"), phone: optionalPhone });
export const passwordUpdate = z
  .object({
    password: z.string().min(8, "Use at least 8 characters").max(72, "Use 72 characters or fewer"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "The passwords don't match" });

// ---------- Operator ----------
export const operatorDetails = z.object({
  name: text(2, 80, "Enter your business name"),
  areaId: z.uuid("Choose your area"),
  description: optionalText(1500, "Keep this under 1,500 characters"),
  website: webAddress,
  contactEmail: email,
  contactPhone: optionalPhone,
});

export const experienceDetails = z
  .object({
    title: text(4, 80, "Give it a title between 4 and 80 characters"),
    category: z.enum(CATEGORIES.map((c) => c.value) as [string, ...string[]], "Choose a category"),
    areaId: z.uuid("Choose the area"),
    summary: text(10, 160, "Write a one-line summary (10–160 characters)"),
    description: text(40, 4000, "Describe the experience (at least 40 characters)"),
    durationMinutes: int(15, 60 * 24 * 7, "Enter the length in minutes, e.g. 180"),
    price: rands,
    isGroupPrice: z.literal("on").optional().transform((v) => v === "on"),
    minPeople: int(1, 100, "Enter a number from 1"),
    maxPeople: int(1, 500, "Enter a number from 1"),
    included: lines(15),
    whatToBring: lines(15),
    meetingPoint: text(3, 200, "Say where guests meet you"),
    meetingPointMapUrl: webAddress,
    cancellationTerms: optionalText(1000, "Keep this under 1,000 characters"),
  })
  .refine((v) => v.maxPeople >= v.minPeople, { path: ["maxPeople"], message: "Must be at least the minimum" });

export const slotInput = z.object({
  weekdays: z.array(z.coerce.number().int().min(0).max(6)).min(1, "Choose at least one day"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a start time"),
  capacity: int(1, 500, "Enter how many people fit, e.g. 8"),
});

export const blackoutInput = z.object({
  date: z.iso.date("Choose a date"),
  reason: optionalText(120, "Keep the note short"),
});

// ---------- Host ----------
export const hostDetails = z.object({
  name: text(2, 80, "Enter your property's name"),
  hostType: z.enum(HOST_TYPES.map((t) => t.value) as [string, ...string[]], "Choose the type of place"),
  areaId: z.uuid("Choose your area"),
  contactEmail: email,
  contactPhone: optionalPhone,
});

export const storefrontInput = z.object({
  welcomeNote: optionalText(600, "Keep your welcome note under 600 characters"),
});

export const bankInput = z.object({
  accountName: text(2, 80, "Enter the account holder's name"),
  bankName: text(2, 60, "Enter the bank"),
  accountNumber: z.string().trim().regex(/^\d{6,16}$/, "Enter the account number (digits only)"),
  branchCode: z.string().trim().regex(/^\d{4,8}$/, "Enter the branch code (digits only)"),
});

// ---------- Admin (extra fields only the HostSays team can change) ----------
const checkbox = z.literal("on").optional().transform((v) => v === "on");

export const adminHostDetails = hostDetails.extend({
  listingUrl: webAddress.refine((v) => v !== "", "Add the link to their listing"),
  /** "6" or "6,5" (percent) → 0.06 / 0.065. The database allows 0–10%. */
  commissionPercent: z
    .string()
    .trim()
    .transform((v) => v.replace(",", ".").replace(/%$/, ""))
    .pipe(z.string().regex(/^\d{1,2}(\.\d{1,2})?$/, "Enter a percentage from 0 to 10, e.g. 6"))
    .transform(Number)
    .pipe(z.number().min(0, "Enter a percentage from 0 to 10").max(10, "Enter a percentage from 0 to 10"))
    .transform((pct) => Math.round(pct * 100) / 10000),
  /** Position in the homepage "Hosts who know the area" row; blank = not featured. */
  featuredRank: z.union([z.literal("").transform(() => null), int(1, 99, "Enter a position from 1, or leave it blank")]),
  welcomeNote: optionalText(600, "Keep the welcome note under 600 characters"),
});

export const adminOperatorDetails = operatorDetails.extend({ isDemo: checkbox });

export const tipInput = z.object({
  tip: text(1, TIP_MAX_LENGTH, `Write a short tip (up to ${TIP_MAX_LENGTH} characters)`),
});

export { phone };
