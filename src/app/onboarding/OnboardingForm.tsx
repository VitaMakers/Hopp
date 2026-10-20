"use client";

import { useActionState, useState } from "react";
import { handleError, normalizeHandle } from "@/lib/handles";
import { TEMPLATES } from "@/lib/page/templates";
import { createProfile, type OnboardingState } from "./actions";

export function OnboardingForm({ host }: { host: string }) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(createProfile, {});
  const [handle, setHandle] = useState("");
  const [template, setTemplate] = useState(""); // "" = começar do zero
  const normalized = normalizeHandle(handle);
  const localError = handle ? handleError(normalized) : null;

  const options = [
    { id: "", name: "Começar do zero", description: "Uma página em branco para montar do seu jeito.", swatch: { background: "#f5f5f4", accent: "#1c1c1c", text: "#1c1c1c" }, plan: "basic" as const },
    ...TEMPLATES.map((t) => ({ id: t.id, name: t.name, description: t.description, swatch: t.swatch, plan: t.plan })),
  ];

  return (
    <form action={action} className="mt-6 flex flex-col gap-5">
      <div>
        <p className="mb-2 text-sm font-medium text-stone-700">Escolha um modelo</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((option) => (
            <label
              key={option.id}
              className={`cursor-pointer overflow-hidden rounded-xl text-left ring-1 transition ${template === option.id ? "ring-2 ring-stone-900" : "ring-stone-200 hover:ring-stone-400"}`}
            >
              <input type="radio" name="templateId" value={option.id} checked={template === option.id} onChange={() => setTemplate(option.id)} className="sr-only" />
              <div className="flex h-16 flex-col items-center justify-center gap-1.5 p-3" style={{ background: option.swatch.background }}>
                <span className="text-xs font-bold" style={{ color: option.swatch.text }}>
                  {option.name}
                </span>
                <span className="h-1.5 w-2/3 rounded-full" style={{ background: option.swatch.accent }} />
              </div>
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="text-sm font-medium">{option.name}</span>
                {option.plan === "premium" ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                    Premium
                  </span>
                ) : null}
              </div>
              <p className="px-3 pb-3 text-xs text-stone-500">{option.description}</p>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-stone-500">Depois você troca de modelo, textos e imagens quando quiser.</p>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
        Seu nome ou da marca
        <input name="name" required maxLength={80} className="field" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
        Endereço
        <div className="flex items-center rounded-lg ring-1 ring-stone-300 focus-within:ring-2 focus-within:ring-stone-900">
          <span className="pl-3 text-stone-500">{host}/</span>
          <input
            name="handle"
            required
            value={handle}
            onChange={(event) => setHandle(event.target.value)}
            className="w-full rounded-lg bg-transparent px-1 py-2.5 outline-none"
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>
      </label>
      {localError || state.error ? <p className="text-sm text-red-600">{localError ?? state.error}</p> : null}
      <button type="submit" disabled={pending || !!localError} className="btn-primary">
        {pending ? "Criando..." : "Criar minha página"}
      </button>
    </form>
  );
}
