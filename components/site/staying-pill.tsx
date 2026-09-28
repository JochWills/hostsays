"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { HOST_CHANGE_EVENT, clearStayingHost, readStayingHost, type StayingHost } from "@/lib/attribution";

/** The host remembered this session (from the hs_host cookie), kept in step as the guest moves around. */
export function useStayingHost(): StayingHost | null {
  const pathname = usePathname();
  const [host, setHost] = useState<StayingHost | null>(null);
  useEffect(() => {
    const read = () => setHost(readStayingHost());
    read(); // also re-read after client-side navigation, which may have just set the cookie
    window.addEventListener(HOST_CHANGE_EVENT, read);
    return () => window.removeEventListener(HOST_CHANGE_EVENT, read);
  }, [pathname]);
  return host;
}

/** "Staying at [Host]" pill in the header, with × to forget the host. */
export function StayingPill({ variant }: { variant: "overlay" | "solid" }) {
  const host = useStayingHost();
  if (!host) return null;

  const styles = variant === "overlay" ? "border-white/30 bg-white/15 backdrop-blur-md" : "border-line bg-bg";
  return (
    <span
      aria-live="polite"
      className={`inline-flex max-w-[34vw] items-center gap-1.5 rounded-full border py-1.5 pr-1.5 pl-3 text-[13px] sm:max-w-[260px] ${styles}`}
    >
      <span className="truncate">
        <span className="hidden sm:inline">Staying at </span>
        <b className="font-bold">{host.name}</b>
      </span>
      <button
        type="button"
        aria-label={`Forget ${host.name} as where you're staying`}
        onClick={clearStayingHost}
        className="grid size-5 shrink-0 cursor-pointer place-items-center rounded-full text-[15px] leading-none opacity-80 hover:opacity-100"
      >
        ×
      </button>
    </span>
  );
}
