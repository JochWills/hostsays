"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LayoutDashboard, LogOut, Settings } from "lucide-react";

type Me =
  | { signedIn: false }
  | { signedIn: true; name: string; email: string; role: string; home: string; settings: string };

// Public pages are static, so the header learns who's signed in after loading. One request per page load.
let request: Promise<Me> | null = null;

function loadMe(): Promise<Me> {
  // No Supabase session cookie: signed out, no need to ask the server.
  if (!document.cookie.split("; ").some((c) => c.startsWith("sb-") && c.includes("-auth-token"))) {
    return Promise.resolve({ signedIn: false });
  }
  request ??= fetch("/api/me", { cache: "no-store" })
    .then((r) => (r.ok ? (r.json() as Promise<Me>) : { signedIn: false as const }))
    .catch(() => ({ signedIn: false as const }));
  return request;
}

/** null while unknown (renders the signed-out links, which is what most visitors see). */
export function useMe(): Me | null {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    let alive = true;
    loadMe().then((m) => alive && setMe(m));
    return () => {
      alive = false;
    };
  }, []);
  return me;
}

export function initials(name: string): string {
  const parts = name.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

const ROLE_LABEL: Record<string, string> = { admin: "Admin", host: "Host", operator: "Operator", guest: "Traveller" };

function SignOutButton({ className }: { className: string }) {
  return (
    <form method="post" action="/auth/sign-out">
      <button type="submit" className={className}>
        <LogOut size={17} strokeWidth={1.8} aria-hidden="true" />
        Sign out
      </button>
    </form>
  );
}

/** Header right side: "Sign in" + "List your experience" when signed out, the profile menu when signed in. */
export function HeaderAccount({ overlay }: { overlay: boolean }) {
  const me = useMe();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!me?.signedIn) {
    return (
      <>
        <Link href="/login" className="hidden md:inline">
          Sign in
        </Link>
        <Link
          href="/for-operators"
          className={`hidden items-center gap-2.5 rounded-[14px] px-[26px] py-[13px] font-semibold whitespace-nowrap hover:brightness-110 sm:inline-flex ${
            overlay ? "border border-white/10 bg-[#2D4A3E] text-white" : "border border-transparent bg-green text-green-ink"
          }`}
        >
          List your experience
        </Link>
      </>
    );
  }

  const item = "flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left font-medium hover:bg-bg";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account menu for ${me.name}`}
        onClick={() => setOpen((o) => !o)}
        className={`flex cursor-pointer items-center gap-2 rounded-full py-1 pr-2 pl-1 ${
          overlay ? "hover:bg-white/10" : "hover:bg-bg"
        }`}
      >
        <span
          className={`grid size-9 place-items-center rounded-full text-[13px] font-bold ${
            overlay ? "bg-white text-[#1e2723]" : "bg-green text-green-ink"
          }`}
          aria-hidden="true"
        >
          {initials(me.name)}
        </span>
        <span className="hidden max-w-[140px] truncate lg:inline">{me.name.split(" ")[0]}</span>
        <ChevronDown size={16} strokeWidth={2} aria-hidden="true" className="hidden sm:block" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-[calc(100%+8px)] right-0 z-50 w-[260px] rounded-[14px] bg-surface p-2 text-[14.5px] text-ink shadow-card"
        >
          <div className="px-3 pt-2 pb-3">
            <p className="truncate font-bold">{me.name}</p>
            <p className="truncate text-[13px] text-muted">{me.email}</p>
            <p className="mt-1 text-[12px] font-semibold tracking-wide text-green uppercase">{ROLE_LABEL[me.role]}</p>
          </div>
          <div className="border-t border-line pt-2">
            <Link href={me.home} role="menuitem" className={item} onClick={() => setOpen(false)}>
              <LayoutDashboard size={17} strokeWidth={1.8} aria-hidden="true" />
              {me.role === "guest" ? "Your account" : "Dashboard"}
            </Link>
            <Link href={me.settings} role="menuitem" className={item} onClick={() => setOpen(false)}>
              <Settings size={17} strokeWidth={1.8} aria-hidden="true" />
              Settings
            </Link>
            <SignOutButton className={item} />
          </div>
        </div>
      )}
    </div>
  );
}

/** The mobile menu's bottom links. */
export function MobileAccountLinks({ onNavigate }: { onNavigate: () => void }) {
  const me = useMe();
  const link = "flex items-center gap-2.5 rounded-[10px] px-3 py-3 font-medium hover:bg-bg";

  if (!me?.signedIn) {
    return (
      <>
        <Link href="/login" onClick={onNavigate} className={link}>
          Sign in
        </Link>
        <Link
          href="/for-operators"
          onClick={onNavigate}
          className="mt-2 rounded-[14px] bg-green px-[26px] py-[13px] text-center font-semibold text-green-ink"
        >
          List your experience
        </Link>
      </>
    );
  }
  return (
    <div className="mt-1 border-t border-line pt-2">
      <p className="truncate px-3 pt-1 pb-2 text-[13px] text-muted">Signed in as {me.name}</p>
      <Link href={me.home} onClick={onNavigate} className={link}>
        <LayoutDashboard size={17} strokeWidth={1.8} aria-hidden="true" />
        {me.role === "guest" ? "Your account" : "Dashboard"}
      </Link>
      <Link href={me.settings} onClick={onNavigate} className={link}>
        <Settings size={17} strokeWidth={1.8} aria-hidden="true" />
        Settings
      </Link>
      <SignOutButton className={`${link} w-full cursor-pointer text-left`} />
    </div>
  );
}
