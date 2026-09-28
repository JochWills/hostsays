import { z } from "zod";
import { CATEGORIES } from "@/lib/categories";
import { isIsoDate } from "@/lib/dates";

const categoryValues = CATEGORIES.map((c) => c.value) as [string, ...string[]];

/** Price caps offered in the filter, in rands. */
export const PRICE_CAPS = [500, 1000, 2000, 3000];
/** Price range slider: 0 to this many rands; the top end means "no maximum". Steps of PRICE_STEP. */
export const PRICE_SLIDER_MAX = 5000;
export const PRICE_STEP = 100;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || undefined);

/**
 * /explore query string. Invalid values are dropped rather than erroring, so a mangled link still
 * shows results.
 */
export const exploreParams = z.object({
  where: optionalText(60).catch(undefined),
  area: optionalText(40).catch(undefined),
  category: z.enum(categoryValues).optional().catch(undefined),
  q: optionalText(60).catch(undefined),
  date: z
    .string()
    .optional()
    .transform((v) => (v && isIsoDate(v) ? v : undefined))
    .catch(undefined),
  people: z.coerce.number().int().min(1).max(50).optional().catch(undefined),
  min: z.coerce.number().int().min(1).max(100000).optional().catch(undefined),
  max: z.coerce.number().int().min(1).max(100000).optional().catch(undefined),
  sort: z.enum(["recommended", "price-asc", "price-desc"]).optional().catch(undefined),
});

export type ExploreParams = z.infer<typeof exploreParams>;

/** Next gives string | string[] | undefined per key; keep the first value. */
export function firstValues(sp: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
}
