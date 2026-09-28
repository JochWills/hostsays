"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function iso(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);
}
function addDays(date: string, n: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const longLabel = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/**
 * Where the calendar opens when nothing is picked: the first day that can be picked, or the start of next
 * month when this month has fewer than a week of pickable days left (so it doesn't open on a nearly empty month).
 */
function firstShownDate(minDate: string, maxDate: string, isAvailable: (date: string) => boolean) {
  const nextMonth = iso(Number(minDate.slice(0, 4)), Number(minDate.slice(5, 7)), 1);
  let firstOpen: string | null = null;
  let openThisMonth = 0;
  for (let d = minDate; d < nextMonth && d <= maxDate; d = addDays(d, 1)) {
    if (!isAvailable(d)) continue;
    firstOpen ??= d;
    openThisMonth++;
  }
  if (openThisMonth >= 7 || nextMonth > maxDate) return firstOpen ?? minDate;
  for (let d = nextMonth; d <= maxDate && d < addDays(nextMonth, 62); d = addDays(d, 1)) if (isAvailable(d)) return d;
  return firstOpen ?? minDate;
}

/**
 * One month of days, Monday first. Dates are "YYYY-MM-DD" calendar dates. Only days between `minDate`
 * and `maxDate` for which `isAvailable` says yes can be picked. Arrow keys move between days
 * (PageUp/PageDown change month), Enter or Space picks.
 */
export function MonthCalendar({
  minDate,
  maxDate,
  value,
  onChange,
  isAvailable = () => true,
  autoFocus = false,
}: {
  minDate: string;
  maxDate: string;
  value: string | null;
  onChange: (date: string) => void;
  isAvailable?: (date: string) => boolean;
  autoFocus?: boolean;
}) {
  const [focus, setFocus] = useState(() => value ?? firstShownDate(minDate, maxDate, isAvailable));
  const [view, setView] = useState(() => ({ y: Number(focus.slice(0, 4)), m: Number(focus.slice(5, 7)) - 1 }));
  const gridRef = useRef<HTMLDivElement>(null);
  const keyboard = useRef(autoFocus);

  const first = new Date(Date.UTC(view.y, view.m, 1));
  const daysInMonth = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7; // Monday first
  const monthLabel = first.toLocaleDateString("en-ZA", { month: "long", year: "numeric", timeZone: "UTC" });
  const thisMonth = iso(view.y, view.m, 1).slice(0, 7);
  const canPick = (date: string) => date >= minDate && date <= maxDate && isAvailable(date);

  const showMonthOf = (date: string) => setView({ y: Number(date.slice(0, 4)), m: Number(date.slice(5, 7)) - 1 });
  const moveMonth = (delta: number) => {
    const d = new Date(Date.UTC(view.y, view.m + delta, 1));
    setView({ y: d.getUTCFullYear(), m: d.getUTCMonth() });
  };

  // After keyboard movement, put focus on the focused day (it may be in a newly shown month).
  // (Next frame: when opened in a popover, it's only placed and made visible after this first render.)
  useEffect(() => {
    if (!keyboard.current) return;
    const id = requestAnimationFrame(() => gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focus}"]`)?.focus());
    return () => cancelAnimationFrame(id);
  }, [focus, view]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let next: string | null = null;
    if (e.key in moves) next = addDays(focus, moves[e.key]);
    else if (e.key === "PageUp" || e.key === "PageDown") {
      const d = new Date(`${focus}T00:00:00Z`);
      d.setUTCMonth(d.getUTCMonth() + (e.key === "PageDown" ? 1 : -1));
      next = d.toISOString().slice(0, 10);
    } else if (e.key === "Home" || e.key === "End") {
      next = e.key === "Home" ? addDays(focus, -((new Date(`${focus}T00:00:00Z`).getUTCDay() + 6) % 7)) : addDays(focus, 6 - ((new Date(`${focus}T00:00:00Z`).getUTCDay() + 6) % 7));
    }
    if (!next) return;
    e.preventDefault();
    if (next < minDate) next = minDate;
    if (next > maxDate) next = maxDate;
    keyboard.current = true;
    setFocus(next);
    if (next.slice(0, 7) !== thisMonth) showMonthOf(next);
  };

  const navBtn = "grid size-8 cursor-pointer place-items-center rounded-full hover:bg-panel disabled:cursor-default disabled:opacity-30";
  const focusInView = focus.slice(0, 7) === thisMonth ? focus : null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => moveMonth(-1)} disabled={thisMonth <= minDate.slice(0, 7)} aria-label="Previous month" className={navBtn}>
          <ChevronLeft size={18} strokeWidth={1.8} />
        </button>
        <span className="text-[14px] font-semibold" aria-live="polite">
          {monthLabel}
        </span>
        <button type="button" onClick={() => moveMonth(1)} disabled={thisMonth >= maxDate.slice(0, 7)} aria-label="Next month" className={navBtn}>
          <ChevronRight size={18} strokeWidth={1.8} />
        </button>
      </div>
      <div ref={gridRef} className="grid grid-cols-7 gap-0.5 text-center" role="group" aria-label={monthLabel} onKeyDown={onKeyDown}>
        {WEEKDAYS.map((d) => (
          <span key={d} className="py-1 text-[11px] font-semibold text-muted" aria-hidden="true">
            {d}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`lead-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const date = iso(view.y, view.m, i + 1);
          const open = canPick(date);
          const selected = value === date;
          // One day is tabbable: the focused one, else the selected one, else the first of the month.
          const tabbable = date === (focusInView ?? (value?.slice(0, 7) === thisMonth ? value : iso(view.y, view.m, 1)));
          return (
            <button
              key={date}
              type="button"
              data-date={date}
              tabIndex={tabbable ? 0 : -1}
              aria-disabled={!open || undefined}
              aria-pressed={selected}
              aria-label={longLabel(date) + (open ? "" : ", not available")}
              onFocus={() => setFocus(date)}
              onClick={() => open && onChange(date)}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && open) {
                  e.preventDefault();
                  onChange(date);
                }
              }}
              className={`aspect-square rounded-full text-[13.5px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-green ${
                selected
                  ? "cursor-pointer bg-green font-semibold text-green-ink"
                  : open
                    ? "cursor-pointer font-medium hover:bg-panel"
                    : "cursor-default text-muted opacity-35"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
