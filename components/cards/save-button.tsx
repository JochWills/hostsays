"use client";

import { useSyncExternalStore } from "react";

// Saved items live in this browser only (no guest accounts). See docs/10-open-questions.md.
const KEY = "hs-saved";
const listeners = new Set<() => void>();

function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // Storage blocked (private mode): the toggle still works for this page view.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function SaveButton({ id, name }: { id: string; name: string }) {
  const saved = useSyncExternalStore(
    subscribe,
    () => read().includes(id),
    () => false,
  );

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={`${saved ? "Remove" : "Save"} ${name}`}
      onClick={() => write(saved ? read().filter((x) => x !== id) : [...read(), id])}
      className="absolute top-2.5 right-2.5 z-10 cursor-pointer p-0.5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,.4)]"
    >
      <svg
        viewBox="0 0 24 24"
        width={24}
        height={24}
        aria-hidden="true"
        className={`stroke-current stroke-[1.7] [stroke-linecap:round] [stroke-linejoin:round] ${saved ? "fill-white" : "fill-none"}`}
      >
        <path d="M12 20.5S3.5 15.3 3.5 9.2A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.5 2.6c0 6.1-8.5 11.3-8.5 11.3z" />
      </svg>
    </button>
  );
}
