"use client";

import { useEffect, useState } from "react";

/**
 * Phones: a bar pinned to the bottom with the price and a jump to the booking panel (#book).
 * It slides away while the panel itself is on screen, so it never covers the panel's button.
 */
export function BookBar({ children }: { children: React.ReactNode }) {
  const [panelVisible, setPanelVisible] = useState(false);
  useEffect(() => {
    const panel = document.getElementById("book");
    if (!panel) return;
    const observer = new IntersectionObserver(([entry]) => setPanelVisible(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      inert={panelVisible}
      className={`fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-line bg-surface px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] transition-transform duration-200 md:hidden ${
        panelVisible ? "translate-y-full" : ""
      }`}
    >
      {children}
    </div>
  );
}
