import type { Category } from "@/lib/categories";

/** Category line icons from the approved homepage (1.8 stroke, currentColor). */
const PATHS: Record<Category, React.ReactNode> = {
  safari: (
    <>
      <path d="M3.5 15.5V11l2-3.5h10L18 11h2.5v4.5M3.5 15.5h17M7 7.5V5M13 7.5V5" />
      <circle cx="7.5" cy="16.5" r="2" />
      <circle cx="16.5" cy="16.5" r="2" />
      <path d="M9 11h5" />
    </>
  ),
  ocean: (
    <>
      <path d="M3 17c1.8 0 1.8-1.4 3.6-1.4S8.4 17 10.2 17s1.8-1.4 3.6-1.4 1.8 1.4 3.6 1.4 1.8-1.4 3.6-1.4" />
      <path d="M5 13.5c0-4 3-7 7-7 2.4 0 4 1.3 4.5 3-1.8-.6-3.8.2-4.4 2.1-.4 1.3-.1 2.4.6 3.1" />
    </>
  ),
  adventure: (
    <>
      <path d="M3 19l6.5-11 4 6.5 2.5-4 5 8.5z" />
      <path d="M8 10.5l1.5 1.5 1.5-1.5" />
    </>
  ),
  food: <path d="M8 3.5h8l-.6 5.2a3.4 3.4 0 0 1-6.8 0zM12 12v8M8.5 20.5h7" />,
  culture: (
    <>
      <circle cx="8" cy="8" r="2.5" />
      <circle cx="16" cy="8" r="2.5" />
      <circle cx="12" cy="10.5" r="2.2" />
      <path d="M3.5 17c0-2.6 2-4.3 4.5-4.3M20.5 17c0-2.6-2-4.3-4.5-4.3M7.5 19c0-2.6 2-4.4 4.5-4.4s4.5 1.8 4.5 4.4" />
    </>
  ),
  wellness: (
    <path d="M12 19c-4 0-7.5-2.5-8.5-6.5 3 .1 5.6 1.3 7 3.3M12 19c4 0 7.5-2.5 8.5-6.5-3 .1-5.6 1.3-7 3.3M12 19c-2-1.8-3-4-3-6.5S10 7.8 12 5c2 2.8 3 5 3 7.5S14 17.2 12 19z" />
  ),
};

export function CategoryIcon({ category, size = 18 }: { category: Category; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      className="flex-none fill-none stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]"
    >
      {PATHS[category]}
    </svg>
  );
}

/** Filled map pin used in location pills over photos. */
export function PinIcon({ size = 12 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className="flex-none">
      <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" fill="#fff" />
      <circle cx="12" cy="10" r="2.6" fill="#555" />
    </svg>
  );
}
