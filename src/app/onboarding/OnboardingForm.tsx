"use client";

import { useActionState, useState } from "react";
import { handleError, normalizeHandle } from "@/lib/handles";
import { createProfile, type OnboardingState } from "./actions";

export function OnboardingForm({ host }: { host: string }) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(createProfile, {});
  const [handle, setHandle] = useState("");
  const normalized = normalizeHandle(handle);
  const localError = handle ? handleError(normalized) : null;

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
        Seu nome ou da marca
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
      {localError || state.error ? (
        <p className="text-sm text-red-600">{localError ?? state.error}</p>
      ) : null}
      <button type="submit" disabled={pending || !!localError} className="btn-primary">
        {pending ? "Criando..." : "Criar minha página"}
      </button>
    </form>
  );
}
