import type { Metadata } from "next";
import { Logo } from "@/components/site/logo";
import { CategoryIcon } from "@/components/icons/category-icon";
import { CATEGORIES } from "@/lib/categories";

export const metadata: Metadata = {
  title: { absolute: "HostSays | Coming soon" },
  description: "Things to do, recommended by local hosts. Launching in South Africa first. Coming soon.",
  robots: { index: false, follow: false },
};

/** Shown to everyone while COMING_SOON=true (see proxy.ts). A cut-down homepage hero. */
export default function ComingSoon() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-hero bg-[url(/images/hero.jpg)] bg-cover bg-position-[78%_center] bg-no-repeat text-white md:bg-position-[right_center]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.35)_0%,rgba(0,0,0,.15)_40%,rgba(0,0,0,0)_60%),linear-gradient(180deg,rgba(0,0,0,.28)_0%,rgba(0,0,0,0)_22%,rgba(0,0,0,0)_70%,rgba(0,0,0,.28)_100%)]"
      />
      <div className="wrap relative flex flex-1 flex-col">
        <header className="pt-[26px] sm:pt-8">
          <Logo />
        </header>

        <main className="max-w-[720px] flex-1 pt-14 sm:pt-[90px]">
          <p className="inline-flex rounded-full bg-pill px-3.5 py-1.5 text-[12.5px] font-semibold tracking-[0.04em] uppercase backdrop-blur-sm">
            Coming soon
          </p>
          <h1 className="mt-5 text-[clamp(34px,4.6vw,56px)] leading-[1.05] font-extrabold tracking-[-0.025em] [text-shadow:0_2px_20px_rgba(0,0,0,.25)]">
            Things to do,
            <br />
            <em className="font-serif font-semibold tracking-[-0.01em]">recommended by local hosts.</em>
          </h1>
          <p className="mt-[18px] max-w-[560px] text-[clamp(15px,1.35vw,18.5px)] leading-[1.45] opacity-95 [text-shadow:0_1px_12px_rgba(0,0,0,.3)]">
            Safaris, ocean trips and local adventures, picked by the guesthouses and hosts you stay with. We&rsquo;re
            launching in South Africa first, with more of the world to follow.
          </p>

          <ul aria-label="What you'll find" className="mt-9 flex flex-wrap gap-x-[18px] gap-y-3">
            {CATEGORIES.map((c) => (
              <li key={c.value} className="flex items-center gap-2.5 text-[12.5px] font-medium">
                <span className="grid h-[38px] w-[38px] place-items-center rounded-full border-[1.4px] border-white/75 bg-white/[.06]">
                  <CategoryIcon category={c.value} />
                </span>
                {c.label}
              </li>
            ))}
          </ul>
        </main>

        <footer className="py-6 text-[12.5px] opacity-85">&copy; {new Date().getFullYear()} HostSays</footer>
      </div>
    </div>
  );
}
