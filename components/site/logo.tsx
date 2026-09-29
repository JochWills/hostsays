import Link from "next/link";

// The two halves of public/images/logo.png, used as masks so each can take a theme colour.
// Both are 240px tall and line up exactly side by side.
const HALF = "block h-full [mask-size:100%_100%] [mask-repeat:no-repeat]";

/**
 * HostSays logo: "Host" in ink, "Says" and the mountain in green. The same colours on every page; on a photo
 * (`onPhoto`) it's a little bigger with a soft light glow so it stands out against a dark sky.
 */
export function Logo({ className = "", onPhoto = false }: { className?: string; onPhoto?: boolean }) {
  const photo = onPhoto
    ? "sm:h-[58px] [filter:drop-shadow(0_0_1px_rgba(255,255,255,.9))_drop-shadow(0_0_14px_rgba(255,255,255,.55))]"
    : "";
  return (
    <Link href="/" aria-label="HostSays home" className={`flex h-[42px] shrink-0 sm:h-[50px] ${photo} ${className}`}>
      <span aria-hidden="true" className={`${HALF} aspect-[374/240] bg-ink [mask-image:url(/images/logo-host.png)]`} />
      <span aria-hidden="true" className={`${HALF} aspect-[375/240] bg-green [mask-image:url(/images/logo-says.png)]`} />
    </Link>
  );
}
