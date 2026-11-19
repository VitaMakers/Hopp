"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ModelThumb } from "@/components/page-view/ModelThumb";
import { canUsePremium, planViolations } from "@/lib/entitlements";
import { TEMPLATE_COLLECTIONS, collectionModels, type PageTemplate } from "@/lib/page/templates";
import { applyModel } from "./actions";

type Tab = "premium" | "essencial";

// Collection names may carry a leading emoji in the data; show plain words.
const plain = (name: string) => name.replace(/^[^\p{L}]+/u, "").trim();

export function ModelsGallery({
  clientId,
  plan,
  essencialPrice,
  initial,
}: {
  clientId: string;
  plan: string;
  essencialPrice: string;
  initial?: string;
}) {
  const startsPremium = !initial || TEMPLATE_COLLECTIONS.some((c) => c.tab === "premium" && c.templateIds.includes(initial));
  const [tab, setTab] = useState<Tab>(startsPremium ? "premium" : "essencial");
  const collections = TEMPLATE_COLLECTIONS.filter((c) => c.tab === tab && c.templateIds.length > 0);
  // Premium is small enough to show at once; the essentials (dozens of models)
  // open on one segment so the page stays fast.
  const firstOf = (t: Tab) => TEMPLATE_COLLECTIONS.find((c) => c.tab === t && c.templateIds.length > 0)?.id ?? "todos";
  const initialCollection = startsPremium
    ? "todos"
    : (TEMPLATE_COLLECTIONS.find((c) => c.tab === "essencial" && initial && c.templateIds.includes(initial))?.id ?? firstOf("essencial"));
  const [collection, setCollection] = useState<string>(initialCollection);
  const [selected, setSelected] = useState<string | null>(initial ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  // Models build their pages with random block ids, so the thumbnails are drawn
  // only in the browser (server and browser would otherwise disagree).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const list = useMemo(() => {
    const source = collection === "todos" ? collections : collections.filter((c) => c.id === collection);
    return source.flatMap((c) => collectionModels(c).map((t) => ({ t, kind: plain(c.name) })));
  }, [collections, collection]);

  const current = list.find((m) => m.t.id === selected) ?? list[0] ?? null;
  const doc = useMemo(() => (current ? current.t.build(current.t.name) : null), [current]);
  const locked = (t: PageTemplate) => (t.plan === "premium" && !canUsePremium(plan)) || (!canUsePremium(plan) && planViolations(t.build(""), plan).length > 0);
  const currentLocked = current ? locked(current.t) : false;

  function pickTab(next: Tab) {
    setTab(next);
    setCollection(next === "premium" ? "todos" : firstOf("essencial"));
    setSelected(null);
    setError(null);
  }

  function use(templateId: string, label: string) {
    const ok = window.confirm(
      templateId === "blank"
        ? "Começar uma página em branco? Os blocos e o visual atuais saem; seu nome e o SEO continuam. Nada vai ao ar até você publicar."
        : `Usar o modelo "${label}"? Os blocos e o visual mudam. Seu nome, bio, foto, capa, redes e WhatsApp continuam. Nada vai ao ar até você publicar.`,
    );
    if (!ok) return;
    setError(null);
    start(async () => {
      const result = await applyModel(clientId, templateId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[30px] font-bold leading-tight tracking-[-0.025em]">Modelos</h1>
          <p className="mt-2 text-[15px] text-stone-600">Troque o visual da página em um clique. Seu nome, fotos, links e WhatsApp continuam.</p>
        </div>
        <button
          type="button"
          onClick={() => use("blank", "")}
          disabled={pending}
          className="h-10 rounded-[10px] border border-[#E5E2DA] bg-white px-4 text-sm font-semibold text-stone-900 transition-colors hover:border-stone-400 disabled:opacity-60"
        >
          Começar do zero
        </button>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Tipo de modelo" className="inline-flex rounded-[11px] bg-[#E9E7E1] p-[3px]">
          {(["premium", "essencial"] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => pickTab(id)}
              className={`h-[34px] rounded-[9px] px-4 text-sm font-semibold transition-colors ${tab === id ? "bg-white text-stone-900" : "text-stone-700 hover:text-stone-900"}`}
            >
              {id === "premium" ? "Premium" : "Essenciais"}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[...(tab === "premium" ? [{ id: "todos", name: "Todos" }] : []), ...collections].map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={collection === c.id}
              onClick={() => {
                setCollection(c.id);
                setSelected(null);
              }}
              className={`h-8 rounded-full border px-3 text-[13px] font-medium transition-colors ${
                collection === c.id ? "border-stone-900 bg-stone-900 text-white" : "border-[#E5E2DA] bg-white text-stone-700 hover:border-stone-400"
              }`}
            >
              {plain(c.name)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-7">
        <div className="grid min-w-0 flex-[999_1_520px] grid-cols-2 gap-[18px] sm:grid-cols-3 xl:grid-cols-4">
          {list.map(({ t, kind }) => {
            const on = current?.t.id === t.id;
            const lock = locked(t);
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setSelected(t.id);
                  setError(null);
                }}
                className="group text-left"
              >
                <span
                  className={`relative block overflow-hidden rounded-xl border border-[#E5E2DA] outline outline-2 outline-offset-[3px] transition-[outline-color] ${
                    on ? "outline-stone-900" : "outline-transparent group-hover:outline-[#D9D6CE]"
                  }`}
                >
                  {mounted ? (
                    <ModelThumb doc={t.build(t.name)} width={200} height={328} />
                  ) : (
                    <span className="block aspect-[200/328] w-full animate-pulse bg-[#EFEDE7]" />
                  )}
                  {lock ? (
                    <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-stone-900">
                      <svg viewBox="0 0 24 24" className="h-[11px] w-[11px]" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <rect x="4" y="11" width="16" height="10" rx="2" />
                        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                      </svg>
                      Essencial
                    </span>
                  ) : null}
                </span>
                <span className="mt-2.5 block text-sm font-semibold">{t.name}</span>
                <span className="block text-xs text-stone-600">{kind}</span>
              </button>
            );
          })}
        </div>

        {current && doc && mounted ? (
          <aside aria-label="Prévia do modelo" className="sticky top-6 w-full flex-[1_1_300px] rounded-[14px] border border-[#E5E2DA] bg-white p-5 lg:max-w-[360px]">
            <div className="flex justify-center rounded-[10px] bg-[#F3F2EE] py-5">
              <span className="block overflow-hidden rounded-[34px] border-8 border-stone-900">
                <ModelThumb doc={doc} width={230} height={450} />
              </span>
            </div>
            <h2 className="mt-4 text-lg font-semibold">{current.t.name}</h2>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">{current.t.description}</p>
            {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
            {currentLocked ? (
              <>
                <a
                  href={`/dashboard/clientes/${clientId}/assinar?plan=essencial`}
                  className="mt-4 flex h-11 items-center justify-center rounded-[10px] bg-blue-600 text-[15px] font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Liberar com o Essencial
                </a>
                <p className="mt-2 text-center text-[13px] text-stone-600">{essencialPrice} por mês, cancele quando quiser.</p>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => use(current.t.id, current.t.name)}
                  className="mt-4 h-11 w-full rounded-[10px] bg-stone-900 text-[15px] font-semibold text-white transition-colors hover:bg-stone-800 disabled:opacity-60"
                >
                  {pending ? "Aplicando..." : "Usar este modelo"}
                </button>
                <p className="mt-2 text-center text-[13px] text-stone-600">Nada vai ao ar até você publicar.</p>
              </>
            )}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
