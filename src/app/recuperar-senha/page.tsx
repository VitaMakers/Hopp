"use client";

import Link from "next/link";
import { useActionState } from "react";
import { APP_NAME, APP_TAGLINE } from "@/lib/env";
import { requestReset, type ResetState } from "./actions";

export default function RecoverPage() {
  const [state, action, pending] = useActionState<ResetState, FormData>(requestReset, {});

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
        <Link href="/login" className="text-sm text-stone-500">
          ← Voltar
        </Link>
        <div className="mt-4">
          <p className="text-lg font-bold text-stone-900">{APP_NAME}</p>
          <p className="text-sm text-stone-500">{APP_TAGLINE}</p>
        </div>
        <h1 className="mt-5 text-2xl font-bold text-stone-900">Recuperar senha</h1>
        <p className="mt-2 text-sm text-stone-600">
          Informe o seu e-mail e enviaremos um link para você criar uma nova senha.
        </p>
        <form action={action} className="mt-6 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
            E-mail
            <input name="email" type="email" required autoComplete="email" className="field" />
          </label>
          {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
          {state.message ? <p className="text-sm text-emerald-700">{state.message}</p> : null}
          <button type="submit" disabled={pending} className="btn-primary mt-2">
            {pending ? "Enviando..." : "Enviar link"}
          </button>
        </form>
      </div>
    </main>
  );
}
