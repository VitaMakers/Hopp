import Link from "next/link";
import { APP_NAME } from "@/lib/env";
import { TEMPLATES } from "@/lib/page/templates";
import { PageView } from "@/components/page-view/PageView";
import { ModelThumb } from "@/components/page-view/ModelThumb";
import type { PageDoc } from "@/lib/page/schema";

// Build a real model's page document so the landing can show it running
// inside a phone, not as a flat image.
function model(id: string, name: string): PageDoc | null {
  const template = TEMPLATES.find((t) => t.id === id);
  return template ? template.build(name) : null;
}

// A mix of essential and premium models, fanned out to show the variety.
const FAN: { id: string; name: string }[] = [
  { id: "resto-casa", name: "Casa Noma" },
  { id: "beleza", name: "Studio Bella" },
  { id: "autoridade", name: "João Mentor" },
  { id: "comida", name: "Cantina" },
  { id: "resto-bistro", name: "Brasa" },
  { id: "criativo", name: "Lab Criativo" },
  { id: "musica", name: "DJ Noite" },
];

const FEATURES: [string, string][] = [
  ["Tudo em um link só", "Links, vídeos, música, formulários, agenda e botão de WhatsApp numa página só."],
  ["Modelos lindos", "Dezenas de modelos prontos — do básico ao premium — para combinar com a sua marca."],
  ["Veja quem clica", "Estatísticas de visitas e cliques por botão, link e rede social."],
  ["Receba pagamentos", "Conecte o Stripe e venda direto pela sua página."],
];

export default function Home() {
  const hero = model("bf-loja", "Loja Vibe");
  const fan = FAN.map((f) => ({ ...f, doc: model(f.id, f.name) })).filter((f) => f.doc);
  const center = Math.floor(fan.length / 2);

  return (
    <main className="min-h-screen bg-white text-stone-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-stone-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <span className="flex items-center gap-2 text-lg font-bold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500 text-sm text-white">V</span>
            {APP_NAME}
          </span>
          <nav className="hidden items-center gap-7 text-sm font-medium text-stone-600 md:flex">
            <a href="#recursos" className="hover:text-stone-900">Recursos</a>
            <a href="#modelos" className="hover:text-stone-900">Modelos</a>
            <a href="#planos" className="hover:text-stone-900">Planos</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100">
              Entrar
            </Link>
            <Link href="/login" className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600">
              Criar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-10 pt-12 md:grid-cols-2 md:pb-16 md:pt-20">
        <div className="text-center md:text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Seu link na bio, do seu jeito
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Uma página.<br />
            <span className="text-emerald-600">Todas as suas</span> possibilidades.
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base text-stone-500 sm:text-lg md:mx-0">
            Monte em minutos uma página com tudo o que você faz e acompanhe quem clica em quê.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row md:justify-start">
            <Link href="/login" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-emerald-600 sm:w-auto">
              Criar minha página grátis <span aria-hidden>→</span>
            </Link>
            <a href="#planos" className="inline-flex w-full items-center justify-center rounded-xl border border-stone-200 px-6 py-3.5 text-base font-semibold text-stone-700 transition hover:bg-stone-50 sm:w-auto">
              Ver planos
            </a>
          </div>
          <p className="mt-4 text-xs text-stone-400">Grátis para começar · sem cartão de crédito</p>
        </div>

        {/* iPhone with a real premium model running inside */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[60px] bg-gradient-to-tr from-emerald-100 via-white to-stone-100 blur-2xl" />
            <div className="relative rounded-[48px] bg-stone-900 p-2.5 shadow-2xl ring-1 ring-black/10">
              <div className="relative h-[560px] w-[270px] overflow-hidden rounded-[40px] bg-black">
                {hero ? (
                  <div style={{ width: 390, transformOrigin: "top left", transform: `scale(${270 / 390})` }} className="pointer-events-none">
                    <PageView doc={hero} still />
                  </div>
                ) : null}
                <span className="absolute left-1/2 top-3 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section id="recursos" className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(([title, text]) => (
            <div key={title} className="rounded-2xl bg-stone-50 p-5 ring-1 ring-stone-100">
              <h3 className="font-bold">{title}</h3>
              <p className="mt-1.5 text-sm text-stone-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Models showcase */}
      <section id="modelos" className="overflow-hidden px-5 py-14">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Escolha o seu <span className="text-emerald-600">link</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-stone-500 sm:text-lg">
            Atualize com suas informações e mude como as pessoas olham a sua empresa.
          </p>
        </div>

        <div className="mt-12 flex items-end justify-start gap-3 overflow-x-auto pb-6 md:justify-center md:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none]">
          {fan.map((item, index) => {
            const offset = index - center;
            const isCenter = index === center;
            return (
              <div
                key={item.id}
                className="shrink-0 transition"
                style={{
                  transform: `rotate(${offset * 5}deg) translateY(${Math.abs(offset) * 14}px)`,
                  zIndex: isCenter ? 10 : 10 - Math.abs(offset),
                }}
              >
                <div className={isCenter ? "rounded-[22px] shadow-2xl ring-1 ring-black/10" : "rounded-[20px] shadow-xl ring-1 ring-black/5"}>
                  <ModelThumb doc={item.doc as PageDoc} width={isCenter ? 168 : 146} height={isCenter ? 342 : 298} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-stone-700">
            Começar com um modelo <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* Plans */}
      <section id="planos" className="mx-auto max-w-6xl px-5 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Planos simples</h2>
          <p className="mt-3 text-base text-stone-500">Comece grátis e evolua quando quiser.</p>
        </div>
        <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-3">
          {[
            { name: "Grátis", price: "R$ 0", tag: "Para começar", feats: ["Página no ar", "Modelos essenciais", "Estatísticas básicas"], highlight: false },
            { name: "Essencial", price: "R$ 9,90", tag: "Sem o selo", feats: ["Tudo do Grátis", "Sem o selo Virtú.bio", "Estatísticas completas"], highlight: true },
            { name: "Profissional", price: "R$ 29,90", tag: "Mais recursos", feats: ["Tudo do Essencial", "Modelos Premium", "Vender com Stripe"], highlight: false },
          ].map((p) => (
            <div key={p.name} className={`relative flex flex-col rounded-2xl p-6 ${p.highlight ? "bg-stone-900 text-white ring-2 ring-stone-900" : "bg-white ring-1 ring-stone-200"}`}>
              {p.highlight ? <span className="absolute -top-2.5 left-6 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-semibold text-white">Mais popular</span> : null}
              <span className={`text-xs font-semibold uppercase tracking-wide ${p.highlight ? "text-stone-300" : "text-stone-400"}`}>{p.tag}</span>
              <h3 className="mt-1 text-lg font-bold">{p.name}</h3>
              <p className="mt-2"><span className="text-3xl font-extrabold">{p.price}</span>{p.price !== "R$ 0" ? <span className={p.highlight ? "text-stone-300" : "text-stone-400"}>/mês</span> : null}</p>
              <ul className={`mt-4 flex flex-1 flex-col gap-2 text-sm ${p.highlight ? "text-stone-200" : "text-stone-600"}`}>
                {p.feats.map((f) => (
                  <li key={f} className="flex items-start gap-2"><span className="text-emerald-500">✓</span> {f}</li>
                ))}
              </ul>
              <Link href="/login" className={`mt-6 rounded-lg py-2.5 text-center text-sm font-semibold ${p.highlight ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-stone-100 text-stone-800 hover:bg-stone-200"}`}>
                {p.price === "R$ 0" ? "Criar grátis" : "Assinar"}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 pb-16 pt-4">
        <div className="mx-auto max-w-5xl rounded-3xl bg-stone-900 px-6 py-14 text-center text-white">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Sua página no ar hoje.</h2>
          <p className="mx-auto mt-3 max-w-md text-stone-300">Leva minutos. Escolha um modelo, personalize e compartilhe.</p>
          <Link href="/login" className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 text-base font-semibold text-white transition hover:bg-emerald-600">
            Criar minha página grátis <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-stone-500 sm:flex-row">
          <span className="font-bold text-stone-900">{APP_NAME}</span>
          <nav className="flex gap-5">
            <Link href="/termos" className="hover:text-stone-900">Termos</Link>
            <Link href="/privacidade" className="hover:text-stone-900">Privacidade</Link>
            <Link href="/login" className="hover:text-stone-900">Entrar</Link>
          </nav>
          <span>© {new Date().getFullYear()} {APP_NAME}</span>
        </div>
      </footer>
    </main>
  );
}
