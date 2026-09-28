import type { Enum } from "./supabase/types";

export type Category = Enum<"category">;

/** Display order and labels, from the approved homepage. */
export const CATEGORIES: { value: Category; label: string; short: string }[] = [
  { value: "safari", label: "Safaris & Wildlife", short: "Safaris" },
  { value: "ocean", label: "Ocean & Marine", short: "Ocean trips" },
  { value: "adventure", label: "Adventure & Outdoors", short: "Adventures" },
  { value: "food", label: "Food & Drink", short: "Food & drink" },
  { value: "culture", label: "Culture & Heritage", short: "Culture" },
  { value: "wellness", label: "Wellness & Slow Days", short: "Wellness" },
];

export function isCategory(value: string | undefined | null): value is Category {
  return CATEGORIES.some((c) => c.value === value);
}

export function categoryLabel(value: Category): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
