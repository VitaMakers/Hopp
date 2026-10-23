"use client";

import { useActionState, useState } from "react";
import { handleError, normalizeHandle } from "@/lib/handles";
import { TEMPLATE_COLLECTIONS, TEMPLATE_TABS, collectionModels } from "@/lib/page/templates";
import { ModelThumb } from "@/components/page-view/ModelThumb";
import { addClient, type AddClientState } from "../actions";

export function NewClientForm({
  host,
  paid,
  essencialPrice,
  profissionalPrice,
}: {
  host: string;
  paid: boolean;
  essencialPrice: string;
  profissionalPrice: string;
}) {
  const [state, action, pending] = useActionState<AddClientState, FormData>(addClient, {});
  const [handle, setHandle] = useState("");
  const [template, setTemplate] = useState("");
  const [plan, setPlan] = useState("essencial");
  const [tab, setTab] = useState("premium");
  const [openCollection, setOpenCollection] = useState<string | null>(null);
  const normalized = normalizeHandle(handle);
  const localError = handle ? handleError(normalized) : null;
  const current = TEMPLATE_TABS.find((item) => item.id === tab) ?? TEMPLATE_TABS[0];
  const collections = TEMPLATE_COLLECTIONS.filter((c) => c.tab === tab);
  const open = collections.find((c) => c.id === openCollection) ?? null;

  function selectTab(id: string) {
    setTab(id);
    setOpenCollection(null);
    if (TEMPLATE_TABS.find((t) => t.id === id)?.kind === "scratch") setTemplate("");
  }

  return (
    <form action={action} className="mt-6 flex flex-col gap-5">
      <div className="flex flex-col gap-3">
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
          <label className={`block cursor-pointer rounded-xl border border-dashed p-6 text-center transition ${template === "" ? "border-stone-900 ring-2 ring-stone-900" : "border-stone-300 hover:border-stone-500"}`}>
            <input type="radio" name="templateId" value="" checked={template === ""} onChange={() => setTemplate("")} className="sr-only" />
            <span className="block font-medium">Começar uma página em branco</span>
          </label>
        ) : open ? (
          <>
            <button type="button" onClick={() => setOpenCollection(null)} className="self-start text-sm text-stone-500 hover:text-stone-900">
              ← {current.label}
            </button>
            <p className="font-medium">{open.name}</p>
            {collectionModels(open).length === 0 ? (
              <p className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">Novos modelos em breve.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {collectionModels(open).map((t) => (
                  <label
                    key={t.id}
                    className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl p-2 ring-1 transition ${template === t.id ? "ring-2 ring-stone-900" : "ring-stone-200 hover:ring-stone-400"}`}
                  >
                    <input type="radio" name="templateId" value={t.id} checked={template === t.id} onChange={() => setTemplate(t.id)} className="sr-only" />
                    <ModelThumb doc={t.build("Adicione seu nome")} />
                    <span className="text-sm font-medium">{t.name}</span>
                  </label>
                ))}
              </div>
            )}
          </>
        ) : collections.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">Novas categorias em breve.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {collections.map((collection) => {
              const count = collectionModels(collection).length;
              return (
                <button key={collection.id} type="button" onClick={() => setOpenCollection(collection.id)} className="overflow-hidden rounded-xl text-left ring-1 ring-stone-200 transition hover:ring-stone-400">
                  <div className="flex h-16 flex-col items-center justify-center gap-1.5 p-3" style={{ background: collection.swatch.background }}>
                    <span className="text-xs font-bold" style={{ color: collection.swatch.text }}>
                      {collection.name}
                    </span>
                    <span className="h-1.5 w-2/3 rounded-full" style={{ background: collection.swatch.accent }} />
                  </div>
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                    <span className="text-sm font-medium">{collection.name}</span>
                    <span className="text-xs text-stone-500">{count > 0 ? `${count} modelo${count > 1 ? "s" : ""}` : "Em breve"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {paid ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-stone-700">Plano deste cliente</legend>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "essencial", name: "Essencial", price: essencialPrice },
              { id: "profissional", name: "Profissional", price: profissionalPrice },
            ].map((opt) => (
              <label
                key={opt.id}
                className={`cursor-pointer rounded-xl p-3 text-center ring-1 transition ${plan === opt.id ? "ring-2 ring-stone-900" : "ring-stone-200 hover:ring-stone-400"}`}
              >
                <input type="radio" name="plan" value={opt.id} checked={plan === opt.id} onChange={() => setPlan(opt.id)} className="sr-only" />
                <span className="block font-semibold">{opt.name}</span>
                <span className="text-sm text-stone-500">{opt.price}/mês</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
        Nome do cliente ou da marca
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
        {pending ? "Criando..." : paid ? "Criar e ir para o pagamento" : "Criar cliente"}
      </button>
    </form>
  );
}
