"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { signUp, type SignupState } from "./actions";
import { HOST_TYPES, type AccountType } from "@/lib/validation/auth";
import { btnPrimary, input, label, panel } from "@/components/ui/styles";

type Props = { type: AccountType; areas: { id: string; name: string; province: string }[] };

const TERMS: Record<AccountType, React.ReactNode> = {
  guest: (
    <>
      the <TermsLink href="/terms">terms</TermsLink> and <TermsLink href="/privacy">privacy policy</TermsLink>
    </>
  ),
  host: (
    <>
      the <TermsLink href="/terms">terms</TermsLink> and <TermsLink href="/privacy">privacy policy</TermsLink>,
      including the host commission terms
    </>
  ),
  operator: (
    <>
      the <TermsLink href="/operator-terms">operator terms</TermsLink> (10% deposit collected by HostSays on each
      booking) and the <TermsLink href="/privacy">privacy policy</TermsLink>
    </>
  ),
};

function TermsLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} target="_blank" className="font-semibold text-green hover:underline">
      {children}
    </Link>
  );
}

export function SignupForm({ type, areas }: Props) {
  const [state, action, pending] = useActionState<SignupState, FormData>(signUp, {});
  const errors = state.errors ?? {};
  const values = state.values ?? {};
  const formRef = useRef<HTMLFormElement>(null);

  // After a failed submit, bring the first problem into view (on a phone it can be far above the button).
  useEffect(() => {
    if (!state.errors) return;
    const first = formRef.current?.querySelector<HTMLElement>("[aria-invalid=true], [role=alert]");
    first?.scrollIntoView({ block: "center", behavior: "smooth" });
    if (first?.matches("input, select")) first.focus({ preventScroll: true });
  }, [state]);

  const field = (name: string, text: string, el: React.ReactNode, hint?: string) => (
    <div>
      <label htmlFor={name} className={label}>
        {text}
      </label>
      {el}
      {errors[name] ? (
        <p id={`${name}-error`} className="mt-1.5 text-[13px] font-medium text-danger">
          {errors[name]}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-[13px] text-muted">{hint}</p>
      )}
    </div>
  );
  const a11y = (name: string) =>
    errors[name] ? { "aria-invalid": true, "aria-describedby": `${name}-error` } : {};

  const areaSelect = field(
    "areaId",
    "Area",
    <select id="areaId" name="areaId" required defaultValue={values.areaId ?? ""} className={input} {...a11y("areaId")}>
      <option value="" disabled>
        Choose your area
      </option>
      {[...new Set(areas.map((a) => a.province))].map((province) => (
        <optgroup key={province} label={province}>
          {areas
            .filter((a) => a.province === province)
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
        </optgroup>
      ))}
    </select>,
  );
  const phoneField = field(
    "phone",
    "Phone (WhatsApp)",
    <input
      id="phone"
      name="phone"
      type="tel"
      required
      autoComplete="tel"
      defaultValue={values.phone}
      className={input}
      {...a11y("phone")}
    />,
    "Only for us to reach you. It's never shown on the site.",
  );

  return (
    <form ref={formRef} action={action} className={`${panel} mt-6 space-y-4`} noValidate>
      <input type="hidden" name="type" value={type} />

      {field(
        "fullName",
        "Your name",
        <input
          id="fullName"
          name="fullName"
          required
          autoComplete="name"
          defaultValue={values.fullName}
          className={input}
          {...a11y("fullName")}
        />,
      )}

      {type === "host" && (
        <>
          {field(
            "name",
            "Property name",
            <input
              id="name"
              name="name"
              required
              autoComplete="organization"
              defaultValue={values.name}
              className={input}
              {...a11y("name")}
            />,
            "As guests know it, e.g. On The Bay B&B",
          )}
          {field(
            "hostType",
            "Type of place",
            <select
              id="hostType"
              name="hostType"
              required
              defaultValue={values.hostType ?? ""}
              className={input}
              {...a11y("hostType")}
            >
              <option value="" disabled>
                Choose one
              </option>
              {HOST_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>,
          )}
          {areaSelect}
          {field(
            "listingUrl",
            "Link to your listing",
            <input
              id="listingUrl"
              name="listingUrl"
              inputMode="url"
              required
              placeholder="airbnb.com/rooms/…"
              defaultValue={values.listingUrl}
              className={input}
              {...a11y("listingUrl")}
            />,
            "Your Booking.com, Airbnb or own website page. We use it to check your place is real.",
          )}
          {phoneField}
        </>
      )}

      {type === "operator" && (
        <>
          {field(
            "name",
            "Business name",
            <input
              id="name"
              name="name"
              required
              autoComplete="organization"
              defaultValue={values.name}
              className={input}
              {...a11y("name")}
            />,
          )}
          {areaSelect}
          {field(
            "website",
            "Website or social page (optional)",
            <input
              id="website"
              name="website"
              inputMode="url"
              placeholder="yourbusiness.co.za"
              defaultValue={values.website}
              className={input}
              {...a11y("website")}
            />,
            "Helps us verify your business faster.",
          )}
          {phoneField}
        </>
      )}

      {field(
        "email",
        "Email",
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={values.email}
          className={input}
          {...a11y("email")}
        />,
        type === "operator" ? "Booking requests are sent here." : undefined,
      )}
      {field(
        "password",
        "Password",
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={input}
          {...a11y("password")}
        />,
        "At least 8 characters.",
      )}

      <div>
        <label className="flex items-start gap-2.5 text-[14px]">
          <input type="checkbox" name="agree" required className="mt-1 size-4 accent-green" {...a11y("agree")} />
          <span>I agree to {TERMS[type]}.</span>
        </label>
        {errors.agree && (
          <p id="agree-error" className="mt-1.5 text-[13px] font-medium text-danger">
            {errors.agree}
          </p>
        )}
      </div>

      {errors.form && (
        <p role="alert" className="rounded-[10px] border border-gold/50 bg-gold/10 px-4 py-3 text-[14px]">
          {errors.form}
        </p>
      )}

      <button type="submit" disabled={pending} className={`${btnPrimary} w-full`}>
        {pending ? "Creating your account…" : "Create account"}
      </button>
    </form>
  );
}
