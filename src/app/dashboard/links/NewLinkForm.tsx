"use client";

import { useActionState, useEffect, useRef } from "react";
import { createShortLink, type LinkFormState } from "../actions";

export function NewLinkForm({ base }: { base: string }) {
  const [state, action, pending] = useActionState<LinkFormState, FormData>(createShortLink, {});
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-3 rounded-xl bg-white p-4 ring-1 ring-stone-200 md:grid-cols-[1fr_1fr_1.4fr_auto] md:items-end">
      <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
        Nome
        <input name="title" maxLength={120} placeholder="Promoção de outubro" className="field" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
        Código
        <div className="flex items-center rounded-lg ring-1 ring-stone-300">
          <span className="pl-3 text-xs text-stone-500">{base.replace(/^https?:\/\//, "")}/l/</span>
          <input name="code" required maxLength={40} className="w-full bg-transparent px-1 py-2.5 outline-none" />
        </div>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
        Destino
        <input name="target" type="url" required placeholder="https://..." className="field" />
      </label>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Criando..." : "Criar"}
      </button>
      {state.error ? <p className="text-sm text-red-600 md:col-span-4">{state.error}</p> : null}
    </form>
  );
}
