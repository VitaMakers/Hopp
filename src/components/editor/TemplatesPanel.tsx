"use client";

import { useState } from "react";
import { defaultPageDoc } from "@/lib/page/catalog";
import type { PageDoc } from "@/lib/page/schema";
import { TEMPLATES, TEMPLATE_COLLECTIONS, TEMPLATE_TABS, collectionModels } from "@/lib/page/templates";
import { ModelThumb } from "@/components/page-view/ModelThumb";
import { Card } from "./fields";

type PanelProps = { doc: PageDoc; onChange: (doc: PageDoc) => void; onGoToBlocks?: () => void };

export function TemplatesPanel({ doc, onChange, onGoToBlocks }: PanelProps) {
  const [tab, setTab] = useState("premium");
  const [openCollection, setOpenCollection] = useState<string | null>(null);
  const current = TEMPLATE_TABS.find((item) => item.id === tab) ?? TEMPLATE_TABS[0];
  const collections = TEMPLATE_COLLECTIONS.filter((c) => c.tab === tab);
  const open = collections.find((c) => c.id === openCollection) ?? null;

  function selectTab(id: string) {
    setTab(id);
    setOpenCollection(null);
  }

  function apply(id: string) {
    const template = TEMPLATES.find((item) => item.id === id);
    if (!template) return;
    if (!window.confirm(`Usar o modelo "${template.name}"? Os blocos e o visual da sua página serão trocados pelos do modelo (o rascunho só vai ao ar quando você publicar).`)) return;
    onChange({ ...template.build(doc.profile.name || "Sua Marca"), seo: doc.seo });
  }

  function startBlank() {
    if (!window.confirm("Começar uma página em branco? Os blocos e o visual atuais serão substituídos por uma página em branco.")) return;
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
            onClick={() => selectTab(item.id)}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition sm:text-sm ${tab === item.id ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {current.kind === "scratch" ? (
        <>
          <p className="-mt-1 text-xs text-stone-500">{current.note}</p>
          <button type="button" onClick={startBlank} className="rounded-xl border border-dashed border-stone-300 p-6 text-center transition hover:border-stone-500">
            <span className="block font-medium">Começar uma página em branco</span>
            <span className="mt-1 block text-xs text-stone-500">Você monta na aba Blocos e vê o resultado na prévia ao lado.</span>
          </button>
        </>
      ) : open ? (
        <>
          <button type="button" onClick={() => setOpenCollection(null)} className="-mb-1 self-start text-sm text-stone-500 hover:text-stone-900">
            ← {current.label}
          </button>
          <p className="font-medium">{open.name}</p>
          {collectionModels(open).length === 0 ? (
            <p className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">Novos modelos em breve.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {collectionModels(open).map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => apply(template.id)}
                  aria-label={`Usar o modelo ${template.name}`}
                  className="flex flex-col items-center gap-2 rounded-xl p-2 ring-1 ring-stone-200 transition hover:ring-stone-400"
                >
                  <ModelThumb doc={template.build(doc.profile.name || "Sua Marca")} />
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium">{template.name}</span>
                    {current.plan ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">{current.plan}</span> : null}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : collections.length === 0 ? (
        <>
          <p className="-mt-1 text-xs text-stone-500">{current.note}</p>
          <p className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">Novas categorias em breve.</p>
        </>
      ) : (
        <>
          <p className="-mt-1 text-xs text-stone-500">{current.note}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {collections.map((collection) => {
              const count = collectionModels(collection).length;
              return (
                <button
                  key={collection.id}
                  type="button"
                  onClick={() => setOpenCollection(collection.id)}
                  className="overflow-hidden rounded-xl text-left ring-1 ring-stone-200 transition hover:ring-stone-400"
                >
                  <div className="flex h-20 flex-col items-center justify-center gap-2 p-3" style={{ background: collection.swatch.background }}>
                    <span className="text-sm font-bold tracking-wide" style={{ color: collection.swatch.text }}>
                      {collection.name}
                    </span>
                    <span className="h-2 w-2/3 rounded-full" style={{ background: collection.swatch.accent }} />
                  </div>
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                    <span className="font-medium">{collection.name}</span>
                    <span className="text-xs text-stone-500">{count > 0 ? `${count} modelo${count > 1 ? "s" : ""}` : "Em breve"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}
