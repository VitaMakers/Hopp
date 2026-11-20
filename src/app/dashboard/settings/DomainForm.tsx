"use client";

import { useActionState } from "react";
import { removeDomain, saveDomain, type DomainState } from "./domain-actions";

const input =
  "h-11 w-full min-w-0 rounded-[10px] border border-[#E5E2DA] bg-white px-3 text-[15px] text-stone-900 outline-none transition-colors placeholder:text-stone-500 focus:border-stone-900";

export function DomainForm({ clientId, domain }: { clientId: string; domain: string | null }) {
  const [state, action, pending] = useActionState<DomainState, FormData>(saveDomain.bind(null, clientId), {});
  return (
    <div className="mt-4 flex flex-col gap-3">
      <form action={action} className="flex flex-wrap items-start gap-2">
        <label className="min-w-[220px] flex-1">
          <span className="sr-only">Seu domínio</span>
          <input name="domain" defaultValue={domain ?? ""} placeholder="suamarca.com.br" autoCapitalize="none" autoCorrect="off" spellCheck={false} className={input} />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-[10px] bg-stone-900 px-[18px] text-sm font-semibold text-white transition-colors hover:bg-stone-800 disabled:opacity-60"
        >
          {pending ? "Salvando..." : domain ? "Trocar domínio" : "Salvar domínio"}
        </button>
      </form>
      {state.error ? (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.ok ? <p className="text-sm text-[#2F6B3A]">{state.ok}</p> : null}
      {domain ? (
        <form action={removeDomain.bind(null, clientId)}>
          <button type="submit" className="text-[13px] font-semibold text-red-700 underline underline-offset-4 hover:text-red-800">
            Remover o domínio
          </button>
        </form>
      ) : null}
    </div>
  );
}
