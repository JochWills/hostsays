"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function iso(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);
}

/**
 * Month calendar that only lets guests pick bookable days: on/after `minDate`, before `maxDate`,
 * on a weekday with slots, and not a blackout date. Dates are "YYYY-MM-DD" calendar dates.
 */
export function AvailabilityCalendar({
  minDate,
  maxDate,
  openWeekdays,
  blackoutDates,
  value,
  onChange,
}: {
  minDate: string;
  maxDate: string;
  openWeekdays: number[];
  blackoutDates: string[];
  value: string | null;
  onChange: (date: string) => void;
}) {
  const start = new Date(`${value ?? minDate}T00:00:00Z`);
  const [view, setView] = useState({ y: start.getUTCFullYear(), m: start.getUTCMonth() });
  const blackouts = useMemo(() => new Set(blackoutDates), [blackoutDates]);

  const first = new Date(Date.UTC(view.y, view.m, 1));
  const daysInMonth = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const lead = first.getUTCDay();
  const monthLabel = first.toLocaleDateString("en-ZA", { month: "long", year: "numeric", timeZone: "UTC" });

  const minMonth = minDate.slice(0, 7);
  const maxMonth = maxDate.slice(0, 7);
  const thisMonth = iso(view.y, view.m, 1).slice(0, 7);
  const move = (delta: number) => {
    const d = new Date(Date.UTC(view.y, view.m + delta, 1));
    setView({ y: d.getUTCFullYear(), m: d.getUTCMonth() });
  };

  const isOpen = (date: string, weekday: number) =>
    date >= minDate && date <= maxDate && openWeekdays.includes(weekday) && !blackouts.has(date);

  return (
    <div className="rounded-[12px] border border-line p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => move(-1)}
          disabled={thisMonth <= minMonth}
          aria-label="Previous month"
          className="grid h-8 w-8 cursor-pointer place-items-center rounded-full hover:bg-bg disabled:cursor-default disabled:opacity-30"
        >
          <ChevronLeft size={18} strokeWidth={1.8} />
        </button>
        <span className="text-[14px] font-semibold" aria-live="polite">
          {monthLabel}
        </span>
        <button
          type="button"
          onClick={() => move(1)}
          disabled={thisMonth >= maxMonth}
          aria-label="Next month"
          className="grid h-8 w-8 cursor-pointer place-items-center rounded-full hover:bg-bg disabled:cursor-default disabled:opacity-30"
        >
          <ChevronRight size={18} strokeWidth={1.8} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center" role="grid" aria-label={monthLabel}>
        {WEEKDAYS.map((d) => (
          <span key={d} className="py-1 text-[11px] font-semibold text-muted" aria-hidden="true">
            {d.slice(0, 2)}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`lead-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = iso(view.y, view.m, day);
          const weekday = (lead + i) % 7;
          const open = isOpen(date, weekday);
          const selected = value === date;
          return (
            <button
              key={date}
              type="button"
              disabled={!open}
              aria-pressed={selected}
              aria-label={new Date(`${date}T00:00:00Z`).toLocaleDateString("en-ZA", {
                weekday: "long",
                day: "numeric",
                month: "long",
                timeZone: "UTC",
              }) + (open ? "" : ", not available")}
              onClick={() => onChange(date)}
              className={`aspect-square cursor-pointer rounded-full text-[13.5px] transition-colors disabled:cursor-default disabled:text-muted disabled:opacity-35 ${
                selected ? "bg-green font-semibold text-green-ink" : open ? "font-medium hover:bg-bg" : ""
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
