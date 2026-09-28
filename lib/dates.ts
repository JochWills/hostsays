import { MIN_LEAD_DAYS, TIMEZONE } from "./config";

/** Today's calendar date in South Africa, as "YYYY-MM-DD". */
export function todayInSA(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return now.toLocaleDateString("en-CA", { timeZone: TIMEZONE });
}

/** Adds whole days to a "YYYY-MM-DD" date. */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Earliest date a guest can request (tomorrow at launch). */
export function minBookableDate(now: Date = new Date()): string {
  return addDays(todayInSA(now), MIN_LEAD_DAYS);
}

/** 0 = Sunday … 6 = Saturday, matching experience_slots.weekday. */
export function weekdayOf(isoDate: string): number {
  return new Date(`${isoDate}T00:00:00Z`).getUTCDay();
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}
