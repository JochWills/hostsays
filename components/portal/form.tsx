"use client";

import { createContext, useActionState, useContext, useEffect, useRef, useState } from "react";
import type { FormAction, FormState } from "@/lib/form-state";
import { btnPrimary, input, label as labelClass } from "@/components/ui/styles";
import { Dropdown } from "@/components/ui/dropdown";
import { DatePicker } from "@/components/ui/date-picker";
import { areaOptions, isSomewhereElse, type AreaChoiceProvince } from "@/lib/area-options";

const Ctx = createContext<FormState>({});

/** A portal form: runs a server action, shows field errors and a saved/failed message by the button. */
export function ActionForm({
  action,
  submitLabel,
  pendingLabel = "Saving…",
  className = "space-y-4",
  children,
  footer,
}: {
  action: FormAction;
  submitLabel: string;
  pendingLabel?: string;
  className?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.errors && !state.error) return;
    const first = ref.current?.querySelector<HTMLElement>("[aria-invalid=true], [role=alert]");
    first?.scrollIntoView({ block: "center", behavior: "smooth" });
    if (first?.matches("input, select, textarea")) first.focus({ preventScroll: true });
  }, [state]);

  return (
    <Ctx.Provider value={state}>
      <form ref={ref} action={formAction} noValidate className={className}>
        {children}
        {(state.error || state.errors?.form) && (
          <p role="alert" className="rounded-[10px] border border-gold/50 bg-gold/10 px-4 py-3 text-[14px]">
            {state.error ?? state.errors?.form}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending} className={btnPrimary}>
            {pending ? pendingLabel : submitLabel}
          </button>
          {state.ok && !pending && (
            <p role="status" className="text-[14px] font-semibold text-green">
              {state.ok}
            </p>
          )}
          {footer}
        </div>
      </form>
    </Ctx.Provider>
  );
}

function useField(name: string, defaultValue?: string | number | null) {
  const state = useContext(Ctx);
  const error = state.errors?.[name];
  return {
    error,
    value: state.values?.[name] ?? (defaultValue == null ? "" : String(defaultValue)),
    a11y: error ? { "aria-invalid": true as const, "aria-describedby": `${name}-error` } : {},
  };
}

function Wrap({ name, label, hint, error, children }: { name: string; label: string; hint?: React.ReactNode; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label id={`${name}-label`} htmlFor={name} className={labelClass}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${name}-error`} className="mt-1.5 text-[13px] font-medium text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-[13px] text-muted">{hint}</p>
      )}
    </div>
  );
}

type Common = { name: string; label: string; hint?: React.ReactNode; defaultValue?: string | number | null; required?: boolean };

export function TextField({
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
  prefix,
  ...p
}: Common & {
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  prefix?: string;
}) {
  const f = useField(p.name, p.defaultValue);
  const el = (
    <input
      id={p.name}
      name={p.name}
      type={type}
      required={p.required}
      placeholder={placeholder}
      autoComplete={autoComplete}
      inputMode={inputMode}
      defaultValue={f.value}
      className={`${input} ${prefix ? "pl-8" : ""}`}
      {...f.a11y}
    />
  );
  return (
    <Wrap name={p.name} label={p.label} hint={p.hint} error={f.error}>
      {prefix ? (
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted">{prefix}</span>
          {el}
        </div>
      ) : (
        el
      )}
    </Wrap>
  );
}

export function TextArea({ rows = 4, maxLength, placeholder, ...p }: Common & { rows?: number; maxLength?: number; placeholder?: string }) {
  const f = useField(p.name, p.defaultValue);
  return (
    <Wrap name={p.name} label={p.label} hint={p.hint} error={f.error}>
      <textarea
        id={p.name}
        name={p.name}
        rows={rows}
        maxLength={maxLength}
        required={p.required}
        placeholder={placeholder}
        defaultValue={f.value}
        className={`${input} resize-y`}
        {...f.a11y}
      />
    </Wrap>
  );
}

export function SelectField({
  options,
  placeholder,
  ...p
}: Common & { options: readonly { value: string; label: string; group?: string }[]; placeholder?: string }) {
  const f = useField(p.name, p.defaultValue);
  return (
    <Wrap name={p.name} label={p.label} hint={p.hint} error={f.error}>
      {/* key: start again from the refilled value after the form is submitted */}
      <Dropdown
        key={f.value}
        id={p.name}
        name={p.name}
        labelledBy={`${p.name}-label`}
        options={options}
        defaultValue={f.value}
        placeholder={placeholder}
        invalid={Boolean(f.error)}
        describedBy={f.error ? `${p.name}-error` : undefined}
      />
    </Wrap>
  );
}

/**
 * "Which area?" with every province's areas and, per province, "Somewhere else in …" plus a town box.
 * Someone still waiting for their town to be added starts on that option with their town filled in.
 */
export function AreaField({
  provinces,
  areaId,
  requestedProvinceId,
  requestedTown,
  label = "Area",
}: {
  provinces: AreaChoiceProvince[];
  areaId: string | null;
  requestedProvinceId?: string | null;
  requestedTown?: string | null;
  label?: string;
}) {
  const state = useContext(Ctx);
  const initial = areaId ?? (requestedProvinceId ? `other:${requestedProvinceId}` : "");
  const [choice, setChoice] = useState(state.values?.areaId ?? initial);
  const f = useField("areaId", initial);
  return (
    <>
      <Wrap name="areaId" label={label} error={f.error} hint="Not listed? Choose “Somewhere else” under the province.">
        <Dropdown
          key={f.value}
          id="areaId"
          name="areaId"
          labelledBy="areaId-label"
          options={areaOptions(provinces, { somewhereElse: true })}
          defaultValue={f.value}
          onChange={setChoice}
          placeholder="Choose the area"
          invalid={Boolean(f.error)}
          describedBy={f.error ? "areaId-error" : undefined}
        />
      </Wrap>
      {isSomewhereElse(choice) && (
        <TextField name="town" label="Town" defaultValue={requestedTown} hint="HostSays adds new towns when checking details." />
      )}
    </>
  );
}

/** Date field with our calendar (YYYY-MM-DD). */
export function DateField({ minDate, maxDate, placeholder = "Choose a date", ...p }: Common & { minDate: string; maxDate: string; placeholder?: string }) {
  const f = useField(p.name, p.defaultValue);
  return (
    <Wrap name={p.name} label={p.label} hint={p.hint} error={f.error}>
      <DatePicker
        key={f.value}
        id={p.name}
        name={p.name}
        labelledBy={`${p.name}-label`}
        defaultValue={f.value}
        minDate={minDate}
        maxDate={maxDate}
        placeholder={placeholder}
        clearable={false}
        invalid={Boolean(f.error)}
        describedBy={f.error ? `${p.name}-error` : undefined}
      />
    </Wrap>
  );
}

/** Time of day in 15-minute steps (HH:MM), e.g. a slot's start time. */
export function TimeField({ from = 5, to = 21, ...p }: Common & { from?: number; to?: number }) {
  const options = [];
  for (let h = from; h <= to; h++) {
    for (const m of [0, 15, 30, 45]) {
      const t = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      options.push({ value: t, label: t });
    }
  }
  return <SelectField {...p} options={options} placeholder="Choose a time" />;
}

export function CheckboxField({ name, label, defaultChecked }: { name: string; label: React.ReactNode; defaultChecked?: boolean }) {
  const state = useContext(Ctx);
  const checked = state.values ? state.values[name] === "on" : defaultChecked;
  const error = state.errors?.[name];
  return (
    <div>
      <label className="flex items-start gap-2.5 text-[14px]">
        <input
          type="checkbox"
          name={name}
          defaultChecked={checked}
          className="mt-1 size-4 accent-green"
          {...(error ? { "aria-invalid": true, "aria-describedby": `${name}-error` } : {})}
        />
        <span>{label}</span>
      </label>
      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-[13px] font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Two fields side by side from sm up. */
export function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

export function FileField({ name, label, accept, hint }: { name: string; label: string; accept: string; hint?: React.ReactNode }) {
  const f = useField(name);
  return (
    <Wrap name={name} label={label} hint={hint} error={f.error}>
      <input
        id={name}
        name={name}
        type="file"
        accept={accept}
        className="block w-full text-[14px] file:mr-3 file:cursor-pointer file:rounded-[10px] file:border file:border-line file:bg-surface file:px-4 file:py-2 file:font-semibold file:text-ink hover:file:border-green"
        {...f.a11y}
      />
    </Wrap>
  );
}

/** Tick one or more weekdays (value = experience_slots.weekday). Shown Monday first. */
export function WeekdayPicker({ name, label }: { name: string; label: string }) {
  const state = useContext(Ctx);
  const error = state.errors?.[name];
  const days: [number, string][] = [[1, "Mon"], [2, "Tue"], [3, "Wed"], [4, "Thu"], [5, "Fri"], [6, "Sat"], [0, "Sun"]];
  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined}>
      <legend className={labelClass}>{label}</legend>
      <div className="flex flex-wrap gap-2">
        {days.map(([value, text]) => (
          <label key={value} className="cursor-pointer">
            <input type="checkbox" name={name} value={value} className="peer sr-only" />
            <span className="inline-block rounded-[10px] border border-line bg-surface px-3 py-2 text-[14px] font-semibold peer-checked:border-green peer-checked:bg-green peer-checked:text-green-ink peer-focus-visible:outline-2 peer-focus-visible:outline-green">
              {text}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-[13px] font-medium text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** Submit button that asks first (for deletes and other one-way actions). */
export function ConfirmButton({ message, className, children, ...rest }: { message: string; className: string; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
