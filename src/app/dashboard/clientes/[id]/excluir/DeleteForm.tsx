"use client";

import { useActionState, useState } from "react";
import { deleteClient, type DeleteClientState } from "../../actions";

export function DeleteForm({ clientId, handle }: { clientId: string; handle: string }) {
  const action = deleteClient.bind(null, clientId);
  const [state, formAction, pending] = useActionState<DeleteClientState, FormData>(action, {});
  const [typed, setTyped] = useState("");
  const matches = typed.trim().toLowerCase() === handle.toLowerCase();

  return (
    <form action={formAction} className="mt-5 flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
        Para confirmar, digite <span className="font-mono text-red-600">{handle}</span>
        <input
          name="confirm"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          required
          autoCapitalize="none"
          autoCorrect="off"
          placeholder={handle}
          className="field"
        />
      </label>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending || !matches}
        className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Excluindo..." : "Excluir cliente permanentemente"}
      </button>
    </form>
  );
}
