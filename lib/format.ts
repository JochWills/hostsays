/** Formatting helpers. Money is always integer cents in, display string out. */

/** 295000 → "R2,950"; 123450 → "R1,234.50". */
export function formatRand(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.trunc(cents));
  const rands = Math.floor(abs / 100);
  const rest = abs % 100;
  const whole = rands.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}R${whole}${rest ? `.${rest.toString().padStart(2, "0")}` : ""}`;
}

/** 45 → "45 min"; 120 → "2 hours"; 90 → "1 hr 30 min". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!m) return h === 1 ? "1 hour" : `${h} hours`;
  return `${h} hr ${m} min`;
}

/** "14:00:00" → "14:00". */
export function formatTime(time: string): string {
  return time.slice(0, 5);
}

/** "2026-10-03" → "Sat 3 Oct 2026". Dates are calendar dates, so format in UTC to avoid shifting. */
export function formatDate(isoDate: string, opts: { year?: boolean } = {}): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return d.toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(opts.year === false ? {} : { year: "numeric" }),
    timeZone: "UTC",
  });
}

/** "1 person" / "4 people". */
export function formatPeople(n: number): string {
  return n === 1 ? "1 person" : `${n} people`;
}

/** 0.06 → "6%". */
export function formatPercent(rate: number): string {
  return `${Math.round(rate * 1000) / 10}%`;
}

/** Province names as used in a sentence: "the Eastern Cape", "the Free State", but "Gauteng", "KwaZulu-Natal". */
export function provinceInSentence(name: string): string {
  return /cape$|^free state$|^north west$/i.test(name) ? `the ${name}` : name;
}
