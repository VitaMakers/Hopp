"use client";

import { useActionState } from "react";
import { updatePassword, type UpdateState } from "./actions";

export function ResetForm() {
  const [state, action, pending] = useActionState<UpdateState, FormData>(updatePassword, {});

  return (
    <form action={action} className="mt-6 flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
        Nova senha
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className="field" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
        Confirmar nova senha
        <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className="field" />
      </label>
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="btn-primary mt-2">
        {pending ? "Salvando..." : "Salvar nova senha"}
      </button>
    </form>
  );
}
