import Link from "next/link";

/** "HostSays" wordmark with the small mountain line above "Says". */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="HostSays home"
      className={`flex items-end text-[28px] leading-none font-extrabold tracking-[-0.03em] sm:text-[34px] ${className}`}
    >
      Host
      <span className="relative">
        <svg
          viewBox="0 0 46 16"
          aria-hidden="true"
          className="absolute -top-3 left-1 h-4 w-[46px] fill-none stroke-current stroke-[2.4] [stroke-linecap:round] [stroke-linejoin:round]"
        >
          <path d="M2 14l10-9 6 5 8-8 18 12" />
        </svg>
        Says
      </span>
    </Link>
  );
}
