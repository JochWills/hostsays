/**
 * "Staying at [Host]" pill shown in the header when a host is remembered this session.
 * Phase 3 wires this to the `hs_host` cookie and makes × clear it.
 */
export function StayingPill({
  hostName,
  variant,
}: {
  hostName: string;
  variant: "overlay" | "solid";
}) {
  const styles =
    variant === "overlay"
      ? "border-white/30 bg-white/15 backdrop-blur-md"
      : "border-line bg-bg";

  return (
    <span
      aria-live="polite"
      className={`inline-flex max-w-[46vw] items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] ${styles}`}
    >
      <span className="truncate">
        Staying at <b className="font-bold">{hostName}</b>
      </span>
      <button
        type="button"
        aria-label="Clear accommodation"
        className="cursor-pointer pl-1 text-[15px] leading-none opacity-80 hover:opacity-100"
      >
        ×
      </button>
    </span>
  );
}
