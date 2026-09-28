"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

/**
 * Renders a dropdown panel on top of the page (in <body>), anchored under — or above, when there's no room
 * below — its trigger. Being outside the page layout means no parent's `overflow: hidden` can clip it
 * (e.g. the homepage photo banner). Follows the trigger while the page scrolls or resizes.
 */
export function Floating({
  anchorRef,
  panelRef,
  width,
  estimatedHeight,
  cap = Infinity,
  children,
  className = "",
  ...rest
}: {
  anchorRef: RefObject<HTMLElement | null>;
  panelRef?: RefObject<HTMLDivElement | null>;
  /** "anchor" = at least as wide as the trigger; a number = fixed width in px. */
  width: "anchor" | number;
  estimatedHeight: number;
  /** Never taller than this (px); it scrolls inside. */
  cap?: number;
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const [style, setStyle] = useState<React.CSSProperties>({ position: "fixed", top: 0, left: 0, visibility: "hidden" });

  useLayoutEffect(() => {
    const place = () => {
      const r = anchorRef.current?.getBoundingClientRect();
      if (!r) return;
      const gap = 6;
      const room = window.innerHeight - r.bottom;
      const up = room < estimatedHeight + gap && r.top > room;
      const w = width === "anchor" ? undefined : Math.min(width, window.innerWidth - 16);
      const left = Math.max(8, Math.min(r.left, window.innerWidth - (w ?? r.width) - 8));
      setStyle({
        position: "fixed",
        left,
        ...(up ? { bottom: window.innerHeight - r.top + gap } : { top: r.bottom + gap }),
        ...(w ? { width: w } : { minWidth: r.width }),
        maxHeight: Math.min(cap, Math.max(160, (up ? r.top : room) - gap - 8)),
      });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [anchorRef, width, estimatedHeight, cap]);

  return createPortal(
    <div ref={panelRef} style={style} className={`z-[60] overflow-auto ${className}`} {...rest}>
      {children}
    </div>,
    document.body,
  );
}
