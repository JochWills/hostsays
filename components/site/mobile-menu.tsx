"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { MAIN_NAV } from "./nav-links";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    panelRef.current?.querySelector("a")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((o) => !o)}
        className="grid cursor-pointer place-items-center p-1.5"
      >
        {open ? <X size={24} strokeWidth={1.8} /> : <Menu size={24} strokeWidth={1.8} />}
      </button>

      {open && (
        <div
          id="mobile-menu"
          ref={panelRef}
          className="fixed inset-x-3 top-[72px] z-50 rounded-[14px] bg-surface p-3 text-ink shadow-card"
        >
          <nav aria-label="Mobile" className="flex flex-col">
            {MAIN_NAV.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-[10px] px-3 py-3 font-medium hover:bg-bg"
              >
                {l.label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)} className="rounded-[10px] px-3 py-3 font-medium hover:bg-bg">
              Sign in
            </Link>
            <Link
              href="/for-operators"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-[14px] bg-green px-[26px] py-[13px] text-center font-semibold text-green-ink"
            >
              List your experience
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
