import Link from "next/link";
import { APP_NAME } from "@/lib/env";
import { formatBRL, PLAN_PRICE_BRL } from "@/lib/plans";
import { TEMPLATES } from "@/lib/page/templates";
import { PageView } from "@/components/page-view/PageView";
import type { PageDoc } from "@/lib/page/schema";
import { HeroStage } from "@/components/landing/HeroStage";
import { Tilt } from "@/components/landing/Tilt";
import { Tunnel } from "@/components/landing/Tunnel";

// Build a real model's page document so the landing shows it running inside a
// phone, not as a flat image.
function model(id: string, name: string): PageDoc | null {
  const template = TEMPLATES.find((t) => t.id === id);
  return template ? template.build(name) : null;
}

const unsplash = (photo: string) => `https://images.unsplash.com/photo-${photo}?auto=format&fit=crop&w=800&q=85`;

// The real-estate model, tweaked to play a video cover (placeholder clip —
// swapped for the owner's own property video in the editor).
function realEstate(): PageDoc | null {
  const doc = model("imobiliaria-4", "Imóveis Premium");
  if (!doc) return null;
  doc.profile.coverUrl = unsplash("1600585154340-be6161a56a0c");
  doc.profile.coverVideo = "https://videos.pexels.com/video-files/3773486/3773486-hd_1920_1080_30fps.mp4";
  return doc;
}

// The Ecossistema model with a video cover (placeholder clip).
function ecoVideo(): PageDoc | null {
  const doc = model("ecossistema", "João Mentor");
  if (!doc) return null;
  doc.profile.coverVideo = "https://videos.pexels.com/video-files/3254066/3254066-hd_1920_1080_25fps.mp4";
  return doc;
}

// The models that fly through the 3D corridor, in the order they appear.
const CORRIDOR: { id: string; name: string; label: string; make?: () => PageDoc | null }[] = [
  { id: "presenca", name: "Marina Alves", label: "Presença" },
  { id: "resto-casa", name: "Casa Noma", label: "Restaurante" },
  { id: "imobiliaria-4", name: "Imóveis Premium", label: "Imobiliária", make: realEstate },
  { id: "bf-loja", name: "Loja Vibe", label: "Loja" },
  { id: "ecossistema", name: "João Mentor", label: "Ecossistema", make: ecoVideo },
  { id: "resto-bar", name: "Bar Aurora", label: "Bar" },
  { id: "experiencia", name: "Dr. Lucas", label: "Experiência" },
  { id: "resto-bistro", name: "Bistrô Lume", label: "Bistrô" },
  { id: "autoridade", name: "Ana Prado", label: "Autoridade" },
  { id: "vitrine", name: "Studio Vitrine", label: "Vitrine" },
];

const PHONE: [string, string][] = [
  ["bf-loja", "Loja Black Friday"],
  ["ecossistema", "Sua Marca"],
  ["bf-lookbook", "Lookbook Black Friday"],
  ["bf-mosaico", "Mosaico Black Friday"],
  ["bf-drop", "Drop Único Black Friday"],
];

const FEATURES: [string, string][] = [
  ["Tudo em um link só", "Links, vídeos, música, agenda e botão de WhatsApp numa página só."],
  ["Modelos desenhados", "Do básico ao premium, prontos para a sua marca. Você só troca as informações."],
  ["Veja quem clica", "Visitas e cliques por botão, link e rede social, sem planilha."],
  ["Formulários próprios", "Reserva, orçamento ou inscrição com as suas perguntas e as respostas no painel."],
];

const INSIDE = ["Links", "Vídeos", "Cardápio", "Agenda", "WhatsApp", "Formulários", "Estatísticas", "Links curtos"];

const PLANS = [
  { name: "Grátis", price: "R$ 0", tag: "Para começar", feats: ["Página no ar", "Modelos essenciais", "Contagem de visitas"], highlight: false },
  { name: "Essencial", price: formatBRL(PLAN_PRICE_BRL.essencial), tag: "Para crescer", feats: ["Modelos premium exclusivos", "Vídeo de capa e métricas completas", "Links curtos ilimitados"], highlight: true },
  { name: "Profissional", price: formatBRL(PLAN_PRICE_BRL.profissional), tag: "Completo", feats: ["Tudo do Essencial", "Formulários com respostas no painel", "Selo verificado, sem a marca Virtú.bio"], highlight: false },
];

export default function Home() {
  // The models that take turns on the phone in the hero, each scrolling slowly.
  const phone = PHONE.map(([id, name]) => model(id, name)).filter((doc): doc is PageDoc => doc !== null);
  const cards = CORRIDOR.map((c) => ({ ...c, doc: c.make ? c.make() : model(c.id, c.name) }))
    .filter((c) => c.doc)
    .map((c) => ({
      id: c.id,
      label: c.label,
      node: (
        <div>
          <PageView doc={c.doc as PageDoc} still />
        </div>
      ),
    }));

  return (
    <main className="min-h-screen bg-white text-stone-900">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-40">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-4">
          <span className="flex items-center gap-2 font-display text-[22px] font-bold tracking-[-0.02em]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand-mark.png" alt="" className="h-8 w-auto" />
            {APP_NAME}
          </span>
          <nav className="hidden items-center gap-8 text-sm font-medium text-stone-600 md:flex">
            <a href="#modelos" className="transition-colors hover:text-stone-900">Modelos</a>
            <a href="#recursos" className="transition-colors hover:text-stone-900">Recursos</a>
            <a href="#planos" className="transition-colors hover:text-stone-900">Planos</a>
          </nav>
          <div className="flex items-center gap-1.5">
            <Link href="/login" className="rounded-full px-3.5 py-2 text-sm font-semibold text-stone-700 transition-colors hover:text-stone-900">
              Entrar
            </Link>
            <Link href="/login?criar" className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.03]">
              Criar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero: white, with the page scrolling inside the phone in the photo */}
      <section className="relative flex flex-col overflow-hidden bg-white lg:min-h-[100svh] lg:justify-center">
        <div className="relative z-10 mx-auto w-full max-w-[1240px] px-5 pb-4 pt-28 lg:pb-28 lg:pt-32">
          <div className="max-w-[560px] border-stone-200 lg:border-l lg:pl-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-700">
              Seu link na bio, do seu jeito
              <span aria-hidden>→</span>
            </span>
            <h1 className="mt-6 font-display text-[42px] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-[68px]">
              Uma página.
              <br />
              <span className="text-blue-600">Todas as suas</span> possibilidades.
            </h1>
            <p className="mt-6 max-w-[420px] text-base leading-relaxed text-stone-600 sm:text-lg">
              Monte em minutos uma página com tudo o que você faz e acompanhe quem clica em quê.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/login?criar" className="inline-flex h-12 items-center rounded-full bg-blue-600 px-7 text-[15px] font-semibold text-white transition-colors hover:bg-blue-700">
                Criar minha página grátis
              </Link>
              <a href="#planos" className="inline-flex h-12 items-center rounded-full border border-stone-300 px-6 text-[15px] font-semibold text-stone-800 transition-colors hover:bg-stone-100">
                Ver planos
              </a>
            </div>
            <p className="mt-4 text-xs text-stone-600">Grátis para começar, sem cartão de crédito.</p>
          </div>
        </div>

        <HeroStage>
          {phone.map((doc, i) => (
            <div key={i} className="hero-cycle" style={{ "--i": i, "--n": phone.length } as React.CSSProperties}>
              <div style={{ width: 390 }} className="pointer-events-none">
                <PageView doc={doc} still />
              </div>
            </div>
          ))}
        </HeroStage>

        {/* What goes inside a page, scrolling sideways without stopping */}
        <div className="relative z-10 w-full border-t border-stone-200 bg-white lg:absolute lg:inset-x-0 lg:bottom-0">
          <div className="marquee py-5 text-[13px] font-semibold tracking-wide text-stone-600">
            {[0, 1].map((copy) => (
              <ul key={copy} aria-hidden={copy === 1} className="marquee-track">
                {[...INSIDE, ...INSIDE].map((item, i) => (
                  <li key={i} className="flex items-center gap-12">
                    {item}
                    <span aria-hidden className="h-1 w-1 rounded-full bg-blue-600" />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </section>

      {/* Models: a 3D corridor that moves as the page scrolls */}
      <Tunnel cards={cards}>
        <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/60">Modelos prontos</p>
        <h2 className="mt-4 font-display text-[44px] font-bold leading-[0.98] tracking-[-0.04em] sm:text-7xl lg:text-[88px]">
          Escolha
          <br />o seu link.
        </h2>
        <p className="mx-auto mt-5 max-w-sm text-sm text-white/70 sm:text-base">
          Atualize com suas informações e mude como as pessoas olham a sua empresa.
        </p>
      </Tunnel>

      {/* Features */}
      <section id="recursos" className="mx-auto max-w-[1240px] px-5 py-20 lg:py-28">
        <h2 className="max-w-xl font-display text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-[44px]">
          Tudo o que a sua bio precisa, num lugar só.
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(([title, text], i) => (
            <Tilt key={title} className="rounded-[20px] border border-stone-200 bg-white p-6">
              <span className="font-mono text-[11px] tracking-[0.2em] text-stone-500">0{i + 1}</span>
              <h3 className="mt-8 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{text}</p>
            </Tilt>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section id="planos" className="mx-auto max-w-[1240px] px-5 pb-20 lg:pb-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-[-0.03em] sm:text-[44px]">Planos simples</h2>
          <p className="mt-3 text-base text-stone-600">Comece grátis, sem cartão. Evolua quando quiser.</p>
        </div>
        <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-3">
          {PLANS.map((p) => (
            <Tilt key={p.name} className={`flex flex-col rounded-[22px] p-7 ${p.highlight ? "bg-stone-900 text-white" : "border border-stone-200 bg-white"}`}>
              {p.highlight ? <span className="absolute -top-3 left-7 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-semibold text-white">Preço de lançamento</span> : null}
              <span className={`text-xs font-semibold ${p.highlight ? "text-stone-300" : "text-stone-600"}`}>{p.tag}</span>
              <h3 className="mt-1 text-lg font-bold">{p.name}</h3>
              <p className="mt-3">
                <span className="font-display text-4xl font-bold tracking-[-0.03em]">{p.price}</span>
                {p.price !== "R$ 0" ? <span className={p.highlight ? "text-stone-300" : "text-stone-600"}>/mês</span> : null}
              </p>
              <ul className={`mt-5 flex flex-1 flex-col gap-2.5 text-sm ${p.highlight ? "text-stone-200" : "text-stone-700"}`}>
                {p.feats.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className={p.highlight ? "text-blue-500" : "text-blue-600"}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href={p.price === "R$ 0" ? "/login?criar" : "/precos"}
                className={`mt-7 rounded-full py-3 text-center text-sm font-semibold transition-colors ${p.highlight ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-stone-100 text-stone-900 hover:bg-stone-200"}`}
              >
                {p.price === "R$ 0" ? "Criar grátis" : "Assinar"}
              </Link>
            </Tilt>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 pb-20">
        <div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[32px] bg-[#0b0c20] px-6 py-20 text-center text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_90%_at_50%_100%,rgba(58,85,245,0.45),transparent_70%)]" />
          <h2 className="relative font-display text-4xl font-semibold tracking-[-0.03em] sm:text-6xl">Sua página no ar hoje.</h2>
          <p className="relative mx-auto mt-4 max-w-md text-white/70">Leva minutos. Escolha um modelo, personalize e compartilhe.</p>
          <Link href="/login?criar" className="relative mt-8 inline-flex h-12 items-center rounded-full bg-white px-7 text-[15px] font-semibold text-[#0b0c20] transition-transform hover:scale-[1.03]">
            Criar minha página grátis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-stone-600 sm:flex-row">
          <span className="flex items-center gap-2 text-base font-bold text-stone-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand-mark.png" alt="" className="h-6 w-auto" />
            {APP_NAME}
          </span>
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
