"use client";

import { useActionState, useState } from "react";
import { detachClient, type DetachState } from "./actions";

export function DetachForm({ clientId }: { clientId: string }) {
  const action = detachClient.bind(null, clientId);
  const [state, formAction, pending] = useActionState<DetachState, FormData>(action, {});
  const [confirmed, setConfirmed] = useState(false);

  if (state.ok) {
    return (
      <div className="mt-5 flex flex-col gap-3">
        <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-200">
          Pronto! O cliente agora pertence à conta de <strong>{state.email}</strong>. Você não gerencia mais essa página.
        </p>
        <p className="rounded-xl bg-stone-50 p-4 text-sm text-stone-700 ring-1 ring-stone-200">
          {state.mode === "invited"
            ? "Enviamos um convite para esse e-mail. O cliente abre o e-mail, clica no link e cria a senha dele. Peça para ele olhar também a caixa de spam."
            : "Esse e-mail já tem uma conta na Virtú.bio. O cliente entra com a senha dele e a página já aparece no painel. Se ele não lembrar a senha, é só usar “Esqueci minha senha”."}
        </p>
        {state.billing ? (
          <p className="text-xs text-stone-500">
            A assinatura que você pagava para este cliente foi cancelada e termina no fim do período já pago. Depois disso, o cliente pode assinar pela conta dele.
          </p>
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
        <span>Entendo que, ao desvincular, deixo de gerenciar este cliente, o acesso passa para o e-mail acima e a assinatura que eu pago para ele é cancelada no fim do período.</span>
      </label>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <button type="submit" disabled={pending || !confirmed} className="btn-primary">
        {pending ? "Transferindo..." : "Desvincular e enviar convite"}
      </button>
    </form>
  );
}
