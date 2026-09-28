import Link from "next/link";
import { FOOTER_NAV } from "./nav-links";

export function Footer() {
  return (
    <footer className="mt-14 border-t border-line pt-[30px] pb-10 text-[13px] text-muted">
      <div className="wrap flex flex-wrap justify-between gap-x-10 gap-y-[18px]">
        <div>
          <div className="text-xl font-extrabold tracking-[-0.02em] text-ink">HostSays</div>
          <div className="mt-1.5">Things to do, recommended by local hosts.</div>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-[22px] gap-y-2">
          {FOOTER_NAV.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="max-w-sm">Hosts earn a commission when you book through them.</div>
      </div>
    </footer>
  );
}
