"use client";

import { useState } from "react";
import type { PageDoc } from "@/lib/page/schema";
import { TEMPLATES, TEMPLATE_TABS } from "@/lib/page/templates";
import { Card } from "./fields";

type PanelProps = { doc: PageDoc; onChange: (doc: PageDoc) => void };

export function TemplatesPanel({ doc, onChange }: PanelProps) {
  const [tab, setTab] = useState(TEMPLATE_TABS[0].id);
  const current = TEMPLATE_TABS.find((item) => item.id === tab) ?? TEMPLATE_TABS[0];
  const models = TEMPLATES.filter((template) => template.tab === tab);

  function apply(id: string) {
    const template = TEMPLATES.find((item) => item.id === id);
    if (!template) return;
    const ok = window.confirm(
      `Usar o modelo "${template.name}"? Os blocos e o visual da sua página serão trocados pelos do modelo (o rascunho só vai ao ar quando você publicar).`,
    );
    if (!ok) return;
    const next = template.build(doc.profile.name || "Sua Marca");
    onChange({ ...next, seo: doc.seo });
  }

  return (
    <Card title="Modelos prontos">
      <p className="-mt-2 text-sm text-stone-500">Escolha um modelo e depois troque os textos, links e imagens pelos seus.</p>

      <div className="flex gap-1 rounded-lg bg-stone-100 p-1">
        {TEMPLATE_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${tab === item.id ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="-mt-1 text-xs text-stone-500">{current.note}</p>

      {models.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
          Novos modelos em breve.
        </p>
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
                  <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                    {current.plan}
                  </span>
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
