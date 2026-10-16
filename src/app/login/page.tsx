"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "./actions";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInState, signInAction, signingIn] = useActionState<AuthState, FormData>(signIn, {});
  const [signUpState, signUpAction, signingUp] = useActionState<AuthState, FormData>(signUp, {});
  const state = mode === "signin" ? signInState : signUpState;
  const pending = signingIn || signingUp;

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
        <Link href="/" className="text-sm text-stone-500">
          ← Voltar
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-stone-900">
          {mode === "signin" ? "Entrar" : "Criar conta grátis"}
        </h1>
        <form action={mode === "signin" ? signInAction : signUpAction} className="mt-6 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
            E-mail
            <input name="email" type="email" required autoComplete="email" className="field" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
            Senha
            <input
              name="password"
              type="password"
              required
              minLength={mode === "signup" ? 8 : undefined}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="field"
            />
          </label>
          {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
          {state.message ? <p className="text-sm text-emerald-700">{state.message}</p> : null}
          <button type="submit" disabled={pending} className="btn-primary mt-2">
            {pending ? "Aguarde..." : mode === "signin" ? "Entrar" : "Criar conta"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-sm text-stone-600 underline"
        >
          {mode === "signin" ? "Não tem conta? Crie agora" : "Já tem conta? Entre"}
        </button>
      </div>
    </main>
  );
}
