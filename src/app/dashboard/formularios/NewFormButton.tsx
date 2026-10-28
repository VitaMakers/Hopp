"use client";

import { useState } from "react";
import { FORM_PRESETS } from "@/lib/page/catalog";
import { createForm } from "./actions";

export function NewFormButton() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-primary whitespace-nowrap">
        + Novo formulário
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
