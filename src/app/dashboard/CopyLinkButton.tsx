"use client";

import { useState } from "react";

// The page address with a copy button. The origin is read in the browser, so
// it shows the domain the dashboard is being used on.
export function CopyLinkButton({ handle, host, variant = "field" }: { handle: string; host?: string; variant?: "field" | "button" }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/${handle}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={copy}
        className="h-[38px] flex-1 rounded-[10px] border border-[#E5E2DA] bg-white text-sm font-semibold text-stone-900 transition-colors hover:border-stone-400"
      >
        {copied ? "Link copiado" : "Copiar link"}
      </button>
    );
  }

  return (
    <span className="flex h-10 items-center overflow-hidden rounded-[10px] border border-[#E5E2DA] bg-white">
      <span className="px-3 text-sm text-stone-700">
        {host ?? "vmbio.pro"}/<strong className="font-semibold text-stone-900">{handle}</strong>
      </span>
      <button
        type="button"
        onClick={copy}
        aria-label="Copiar endereço da página"
        className="flex h-full w-10 items-center justify-center border-l border-[#E5E2DA] text-stone-700 transition-colors hover:bg-[#F3F2EE]"
      >
        {copied ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#2F6B3A]" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m5 12 5 5 9-10" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="9" y="9" width="12" height="12" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </svg>
        )}
      </button>
    </span>
  );
}
