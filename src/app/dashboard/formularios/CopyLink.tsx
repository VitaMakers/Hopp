"use client";

import { useEffect, useState } from "react";

// Shows and copies a form's public link, built from the current domain.
export function CopyLink({ code, compact = false }: { code: string; compact?: boolean }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);

  const url = `${origin}/f/${code}`;
  const display = origin ? `${origin.replace(/^https?:\/\//, "")}/f/${code}` : `/f/${code}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (compact) {
    return (
      <button type="button" onClick={copy} className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 hover:underline">
        {copied ? "Copiado!" : "Compartilhar"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input readOnly value={display} onFocus={(e) => e.target.select()} className="field flex-1 text-xs" />
      <button type="button" onClick={copy} className="btn-primary whitespace-nowrap text-sm">
        {copied ? "Copiado!" : "Copiar link"}
      </button>
    </div>
  );
}
