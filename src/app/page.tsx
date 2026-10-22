import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/env";

const FEATURES = [
  ["Tudo em um link", "Links, vídeos, músicas, perguntas frequentes e contagem regressiva numa página só."],
  ["Do seu jeito", "Temas prontos, cores, fontes e botões para combinar com a sua marca."],
  ["Capte contatos", "Formulário de e-mail e WhatsApp com exportação para planilha."],
  ["Links curtos", "Links rastreáveis para divulgar em qualquer lugar."],
  ["Estatísticas", "Visitas e cliques por bloco, por rede social e por link."],
  ["Receba pagamentos", "Conecte o Stripe e venda direto pela sua página."],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <span className="text-lg font-bold">{APP_NAME}</span>
        <Link href="/login" className="text-sm font-medium underline">
          Entrar
        </Link>
      </header>
      <section className="mx-auto max-w-3xl px-5 pb-16 pt-12 text-center">
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl">{APP_TAGLINE}</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-stone-600">
          Monte em minutos uma página com tudo o que você faz e acompanhe quem clica em quê.
        </p>
        <Link href="/login" className="btn-primary mt-8 inline-block px-6 py-3 text-base">
          Criar minha página grátis
        </Link>
      </section>
      <section className="mx-auto grid max-w-5xl gap-4 px-5 pb-20 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(([title, text]) => (
          <div key={title} className="rounded-xl bg-white p-5 ring-1 ring-stone-200">
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-stone-600">{text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
