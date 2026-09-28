"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { btnSecondary } from "@/components/ui/styles";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={btnSecondary}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Copy this:", text);
        }
      }}
    >
      {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  );
}
