import Link from "next/link";

// The two halves of public/images/logo.png, used as masks so each can take a theme colour.
// Both are 240px tall and line up exactly side by side.
const HALF = "block h-full [mask-size:100%_100%] [mask-repeat:no-repeat]";

/** HostSays logo: "Host" in ink, "Says" and the mountain in green. The same on every page, photo or not. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label="HostSays home" className={`flex h-[42px] shrink-0 sm:h-[50px] ${className}`}>
      <span aria-hidden="true" className={`${HALF} aspect-[374/240] bg-ink [mask-image:url(/images/logo-host.png)]`} />
      <span aria-hidden="true" className={`${HALF} aspect-[375/240] bg-green [mask-image:url(/images/logo-says.png)]`} />
    </Link>
  );
}
