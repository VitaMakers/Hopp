"use client";

import { useState } from "react";
import { defaultPageDoc } from "@/lib/page/catalog";
import type { PageDoc } from "@/lib/page/schema";
import { TEMPLATES, TEMPLATE_TABS } from "@/lib/page/templates";
import { Card } from "./fields";

type PanelProps = { doc: PageDoc; onChange: (doc: PageDoc) => void; onGoToBlocks?: () => void };

export function TemplatesPanel({ doc, onChange, onGoToBlocks }: PanelProps) {
  const [tab, setTab] = useState("premium");
  const current = TEMPLATE_TABS.find((item) => item.id === tab) ?? TEMPLATE_TABS[0];
  const models = TEMPLATES.filter((template) => template.tab === tab);

  function apply(id: string) {
    const template = TEMPLATES.find((item) => item.id === id);
    if (!template) return;
    const ok = window.confirm(
      `Usar o modelo "${template.name}"? Os blocos e o visual da sua página serão trocados pelos do modelo (o rascunho só vai ao ar quando você publicar).`,
    );
    if (!ok) return;
    onChange({ ...template.build(doc.profile.name || "Sua Marca"), seo: doc.seo });
  }

  function startBlank() {
    const ok = window.confirm("Começar uma página em branco? Os blocos e o visual atuais serão substituídos por uma página em branco.");
    if (!ok) return;
    onChange({ ...defaultPageDoc(doc.profile.name || "Sua Marca"), seo: doc.seo });
    onGoToBlocks?.();
  }

  return (
    <Card title="Modelos prontos">
      <div className="flex gap-1 rounded-lg bg-stone-100 p-1">
        {TEMPLATE_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition sm:text-sm ${tab === item.id ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="-mt-1 text-xs text-stone-500">{current.note}</p>

      {current.kind === "scratch" ? (
        <button
          type="button"
          onClick={startBlank}
          className="rounded-xl border border-dashed border-stone-300 p-6 text-center transition hover:border-stone-500"
        >
          <span className="block font-medium">Começar uma página em branco</span>
          <span className="mt-1 block text-xs text-stone-500">Você monta na aba Blocos e vê o resultado na prévia ao lado.</span>
        </button>
      ) : models.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">Novos modelos em breve.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {models.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => apply(template.id)}
              aria-label={`Usar o modelo ${template.name}`}
              className="overflow-hidden rounded-xl text-left ring-1 ring-stone-200 transition hover:ring-stone-400"
            >
              <div className="flex h-24 flex-col items-center justify-center gap-2 p-3" style={{ background: template.swatch.background }}>
                <span className="text-sm font-bold tracking-wide" style={{ color: template.swatch.text }}>
                  {template.name}
                </span>
                <span className="h-2 w-2/3 rounded-full" style={{ background: template.swatch.accent }} />
                <span className="h-2 w-1/2 rounded-full opacity-60" style={{ background: template.swatch.accent }} />
              </div>
              <div className="flex flex-col gap-1 px-3 py-2.5">
                <span className="flex items-center gap-2">
                  <span className="font-medium">{template.name}</span>
                  {current.plan ? (
                    <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                      {current.plan}
                    </span>
                  ) : null}
                </span>
                <span className="text-xs text-stone-500">{template.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
