"use client";

import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { computeBookingAmounts } from "@/lib/bookings/pricing";
import { DEPOSIT_RATE } from "@/lib/config";
import { formatDate, formatPercent, formatRand, formatTime } from "@/lib/format";
import { requestNote } from "@/lib/policy";
import { btnPrimary, input, label } from "@/components/ui/styles";
import { useStayingHost } from "@/components/site/staying-pill";
import { AvailabilityCalendar } from "./availability-calendar";

type Slot = { weekday: number; start_time: string };

type HostOption = { slug: string; name: string; area: string };

/** "Somewhere else / not listed": no host is credited. */
export const NO_HOST = "none";

/**
 * Booking panel: pick a date, time and group size, see the price, and say where you're staying (pre-filled
 * with the host remembered this session, changeable). Phase 4 adds guest details and sends the request
 * (the server recomputes every amount and re-checks the host; these are a preview).
 */
export function BookingPanel({
  operatorName,
  priceCents,
  isGroupPrice,
  minPeople,
  maxPeople,
  slots,
  blackoutDates,
  minDate,
  maxDate,
  hosts,
}: {
  operatorName: string;
  priceCents: number;
  isGroupPrice: boolean;
  minPeople: number;
  maxPeople: number;
  slots: Slot[];
  blackoutDates: string[];
  minDate: string;
  maxDate: string;
  hosts: HostOption[];
}) {
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [people, setPeople] = useState(Math.max(minPeople, Math.min(2, maxPeople)));
  // "" = not answered yet. Until the guest picks something, follow the remembered host (and its clearing).
  const [hostChoice, setHostChoice] = useState("");
  const staying = useStayingHost();
  const rememberedSlug = staying && hosts.some((h) => h.slug === staying.slug) ? staying.slug : "";
  const hostValue = hostChoice || rememberedSlug;
  const areas = useMemo(() => [...new Set(hosts.map((h) => h.area))], [hosts]);

  const openWeekdays = useMemo(() => [...new Set(slots.map((s) => s.weekday))], [slots]);
  const times = date
    ? slots.filter((s) => s.weekday === new Date(`${date}T00:00:00Z`).getUTCDay()).map((s) => formatTime(s.start_time))
    : [];
  const amounts = computeBookingAmounts({ unitPriceCents: priceCents, isGroupPrice, people, hostCommissionRate: null });

  return (
    <div className="rounded-[14px] bg-surface p-5 shadow-card">
      <p className="text-[22px] font-extrabold tracking-[-0.02em]">
        {formatRand(priceCents)}{" "}
        <span className="text-[14px] font-medium text-muted">{isGroupPrice ? "per group" : "per person"}</span>
      </p>

      <div className="mt-4">
        <span className={label} id="date-label">
          Date
        </span>
        <AvailabilityCalendar
          minDate={minDate}
          maxDate={maxDate}
          openWeekdays={openWeekdays}
          blackoutDates={blackoutDates}
          value={date}
          onChange={(d) => {
            setDate(d);
            const dayTimes = slots.filter((s) => s.weekday === new Date(`${d}T00:00:00Z`).getUTCDay());
            setTime(dayTimes.length === 1 ? formatTime(dayTimes[0].start_time) : null);
          }}
        />
      </div>

      {date && (
        <fieldset className="mt-4">
          <legend className={label}>Time on {formatDate(date, { year: false })}</legend>
          <div className="flex flex-wrap gap-2">
            {times.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={time === t}
                onClick={() => setTime(t)}
                className={`cursor-pointer rounded-[10px] border px-4 py-2 text-[14px] font-semibold ${
                  time === t ? "border-green bg-green text-green-ink" : "border-line hover:border-green"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="block text-[13px] font-semibold" id="people-label">
          People
          <span className="block text-[12px] font-normal text-muted">
            {minPeople === maxPeople ? `${minPeople}` : `${minPeople} to ${maxPeople}`}
          </span>
        </span>
        <div className="flex items-center gap-3" role="group" aria-labelledby="people-label">
          <button
            type="button"
            aria-label="Fewer people"
            disabled={people <= minPeople}
            onClick={() => setPeople((p) => Math.max(minPeople, p - 1))}
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-line hover:border-green disabled:cursor-default disabled:opacity-40"
          >
            <Minus size={16} strokeWidth={1.8} />
          </button>
          <span className="w-6 text-center text-[16px] font-semibold" aria-live="polite">
            {people}
          </span>
          <button
            type="button"
            aria-label="More people"
            disabled={people >= maxPeople}
            onClick={() => setPeople((p) => Math.min(maxPeople, p + 1))}
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-line hover:border-green disabled:cursor-default disabled:opacity-40"
          >
            <Plus size={16} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="staying" className={label}>
          Where are you staying?
        </label>
        <select id="staying" name="host" value={hostValue} onChange={(e) => setHostChoice(e.target.value)} className={input}>
          <option value="" disabled>
            Choose your accommodation
          </option>
          {areas.map((area) => (
            <optgroup key={area} label={area}>
              {hosts
                .filter((h) => h.area === area)
                .map((h) => (
                  <option key={h.slug} value={h.slug}>
                    {h.name}
                  </option>
                ))}
            </optgroup>
          ))}
          <option value={NO_HOST}>Somewhere else / not listed</option>
        </select>
        <p className="mt-1.5 text-[12.5px] text-muted">
          {hostValue && hostValue !== NO_HOST
            ? "Your host earns a small commission when you book. It doesn't change your price."
            : "If your host is on HostSays, pick them: they earn a small commission at no cost to you."}
        </p>
      </div>

      <dl className="mt-5 space-y-1.5 border-t border-line pt-4 text-[14px]">
        <div className="flex justify-between">
          <dt className="text-muted">
            {isGroupPrice ? "Group price" : `${formatRand(priceCents)} × ${people}`}
          </dt>
          <dd className="font-semibold">{formatRand(amounts.totalCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">{formatPercent(DEPOSIT_RATE)} deposit after confirmation</dt>
          <dd>{formatRand(amounts.depositCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Balance paid to operator on the day</dt>
          <dd>{formatRand(amounts.balanceCents)}</dd>
        </div>
      </dl>

      <button type="button" disabled className={`${btnPrimary} mt-5 w-full`}>
        Send request
      </button>
      <p className="mt-2 text-center text-[12.5px] text-muted">
        Booking requests open soon. {requestNote(operatorName)}
      </p>
    </div>
  );
}
