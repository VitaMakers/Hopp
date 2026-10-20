"use client";

import { useActionState, useState } from "react";
import { handleError, normalizeHandle } from "@/lib/handles";
import { TEMPLATES, TEMPLATE_TABS } from "@/lib/page/templates";
import { createProfile, type OnboardingState } from "./actions";

export function OnboardingForm({ host }: { host: string }) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(createProfile, {});
  const [handle, setHandle] = useState("");
  const [template, setTemplate] = useState(""); // "" = página em branco
  const [tab, setTab] = useState("premium");
  const normalized = normalizeHandle(handle);
  const localError = handle ? handleError(normalized) : null;
  const current = TEMPLATE_TABS.find((item) => item.id === tab) ?? TEMPLATE_TABS[0];
  const models = TEMPLATES.filter((t) => t.tab === tab);

  function selectTab(id: string) {
    setTab(id);
    // The "Criar meu modelo" tab always means a blank page.
    if (TEMPLATE_TABS.find((t) => t.id === id)?.kind === "scratch") setTemplate("");
  }

  return (
    <form action={action} className="mt-6 flex flex-col gap-5">
      <div>
        <div className="flex gap-1 rounded-lg bg-stone-100 p-1">
          {TEMPLATE_TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectTab(item.id)}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition sm:text-sm ${tab === item.id ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="mb-3 mt-1.5 text-xs text-stone-500">{current.note}</p>

        {current.kind === "scratch" ? (
          <label
            className={`block cursor-pointer rounded-xl border border-dashed p-6 text-center transition ${template === "" ? "border-stone-900 ring-2 ring-stone-900" : "border-stone-300 hover:border-stone-500"}`}
          >
            <input type="radio" name="templateId" value="" checked={template === ""} onChange={() => setTemplate("")} className="sr-only" />
            <span className="block font-medium">Começar uma página em branco</span>
            <span className="mt-1 block text-xs text-stone-500">Você monta no editor e vê o resultado na prévia ao lado.</span>
          </label>
        ) : models.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">Novos modelos em breve.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {models.map((t) => (
              <label
                key={t.id}
                className={`cursor-pointer overflow-hidden rounded-xl text-left ring-1 transition ${template === t.id ? "ring-2 ring-stone-900" : "ring-stone-200 hover:ring-stone-400"}`}
              >
                <input type="radio" name="templateId" value={t.id} checked={template === t.id} onChange={() => setTemplate(t.id)} className="sr-only" />
                <div className="flex h-16 flex-col items-center justify-center gap-1.5 p-3" style={{ background: t.swatch.background }}>
                  <span className="text-xs font-bold" style={{ color: t.swatch.text }}>
                    {t.name}
                  </span>
                  <span className="h-1.5 w-2/3 rounded-full" style={{ background: t.swatch.accent }} />
                </div>
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="text-sm font-medium">{t.name}</span>
                  {current.plan ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">{current.plan}</span>
                  ) : null}
                </div>
                <p className="px-3 pb-3 text-xs text-stone-500">{t.description}</p>
              </label>
            ))}
          </div>
        )}
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
