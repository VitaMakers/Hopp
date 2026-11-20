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
  const [show, setShow] = useState(false);
  const field =
    "h-12 w-full rounded-[12px] border border-[#E5E2DA] bg-[#F7F6F2] px-3.5 text-[15px] font-normal text-stone-900 outline-none transition-colors placeholder:text-stone-500 focus:border-stone-900 focus:bg-white";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-stone-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand-mark.png" alt="" className="h-7 w-auto" />
          {APP_NAME}
        </Link>
        <Link href="/" className="text-sm text-stone-600 hover:text-stone-900">
          ← Voltar
        </Link>
      </div>

      <h1 className="mt-12 font-display text-[40px] font-semibold leading-none tracking-[-0.035em] text-stone-900">
        {mode === "signin" ? "Boas-vindas" : "Crie sua conta grátis"}
      </h1>
      <p className="mt-3 text-[15px] text-stone-600">
        {mode === "signin" ? "Entre na sua conta e continue de onde parou." : "Uma página com tudo o que você faz, pronta em minutos."}
      </p>

      <form action={mode === "signin" ? signInAction : signUpAction} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
          E-mail
          <input name="email" type="email" required autoComplete="email" placeholder="Digite seu e-mail" className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
          Senha
          <span className="relative">
            <input
              name="password"
              type={show ? "text" : "password"}
              required
              minLength={mode === "signup" ? 8 : undefined}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              placeholder={mode === "signup" ? "Mínimo de 8 caracteres" : "Digite sua senha"}
              className={`${field} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Esconder a senha" : "Mostrar a senha"}
              aria-pressed={show}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-stone-600 transition-colors hover:text-stone-900"
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
                {show ? <path d="M4 4l16 16" /> : null}
              </svg>
            </button>
          </span>
        </label>
        {mode === "signin" ? (
          <Link href="/recuperar-senha" className="-mt-1 self-end text-[13px] font-semibold text-blue-600 hover:text-blue-700">
            Esqueci a senha
          </Link>
        ) : null}
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.message ? <p className="text-sm text-emerald-700">{state.message}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-1 inline-flex h-12 items-center justify-center rounded-[12px] bg-stone-900 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-stone-800 disabled:opacity-60"
        >
          {pending ? "Aguarde..." : mode === "signin" ? "Entrar" : "Criar conta grátis"}
        </button>
      </form>

      <div className="mt-7 border-t border-[#EFEDE7] pt-5 text-center text-sm text-stone-600">
        {mode === "signin" ? (
          <>
            Novo por aqui?{" "}
            <button type="button" onClick={() => setMode("signup")} className="font-semibold text-blue-600 hover:underline">
              Criar conta
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
