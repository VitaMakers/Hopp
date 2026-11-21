"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col bg-white px-6 py-8 text-stone-900">
      <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand-mark.png" alt="" className="h-7 w-auto" />
        Início
      </Link>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-16">
        <h1 className="font-display text-[40px] font-semibold leading-[1.05] tracking-[-0.035em]">Algo deu errado ao abrir esta página.</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-stone-600">
          Nada foi perdido. Tente de novo; se continuar, volte daqui a alguns minutos.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          <button type="button" onClick={reset} className="inline-flex h-11 items-center rounded-[12px] bg-stone-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-stone-800">
            Tentar de novo
          </button>
          <Link href="/" className="inline-flex h-11 items-center rounded-[12px] border border-[#E5E2DA] px-5 text-sm font-semibold transition-colors hover:border-stone-400">
            Ir para o início
          </Link>
        </div>
      </div>
    </main>
  );
}
