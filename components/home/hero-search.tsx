"use client";

import { useState } from "react";

/** Hero search bar (Where / What / When). Submits to /explore as a plain GET form. */
export function HeroSearch({ areas, minDate }: { areas: { slug: string; name: string }[]; minDate: string }) {
  const [dateType, setDateType] = useState<"text" | "date">("text");

  const field =
    "flex min-w-0 cursor-text items-center gap-3 border-b border-[#E6E2DA] px-[18px] py-3 md:border-b-0";
  const inputCls =
    "w-full min-w-0 border-0 bg-transparent text-[14.5px] text-[#1E2723] outline-none placeholder:text-[#5f6660]";

  return (
    <form
      action="/explore"
      role="search"
      className="mt-10 grid max-w-[905px] grid-cols-1 items-center rounded-[14px] bg-white p-1.5 text-[#1E2723] shadow-[0_10px_30px_rgba(0,0,0,.18)] sm:grid-cols-2 md:grid-cols-[1.1fr_1.2fr_.8fr_auto]"
    >
      <label className={`${field} md:border-r md:border-[#E6E2DA]`}>
        <PinLine />
        <input name="where" list="hero-areas" placeholder="Where are you going?" aria-label="Area" className={inputCls} />
        <datalist id="hero-areas">
          {areas.map((a) => (
            <option key={a.slug} value={a.name} />
          ))}
        </datalist>
      </label>
      <label className={`${field} md:border-r md:border-[#E6E2DA]`}>
        <Binoculars />
        <input name="q" placeholder="What would you like to do?" aria-label="Activity" className={inputCls} />
      </label>
      <label className={`${field} sm:border-b-0`}>
        <Calendar />
        <input
          name="date"
          type={dateType}
          min={minDate}
          placeholder="Any date"
          aria-label="Date"
          onFocus={() => setDateType("date")}
          onBlur={(e) => !e.currentTarget.value && setDateType("text")}
          className={inputCls}
        />
      </label>
      <button
        type="submit"
        className="inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-[10px] bg-[#2D4A3E] px-11 py-3.5 text-[14.5px] font-semibold text-white hover:brightness-110"
      >
        Search
      </button>
    </form>
  );
}

const iconCls = "flex-none fill-none stroke-[#3c4540] stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]";

function PinLine() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true" className={iconCls}>
      <path d="M12 21s-6.5-5.8-6.5-11a6.5 6.5 0 1 1 13 0c0 5.2-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  );
}

function Binoculars() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true" className={iconCls}>
      <circle cx="6.5" cy="15.5" r="3.5" />
      <circle cx="17.5" cy="15.5" r="3.5" />
      <path d="M10 15.5h4M4 13l2-7h3l1 5M20 13l-2-7h-3l-1 5" />
    </svg>
  );
}

function Calendar() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true" className={iconCls}>
      <rect x="4" y="5.5" width="16" height="14" rx="2" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4M8 13.5h2M12 13.5h2M8 16.5h2" />
    </svg>
  );
}
