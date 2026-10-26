"use client";

import { useActionState, useState } from "react";
import { changePassword, deleteAccount, type DeleteState, type PasswordState } from "./actions";

export function SecurityForm() {
  const [pwState, pwAction, pwPending] = useActionState<PasswordState, FormData>(changePassword, {});
  const [delState, delAction, delPending] = useActionState<DeleteState, FormData>(deleteAccount, {});
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <form action={pwAction} className="flex flex-col gap-3">
        <h3 className="font-medium text-stone-800">Trocar senha</h3>
        <label className="flex flex-col gap-1 text-sm text-stone-600">
          Nova senha
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className="field" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-stone-600">
          Confirmar nova senha
          <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className="field" />
        </label>
        {pwState.error ? <p className="text-sm text-red-600">{pwState.error}</p> : null}
        {pwState.ok ? <p className="text-sm text-emerald-700">Senha alterada com sucesso.</p> : null}
        <button type="submit" disabled={pwPending} className="btn-primary self-start">
          {pwPending ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>

      <div className="border-t border-stone-200 pt-5">
        <h3 className="font-medium text-red-700">Excluir conta</h3>
        <p className="mt-1 text-sm text-stone-600">
          Apaga a sua conta e <strong>todos os clientes e páginas</strong> que você gerencia, junto com estatísticas e
          contatos. Esta ação é <strong>permanente</strong> e não pode ser desfeita.
        </p>
        {!showDelete ? (
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
          >
            Quero excluir minha conta
          </button>
        ) : (
          <form action={delAction} className="mt-3 flex flex-col gap-2">
            <label className="flex flex-col gap-1 text-sm text-stone-600">
              Digite <strong>EXCLUIR</strong> para confirmar
              <input name="confirm" required placeholder="EXCLUIR" className="field max-w-xs" autoComplete="off" />
            </label>
            {delState.error ? <p className="text-sm text-red-600">{delState.error}</p> : null}
            <div className="flex gap-2">
              <button type="submit" disabled={delPending} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {delPending ? "Excluindo..." : "Excluir conta definitivamente"}
              </button>
              <button type="button" onClick={() => setShowDelete(false)} className="rounded-lg px-4 py-2 text-sm text-stone-600 hover:text-stone-900">
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
