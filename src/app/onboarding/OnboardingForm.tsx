"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { handleError, normalizeHandle } from "@/lib/handles";
import { TEMPLATE_COLLECTIONS, collectionModels } from "@/lib/page/templates";
import { ModelThumb } from "@/components/page-view/ModelThumb";
import { createProfile, type OnboardingState } from "./actions";

type Tab = "premium" | "essencial" | "branco";

const TABS: { id: Tab; label: string }[] = [
  { id: "premium", label: "Premium" },
  { id: "essencial", label: "Essenciais" },
  { id: "branco", label: "Em branco" },
];

// Collection names may carry a leading emoji in the data; show plain words.
const plain = (name: string) => name.replace(/^[^\p{L}]+/u, "").trim();
const firstOf = (tab: Tab) => TEMPLATE_COLLECTIONS.find((c) => c.tab === tab && c.templateIds.length > 0)?.id ?? "todos";

export function OnboardingForm({ host, essencialPrice }: { host: string; essencialPrice: string }) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(createProfile, {});
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [tab, setTab] = useState<Tab>("premium");
  const [collection, setCollection] = useState("todos");
  const [template, setTemplate] = useState(""); // "" = página em branco
  // Models build their pages with random block ids, so the thumbnails are drawn
  // only in the browser (server and browser would otherwise disagree).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const normalized = normalizeHandle(handle);
  const localError = handle ? handleError(normalized) : null;
  const error = localError ?? state.error ?? null;

  const collections = TEMPLATE_COLLECTIONS.filter((c) => c.tab === tab && c.templateIds.length > 0);
  const list = useMemo(() => {
    const source = collection === "todos" ? collections : collections.filter((c) => c.id === collection);
    return source.flatMap((c) => collectionModels(c).map((t) => ({ t, kind: plain(c.name) })));
  }, [collections, collection]);

  const chosen = useMemo(
    () => TEMPLATE_COLLECTIONS.flatMap((c) => collectionModels(c).map((t) => ({ t, premium: c.tab === "premium" }))).find((m) => m.t.id === template) ?? null,
    [template],
  );

  function pickTab(next: Tab) {
    setTab(next);
    // Premium is small enough to show at once; the essentials (dozens of
    // models) open on one segment so the page stays fast.
    setCollection(next === "premium" ? "todos" : firstOf(next));
    if (next === "branco") setTemplate("");
  }

  const submit = (
    <button
      type="submit"
      form="onboarding"
      disabled={pending || !!localError}
      className="h-12 w-full rounded-[10px] bg-blue-600 text-[15px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
    >
      {pending ? "Criando..." : chosen?.premium ? "Criar e testar este modelo" : "Criar minha página"}
    </button>
  );

  return (
    <div className="mt-8 grid items-start gap-6 pb-28 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-8 lg:pb-0">
      {/* Step 1: who you are and the address. Only this card is the form: the
          model previews are real page markup (with their own buttons and
          forms), so they stay outside it. */}
      <form id="onboarding" action={action} className="rounded-[14px] border border-[#E5E2DA] bg-white p-6 lg:sticky lg:top-6">
        <input type="hidden" name="templateId" value={template} />
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-stone-600">Passo 1</p>
        <h2 className="mt-1 text-lg font-semibold">Seu nome e endereço</h2>

        <label className="mt-5 flex flex-col gap-1.5 text-sm font-medium text-stone-800">
          Seu nome ou da marca
          <input
            name="name"
            required
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Studio Marina"
            className="h-11 rounded-[10px] border border-[#E5E2DA] bg-white px-3 text-[15px] font-normal text-stone-900 outline-none transition-colors placeholder:text-stone-500 focus:border-stone-900"
          />
        </label>

        <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium text-stone-800">
          Endereço da página
          <span className="flex h-11 items-center rounded-[10px] border border-[#E5E2DA] bg-white transition-colors focus-within:border-stone-900">
            <span className="pl-3 text-[15px] font-normal text-stone-600">{host}/</span>
            <input
              name="handle"
              required
              value={handle}
              onChange={(event) => setHandle(event.target.value)}
              placeholder="suamarca"
              className="h-full w-full min-w-0 rounded-[10px] bg-transparent pl-0.5 pr-3 text-[15px] font-normal text-stone-900 outline-none placeholder:text-stone-500"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </span>
          <span className="text-[13px] font-normal text-stone-600">É o link que você coloca na bio das redes sociais.</span>
        </label>

        <div className="mt-5 border-t border-[#EFEDE7] pt-4">
          <p className="text-[13px] text-stone-600">Modelo escolhido</p>
          <p className="mt-0.5 text-[15px] font-semibold">{chosen ? chosen.t.name : "Página em branco"}</p>
          {chosen?.premium ? (
            <p className="mt-1.5 text-[13px] leading-relaxed text-stone-600">
              Modelo do plano Essencial ({essencialPrice} por mês). Você monta e vê como fica sem pagar; a assinatura só é pedida na hora de colocar no ar.
            </p>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <div className="mt-5 hidden lg:block">{submit}</div>
        <p className="mt-3 hidden text-center text-[13px] text-stone-600 lg:block">Depois você troca modelo, textos e imagens quando quiser.</p>
      </form>

      {/* Step 2: the model */}
      <section className="min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-stone-600">Passo 2</p>
        <h2 className="mt-1 text-lg font-semibold">Escolha um modelo para começar</h2>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div role="tablist" aria-label="Tipo de modelo" className="inline-flex rounded-[11px] bg-[#E9E7E1] p-[3px]">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => pickTab(item.id)}
                className={`h-[34px] rounded-[9px] px-4 text-sm font-semibold transition-colors ${tab === item.id ? "bg-white text-stone-900" : "text-stone-700 hover:text-stone-900"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {tab === "branco" ? (
          <div className="mt-5 rounded-[14px] border border-[#E5E2DA] bg-white p-8">
            <h3 className="text-[15px] font-semibold">Começar com uma página em branco</h3>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-stone-600">
              Você adiciona os blocos no editor e vê o resultado na prévia ao lado. Dá para aplicar um modelo depois, quando quiser.
            </p>
          </div>
        ) : (
          <>
            {collections.length > 1 ? (
              <div className="-mx-4 mt-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
                {[...(tab === "premium" ? [{ id: "todos", name: "Todos" }] : []), ...collections].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={collection === c.id}
                    onClick={() => setCollection(c.id)}
                    className={`h-8 shrink-0 whitespace-nowrap rounded-full border px-3 text-[13px] font-medium transition-colors ${
                      collection === c.id ? "border-stone-900 bg-stone-900 text-white" : "border-[#E5E2DA] bg-white text-stone-700 hover:border-stone-400"
                    }`}
                  >
                    {plain(c.name)}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-5 grid grid-cols-2 gap-[18px] sm:grid-cols-3 xl:grid-cols-4">
              {list.map(({ t, kind }) => {
                const on = template === t.id;
                return (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={on}
                    onClick={() => setTemplate(on ? "" : t.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setTemplate(on ? "" : t.id);
                      }
                    }}
                    className="group cursor-pointer rounded-xl text-left outline-none"
                  >
                    <span
                      className={`relative block overflow-hidden rounded-xl border border-[#E5E2DA] outline outline-2 outline-offset-[3px] transition-[outline-color] ${
                        on ? "outline-blue-600" : "outline-transparent group-hover:outline-[#D9D6CE] group-focus-visible:outline-stone-900"
                      }`}
                    >
                      {mounted ? <ModelThumb doc={t.build(name.trim() || t.name)} width={200} height={328} /> : <span className="block aspect-[200/328] w-full animate-pulse bg-[#EFEDE7]" />}
                      {tab === "premium" ? (
                        <span className="absolute right-2 top-2 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-stone-900">{essencialPrice}/mês</span>
                      ) : null}
                      {on ? (
                        <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="m5 12 5 5 9-10" />
                          </svg>
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-2.5 block text-sm font-semibold">{t.name}</span>
                    <span className="block text-xs text-stone-600">{kind}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* On phones the button stays within reach while browsing the models */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#E5E2DA] bg-white/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        {error ? <p className="mb-2 text-center text-[13px] text-red-700">{error}</p> : null}
        {submit}
      </div>
    </div>
  );
}
