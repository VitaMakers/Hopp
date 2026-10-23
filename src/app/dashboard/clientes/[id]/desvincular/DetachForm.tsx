"use client";

import { useActionState, useState } from "react";
import { detachClient, type DetachState } from "./actions";

export function DetachForm({ clientId }: { clientId: string }) {
  const action = detachClient.bind(null, clientId);
  const [state, formAction, pending] = useActionState<DetachState, FormData>(action, {});
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (state.ok) {
    return (
      <div className="mt-5 flex flex-col gap-3">
        <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-200">
          Pronto! O cliente agora pertence à conta de <strong>{state.email}</strong>. Você não gerencia mais essa página.
        </p>
        {state.link ? (
          <div className="rounded-xl bg-stone-50 p-4 ring-1 ring-stone-200">
            <p className="text-sm font-medium text-stone-700">Envie este link de acesso para o cliente:</p>
            <p className="mt-1 text-xs text-stone-500">Ele usa o link para entrar e definir a senha dele. Mande por WhatsApp, e-mail, etc.</p>
            <div className="mt-3 flex items-center gap-2">
              <input readOnly value={state.link} className="field flex-1 text-xs" onFocus={(e) => e.target.select()} />
              <button type="button" onClick={() => copy(state.link!)} className="btn-primary whitespace-nowrap text-sm">
                {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-5 flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
        E-mail do cliente
        <input name="email" type="email" required placeholder="cliente@exemplo.com" className="field" autoCapitalize="none" autoCorrect="off" />
        <span className="text-xs font-normal text-stone-500">É com este e-mail que o cliente vai acessar a conta dele.</span>
      </label>

      <label className="flex items-start gap-2 text-sm text-stone-700">
        <input type="checkbox" required checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5" />
        <span>Entendo que, ao desvincular, deixo de gerenciar este cliente e o acesso passa para o e-mail acima.</span>
      </label>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <button type="submit" disabled={pending || !confirmed} className="btn-primary">
        {pending ? "Transferindo..." : "Desvincular e gerar acesso"}
      </button>
    </form>
  );
}
