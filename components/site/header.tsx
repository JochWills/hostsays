import Link from "next/link";
import { Search } from "lucide-react";
import { HeaderAccount } from "./account-menu";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { StayingPill } from "./staying-pill";
import { MAIN_NAV } from "./nav-links";

type Props = {
  /** `overlay` sits transparent over the homepage hero; `solid` is used everywhere else. */
  variant?: "overlay" | "solid";
};

export function Header({ variant = "solid" }: Props) {
  const overlay = variant === "overlay";

  const inner = (
    <div className="flex items-center gap-3.5 pt-[22px] sm:gap-7 md:pt-[22px]">
      <Logo />
      <nav
        aria-label="Main"
        className={`ml-11 hidden gap-[26px] text-[14.5px] font-medium lg:flex min-[1360px]:gap-[30px] ${overlay ? "text-ink" : ""}`}
      >
        {MAIN_NAV.map((l) => (
          <Link key={l.href} href={l.href} className="whitespace-nowrap opacity-95 hover:underline hover:underline-offset-[6px] hover:opacity-100">
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex min-w-0 items-center gap-2.5 text-[14.5px] font-medium sm:gap-[26px]">
        <Link href="/explore" aria-label="Search experiences" className="grid place-items-center p-1.5">
          <Search size={20} strokeWidth={1.8} />
        </Link>
        <HeaderAccount overlay={overlay} />
        <MobileMenu />
      </div>
    </div>
  );
  // The top row is full, so the "Staying at" pill sits on its own line below it.
  const pillRow = (
    <div className="flex justify-end">
      <StayingPill variant={variant} className="-mb-2 mt-2.5" />
    </div>
  );

  if (overlay) {
    // The homepage hero wraps this in its own background; keep it transparent.
    return (
      <div className="relative text-white">
        {inner}
        {pillRow}
      </div>
    );
  }

  return (
    <header className="border-b border-line bg-surface pb-[18px] text-ink">
      <div className="wrap">
        {inner}
        {pillRow}
      </div>
    </header>
  );
}
