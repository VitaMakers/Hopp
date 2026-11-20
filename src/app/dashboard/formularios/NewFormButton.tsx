"use client";

import { useState } from "react";
import { FORM_PRESETS } from "@/lib/page/catalog";
import { createForm } from "./actions";

export function NewFormButton() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-[10px] bg-stone-900 px-[18px] text-sm font-semibold text-white transition-colors hover:bg-stone-800"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
        Criar formulário
      </button>
    );
  }

  return (
    <div className="absolute right-0 top-12 z-10 w-72 rounded-xl bg-white p-3 shadow-lg ring-1 ring-stone-200">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold">Escolha um modelo</p>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-stone-500 hover:underline">
          Fechar
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {FORM_PRESETS.map((preset) => (
          <form key={preset.id} action={createForm.bind(null, preset.id)}>
            <button type="submit" className="w-full rounded-lg border border-stone-200 p-2.5 text-left transition hover:border-stone-900">
              <span className="block text-sm font-semibold">{preset.name}</span>
              <span className="block text-xs text-stone-500">{preset.description}</span>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
