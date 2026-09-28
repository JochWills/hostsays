import type { z } from "zod";

/** What every portal form action returns. `values` refills the form after an error. */
export type FormState = {
  ok?: string;
  error?: string;
  errors?: Record<string, string>;
  values?: Record<string, string>;
};

export type FormAction = (prev: FormState, form: FormData) => Promise<FormState>;

/** Plain string values from a form (files and repeated keys aside), for refilling it after an error. */
export function formValues(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string" && !k.startsWith("$")) out[k] = v;
  return out;
}

/** Zod issues → one message per field. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) errors[String(issue.path[0] ?? "form")] ??= issue.message;
  return errors;
}

export function invalid(error: z.ZodError, form: FormData): FormState {
  return { errors: fieldErrors(error), values: formValues(form) };
}
