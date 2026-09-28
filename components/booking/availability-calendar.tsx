"use client";

import { useMemo } from "react";
import { MonthCalendar } from "@/components/ui/month-calendar";

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
  const blackouts = useMemo(() => new Set(blackoutDates), [blackoutDates]);
  return (
    <div className="rounded-[12px] border border-line p-3">
      <MonthCalendar
        minDate={minDate}
        maxDate={maxDate}
        value={value}
        onChange={onChange}
        isAvailable={(d) => openWeekdays.includes(new Date(`${d}T00:00:00Z`).getUTCDay()) && !blackouts.has(d)}
      />
    </div>
  );
}
