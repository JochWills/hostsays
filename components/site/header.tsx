import Link from "next/link";
import { Search } from "lucide-react";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { StayingPill } from "./staying-pill";
import { MAIN_NAV } from "./nav-links";

type Props = {
  /** `overlay` sits transparent over the homepage hero; `solid` is used everywhere else. */
  variant?: "overlay" | "solid";
  /** Name of the host remembered this session (Phase 3 fills this from the `hs_host` cookie). */
  stayingAt?: string | null;
};

export function Header({ variant = "solid", stayingAt = null }: Props) {
  const overlay = variant === "overlay";

  const inner = (
    <div className="flex items-center gap-3.5 pt-[22px] sm:gap-7 md:pt-[22px]">
      <Logo onPhoto={overlay} />
      <nav
        aria-label="Main"
        className="ml-6 hidden gap-5 text-[14.5px] font-medium md:flex lg:ml-11 lg:gap-[30px]"
      >
        {MAIN_NAV.map((l) => (
          <Link key={l.href} href={l.href} className="opacity-95 hover:underline hover:underline-offset-[6px] hover:opacity-100">
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-2.5 text-[14.5px] font-medium sm:gap-[26px]">
        {stayingAt && <StayingPill hostName={stayingAt} variant={variant} />}
        <Link href="/explore" aria-label="Search experiences" className="grid place-items-center p-1.5">
          <Search size={20} strokeWidth={1.8} />
        </Link>
        <Link href="/login" className="hidden md:inline">
          Sign in
        </Link>
        <Link
          href="/for-operators"
          className={`hidden items-center gap-2.5 rounded-[14px] px-[26px] py-[13px] font-semibold whitespace-nowrap hover:brightness-110 sm:inline-flex ${
            overlay ? "border border-white/10 bg-[#2D4A3E] text-white" : "bg-green text-green-ink"
          }`}
        >
          List your experience
        </Link>
        <MobileMenu />
      </div>
    </div>
  );

  if (overlay) {
    // The homepage hero wraps this in its own background; keep it transparent.
    return <div className="relative text-white">{inner}</div>;
  }

  return (
    <header className="border-b border-line bg-surface pb-[18px] text-ink">
      <div className="wrap">{inner}</div>
    </header>
  );
}
