"use client";

import Link from "next/link";
import { useState } from "react";
import { defaultPageDoc } from "@/lib/page/catalog";
import { canUsePremium, planAllows } from "@/lib/entitlements";
import type { PageDoc } from "@/lib/page/schema";
import { TEMPLATES, TEMPLATE_COLLECTIONS, TEMPLATE_TABS, collectionModels, type TemplateCollection } from "@/lib/page/templates";
import { ModelThumb } from "@/components/page-view/ModelThumb";
import { PageView } from "@/components/page-view/PageView";
import { Card } from "./fields";

type PanelProps = { doc: PageDoc; onChange: (doc: PageDoc) => void; plan: string; onGoToBlocks?: () => void };

export function TemplatesPanel({ doc, onChange, plan, onGoToBlocks }: PanelProps) {
  const [tab, setTab] = useState("essencial");
  const [openCollection, setOpenCollection] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const current = TEMPLATE_TABS.find((item) => item.id === tab) ?? TEMPLATE_TABS[0];
  const collections = TEMPLATE_COLLECTIONS.filter((c) => c.tab === tab);
  const open = collections.find((c) => c.id === openCollection) ?? null;

  // A model's required plan comes from its collection: the premium tab defaults
  // to Profissional, the Vitrine collection is marked Essencial, and the
  // essencial tab is free for everyone.
  const PLAN_LABEL: Record<string, string> = { free: "Grátis", essencial: "Essencial", profissional: "Profissional" };
  const collectionRequires = (c: TemplateCollection) => c.requiresPlan ?? (c.tab === "premium" ? "profissional" : "free");
  const openRequires = open ? collectionRequires(open) : "free";
  const openAllowed = planAllows(plan, openRequires);

  const premiumTab = tab === "premium";
  const canPremium = canUsePremium(plan);
  const previewTemplate = previewId ? TEMPLATES.find((t) => t.id === previewId) : null;

  function selectTab(id: string) {
    setTab(id);
    setOpenCollection(null);
    setPreviewId(null);
  }

  // Apply the previewed model (only reachable when the plan allows it).
  function applyModel(id: string) {
    const template = TEMPLATES.find((item) => item.id === id);
    if (!template || !openAllowed) return;
    if (!window.confirm(`Usar o modelo "${template.name}"? Os blocos e o visual da sua página serão trocados pelos do modelo (o rascunho só vai ao ar quando você publicar).`)) return;
    onChange({ ...template.build("Adicione seu nome"), seo: doc.seo });
    setPreviewId(null);
  }

  function startBlank() {
    if (!window.confirm("Começar uma página em branco? Os blocos e o visual atuais serão substituídos por uma página em branco.")) return;
    onChange({ ...defaultPageDoc("Adicione seu nome"), seo: doc.seo });
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

      {/* Access note for the current tab. */}
      {tab === "essencial" ? (
        <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
          <span>✅</span> Incluídos no seu plano — use à vontade.
        </p>
      ) : premiumTab && !canPremium && !open ? (
        <p className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
          <span>👁️</span> Você pode ver todos os modelos. Usar depende do plano indicado em cada um.
        </p>
      ) : null}

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
                  onClick={() => setPreviewId(template.id)}
                  aria-label={`Ver o modelo ${template.name}`}
                  className="flex flex-col items-center gap-2 rounded-xl p-2 ring-1 ring-stone-200 transition hover:ring-stone-400"
                >
                  <div className="relative">
                    <div className={openAllowed ? "" : "opacity-70"}>
                      <ModelThumb doc={template.build("Adicione seu nome")} />
                    </div>
                    {!openAllowed ? (
                      <span className="absolute right-1 top-1 rounded-full bg-stone-900/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">🔒</span>
                    ) : null}
                  </div>
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">{template.name}</span>
                    {openAllowed ? (
                      <span className="text-emerald-600">✓</span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">{PLAN_LABEL[openRequires]}</span>
                    )}
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

      {/* Full-model preview: anyone can see it; only "Usar" is gated by plan. */}
      {previewTemplate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPreviewId(null)}>
          <div className="flex max-h-[85vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
              <span className="font-semibold">{previewTemplate.name}</span>
              <button type="button" onClick={() => setPreviewId(null)} aria-label="Fechar" className="text-stone-400 hover:text-stone-900">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-stone-100 p-4">
              <div className="mx-auto w-full max-w-[320px] overflow-hidden rounded-2xl ring-1 ring-stone-200">
                <PageView doc={previewTemplate.build("Adicione seu nome")} still />
              </div>
            </div>
            <div className="border-t border-stone-200 p-4">
              {openAllowed ? (
                <button type="button" onClick={() => applyModel(previewTemplate.id)} className="btn-primary w-full">
                  Usar este modelo
                </button>
              ) : (
                <div className="flex items-center justify-between gap-3 rounded-lg bg-stone-900 px-3 py-2.5 text-sm text-white">
                  <span>🔒 Modelo do plano {PLAN_LABEL[openRequires]}</span>
                  <Link href="/dashboard/plans" className="shrink-0 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-stone-900">
                    Ver planos
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
