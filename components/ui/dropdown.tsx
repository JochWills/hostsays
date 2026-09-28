"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { input as inputCls } from "@/components/ui/styles";
import { Floating } from "./floating";

export type DropdownOption = { value: string; label: string; group?: string; disabled?: boolean };

/**
 * Our own select: a button that opens a list. Works like a native select for forms (a hidden input carries
 * `name` and the value) and for keyboards and screen readers (combobox + listbox, arrows, Home/End,
 * Enter/Space, Escape, type-to-jump). Options with a `group` are listed under that heading.
 *
 * `variant="field"` looks like our text inputs; `variant="bare"` is borderless text (e.g. the Explore bar).
 */
export function Dropdown({
  id,
  name,
  options,
  value: controlled,
  defaultValue = "",
  onChange,
  placeholder = "Choose…",
  variant = "field",
  className = "",
  invalid,
  describedBy,
  labelledBy,
  ariaLabel,
  required,
}: {
  id?: string;
  name?: string;
  options: readonly DropdownOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  variant?: "field" | "bare";
  className?: string;
  invalid?: boolean;
  describedBy?: string;
  labelledBy?: string;
  ariaLabel?: string;
  required?: boolean;
}) {
  const auto = useId();
  const buttonId = id ?? `dd-${auto}`;
  const listId = `${buttonId}-list`;
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = controlled ?? uncontrolled;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: "", at: 0 });

  const enabled = useMemo(() => options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0), [options]);
  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = options[selectedIndex];

  const choose = (i: number) => {
    const o = options[i];
    if (!o || o.disabled) return;
    if (controlled === undefined) setUncontrolled(o.value);
    onChange?.(o.value);
    setOpen(false);
    document.getElementById(buttonId)?.focus();
  };

  const openList = (at?: number) => {
    setActive(at ?? (selectedIndex >= 0 ? selectedIndex : enabled[0] ?? -1));
    setOpen(true);
  };

  // Close on outside click; keep the active option in view.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!rootRef.current?.contains(t) && !panelRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);
  useEffect(() => {
    // Scroll inside the list only (scrollIntoView could scroll the whole page).
    const panel = panelRef.current;
    const item = open && active >= 0 ? panel?.querySelector<HTMLElement>(`[data-index="${active}"]`) : null;
    if (!panel || !item) return;
    const top = item.offsetTop - panel.offsetTop;
    if (top < panel.scrollTop) panel.scrollTop = top - 6;
    else if (top + item.offsetHeight > panel.scrollTop + panel.clientHeight) panel.scrollTop = top + item.offsetHeight - panel.clientHeight + 6;
  }, [open, active]);

  const step = (dir: 1 | -1) => {
    const pos = enabled.indexOf(active);
    const next = enabled[Math.min(enabled.length - 1, Math.max(0, pos + dir))] ?? enabled[0];
    setActive(next);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) openList();
      else step(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Home" || e.key === "End") {
      if (!open) return;
      e.preventDefault();
      setActive(e.key === "Home" ? enabled[0] : enabled[enabled.length - 1]);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open) choose(active);
      else openList();
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Tab" && open) {
      setOpen(false);
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      // Type to jump: "k" → Kenton-on-Sea, "ke" keeps narrowing while typing quickly.
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : "") + e.key.toLowerCase(), at: now };
      const hit = enabled.find((i) => options[i].label.toLowerCase().startsWith(typed.current.text));
      if (hit !== undefined) {
        if (open) setActive(hit);
        else choose(hit);
      }
    }
  };

  const groups = [...new Set(options.map((o) => o.group ?? ""))];
  const trigger =
    variant === "field"
      ? `${inputCls} flex items-center justify-between gap-2 text-left ${invalid ? "border-danger" : ""}`
      : "flex w-full items-center justify-between gap-2 py-0.5 text-left text-[15px] font-medium text-ink focus:outline-none focus-visible:underline";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={value} required={required} />}
      <button
        id={buttonId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-labelledby={labelledBy ? `${labelledBy} ${buttonId}` : undefined}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={`cursor-pointer ${trigger}`}
      >
        <span className={`min-w-0 truncate ${selected ? "" : "text-muted"}`}>{selected?.label ?? placeholder}</span>
        <ChevronDown size={16} strokeWidth={2} aria-hidden="true" className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <Floating
          anchorRef={rootRef}
          panelRef={panelRef}
          width="anchor"
          estimatedHeight={Math.min(300, options.length * 38 + 16)}
          cap={300}
          className="max-w-[min(340px,calc(100vw-16px))] rounded-[12px] border border-line bg-surface p-1.5 text-[14.5px] text-ink shadow-[0_12px_32px_rgba(30,39,35,0.16)]"
        >
        <ul id={listId} role="listbox" aria-labelledby={labelledBy ?? buttonId}>
          {groups.map((g) => (
            <li key={g || "_"} role="presentation">
              {g && <p className="px-2.5 pt-2.5 pb-1 text-[11.5px] font-bold tracking-[0.06em] text-muted uppercase">{g}</p>}
              <ul role="group" aria-label={g || undefined}>
                {options.map((o, i) =>
                  (o.group ?? "") !== g ? null : (
                    <li
                      key={o.value}
                      id={`${listId}-${i}`}
                      data-index={i}
                      role="option"
                      aria-selected={o.value === value}
                      aria-disabled={o.disabled || undefined}
                      onPointerEnter={() => !o.disabled && setActive(i)}
                      onClick={() => choose(i)}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-[8px] px-2.5 py-2 ${
                        o.disabled ? "cursor-default opacity-40" : ""
                      } ${i === active ? "bg-panel" : ""} ${o.value === value ? "font-semibold text-green" : ""}`}
                    >
                      <span>{o.label}</span>
                      {o.value === value && <Check size={16} strokeWidth={2.2} aria-hidden="true" />}
                    </li>
                  ),
                )}
              </ul>
            </li>
          ))}
        </ul>
        </Floating>
      )}
    </div>
  );
}
