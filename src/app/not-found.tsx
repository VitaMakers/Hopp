import Link from "next/link";
import { APP_NAME } from "@/lib/env";

export const metadata = { title: "Página não encontrada" };

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col bg-white px-6 py-8 text-stone-900">
      <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand-mark.png" alt="" className="h-7 w-auto" />
        {APP_NAME}
      </Link>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-16">
        <p className="text-sm font-semibold text-stone-500">Erro 404</p>
        <h1 className="mt-2 font-display text-[40px] font-semibold leading-[1.05] tracking-[-0.035em]">Esta página não existe.</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-stone-600">
          O endereço pode ter sido digitado errado, ou a página saiu do ar. Se você recebeu este link de alguém, peça o endereço de novo.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          <Link href="/" className="inline-flex h-11 items-center rounded-[12px] bg-stone-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-stone-800">
            Ir para o início
          </Link>
          <Link href="/login?criar" className="inline-flex h-11 items-center rounded-[12px] border border-[#E5E2DA] px-5 text-sm font-semibold transition-colors hover:border-stone-400">
            Criar a minha página
          </Link>
        </div>
      </div>
    </main>
  );
}
