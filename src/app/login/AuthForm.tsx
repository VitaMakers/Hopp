"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { APP_NAME } from "@/lib/env";
import { signIn, signUp, type AuthState } from "./actions";

export function AuthForm({ initialMode }: { initialMode: "signin" | "signup" }) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [signInState, signInAction, signingIn] = useActionState<AuthState, FormData>(signIn, {});
  const [signUpState, signUpAction, signingUp] = useActionState<AuthState, FormData>(signUp, {});
  const state = mode === "signin" ? signInState : signUpState;
  const pending = signingIn || signingUp;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-stone-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand-mark.png" alt="" className="h-7 w-auto" />
          {APP_NAME}
        </Link>
        <Link href="/" className="text-sm text-stone-400 hover:text-stone-600">
          ← Voltar
        </Link>
      </div>

      <h1 className="mt-10 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
        {mode === "signin" ? "Entre na sua conta" : "Crie sua conta grátis"}
      </h1>
      <p className="mt-2 text-sm text-stone-500">
        {mode === "signin"
          ? "Bom te ver de novo. Entre para editar a sua página."
          : "Uma página com tudo o que você faz — pronta em minutos."}
      </p>

      <form action={mode === "signin" ? signInAction : signUpAction} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
          E-mail
          <input name="email" type="email" required autoComplete="email" placeholder="voce@email.com" className="field" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
          Senha
          <input
            name="password"
            type="password"
            required
            minLength={mode === "signup" ? 8 : undefined}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder={mode === "signup" ? "Mínimo de 8 caracteres" : "Sua senha"}
            className="field"
          />
        </label>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.message ? <p className="text-sm text-emerald-700">{state.message}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-1 inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "Aguarde..." : mode === "signin" ? "Entrar" : "Criar conta grátis"}
        </button>
      </form>

      {mode === "signin" ? (
        <Link href="/recuperar-senha" className="mt-4 block text-sm text-stone-500 underline">
          Esqueci minha senha
        </Link>
      ) : null}

      <div className="mt-8 border-t border-stone-100 pt-5 text-sm text-stone-600">
        {mode === "signin" ? (
          <>
            Não tem conta?{" "}
            <button type="button" onClick={() => setMode("signup")} className="font-semibold text-blue-600 hover:underline">
              Crie grátis
            </button>
          </>
        ) : (
          <>
            Já tem uma conta?{" "}
            <button type="button" onClick={() => setMode("signin")} className="font-semibold text-blue-600 hover:underline">
              Entrar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
