"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { input as inputCls } from "@/components/ui/styles";
import { MonthCalendar } from "./month-calendar";
import { Floating } from "./floating";

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "Thu 1 Oct 2026" (or "Thu 1 Oct" when short). */
function dateLabel(date: string, short = false) {
  const d = new Date(`${date}T00:00:00Z`);
  const base = `${WD[d.getUTCDay()]} ${d.getUTCDate()} ${MO[d.getUTCMonth()]}`;
  return short ? base : `${base} ${d.getUTCFullYear()}`;
}

/**
 * Our own date picker: a button showing the date ("Sat 3 Oct 2026") that opens a month calendar.
 * A hidden input carries `name` and the value as YYYY-MM-DD, so it works in plain forms and server actions.
 * `variant="field"` looks like our text inputs; `variant="bare"` is borderless text (e.g. the Explore bar).
 */
export function DatePicker({
  id,
  name,
  value: controlled,
  defaultValue = "",
  onChange,
  minDate,
  maxDate,
  placeholder = "Any date",
  clearable = true,
  variant = "field",
  className = "",
  invalid,
  describedBy,
  labelledBy,
  ariaLabel,
  showIcon = variant === "field",
}: {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  minDate: string;
  maxDate: string;
  placeholder?: string;
  clearable?: boolean;
  variant?: "field" | "bare";
  className?: string;
  invalid?: boolean;
  describedBy?: string;
  labelledBy?: string;
  ariaLabel?: string;
  showIcon?: boolean;
}) {
  const auto = useId();
  const buttonId = id ?? `dp-${auto}`;
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = controlled ?? uncontrolled;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const shortLabel = (d: string) => dateLabel(d, variant === "bare");

  const set = (v: string) => {
    if (controlled === undefined) setUncontrolled(v);
    onChange?.(v);
    setOpen(false);
    document.getElementById(buttonId)?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!rootRef.current?.contains(t) && !panelRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const toggle = () => {
    setOpen((o) => !o);
  };

  const trigger =
    variant === "field"
      ? `${inputCls} flex items-center gap-2.5 text-left ${invalid ? "border-danger" : ""}`
      : "flex w-full items-center gap-2 py-0.5 text-left text-[15px] font-medium text-ink focus:outline-none focus-visible:underline";

  return (
    <div
      ref={rootRef}
      className={`relative ${className}`}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.preventDefault();
          setOpen(false);
          document.getElementById(buttonId)?.focus();
        }
      }}
    >
      {name && <input type="hidden" name={name} value={value} />}
      <button
        id={buttonId}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-describedby={describedBy}
        aria-labelledby={labelledBy ? `${labelledBy} ${buttonId}` : undefined}
        aria-label={ariaLabel ? `${ariaLabel}: ${value ? shortLabel(value) : placeholder}` : undefined}
        onClick={toggle}
        className={`cursor-pointer ${trigger}`}
      >
        {showIcon && <CalendarDays size={17} strokeWidth={1.8} aria-hidden="true" className="shrink-0 text-muted" />}
        <span className={`min-w-0 truncate ${value ? "" : "text-muted"}`}>{value ? shortLabel(value) : placeholder}</span>
      </button>

      {open && (
        <Floating
          anchorRef={rootRef}
          panelRef={panelRef}
          width={296}
          estimatedHeight={380}
          role="dialog"
          aria-label="Choose a date"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setOpen(false);
              document.getElementById(buttonId)?.focus();
            }
          }}
          className="rounded-[14px] border border-line bg-surface p-3 text-ink shadow-[0_12px_32px_rgba(30,39,35,0.16)]"
        >
          <MonthCalendar minDate={minDate} maxDate={maxDate} value={value || null} onChange={set} autoFocus />
          {clearable && (
            <div className="mt-2 flex justify-between border-t border-line pt-2">
              <button type="button" onClick={() => set("")} className="cursor-pointer rounded-[8px] px-2.5 py-1.5 text-[13.5px] font-semibold text-green hover:bg-panel">
                {placeholder === "Any date" ? "Any date" : "Clear"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="cursor-pointer rounded-[8px] px-2.5 py-1.5 text-[13.5px] font-semibold hover:bg-panel">
                Close
              </button>
            </div>
          )}
        </Floating>
      )}
    </div>
  );
}
