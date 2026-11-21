import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/env";
import type { PageDoc } from "@/lib/page/schema";
import { TEMPLATES } from "@/lib/page/templates";
import { AuthForm } from "./AuthForm";
import { Showcase } from "./Showcase";

// The premium models shown in the side panel: left, middle, right.
const SHOWN: [string, string, string][] = [
  ["resto-menu", "Casa Noma", "Restaurante"],
  ["presenca", "Marina Alves", "Presença"],
  ["bf-lookbook", "Loja Vibe", "Lookbook"],
];

// What the product does, in place of testimonials (there are none to quote yet).
const NOTES: [string, string][] = [
  ["Modelos prontos", "Cardápio, loja e serviços desenhados. Você troca as informações e publica."],
  ["Veja quem clica", "Visitas e cliques por botão, link e rede social, direto no painel."],
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ criar?: string; mode?: string; erro?: string }>;
}) {
  const sp = await searchParams;
  // The "Criar grátis" buttons link to /login?criar, so the page opens straight
  // on the sign-up view.
  const initialMode: "signin" | "signup" = sp.criar !== undefined || sp.mode === "signup" ? "signup" : "signin";

  // Real models, built here so the browser draws exactly what the server sent.
  const models = SHOWN.flatMap(([id, name, label]) => {
    const doc = TEMPLATES.find((t) => t.id === id)?.build(name) as PageDoc | undefined;
    return doc ? [{ doc, label }] : [];
  });

  return (
    <main className="flex min-h-screen bg-white">
      {/* Left: the form */}
      <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-12 lg:w-[46%]">
        <div className="mx-auto w-full max-w-sm">
          <AuthForm initialMode={initialMode} linkFailed={sp.erro === "link"} />
          <p className="mt-6 text-center text-sm text-stone-600">
            <Link href="/precos" className="font-semibold text-stone-900 underline underline-offset-4">
              Ver planos e preços
            </Link>
          </p>
        </div>
      </div>

      {/* Right: two premium models, upright and whole, with the brand */}
      <div className="hidden flex-1 p-3 lg:block">
        <div className="relative flex h-full min-h-[620px] flex-col overflow-hidden rounded-[28px] bg-[#080A1C] p-7 text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_42%,rgba(58,85,245,0.55),transparent_70%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_30%_at_78%_20%,rgba(139,92,246,0.35),transparent_70%)]" />

          <div className="relative flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand-mark.png" alt="" className="h-8 w-auto brightness-0 invert" />
            <span className="text-[22px] font-extrabold tracking-tight">{APP_NAME}</span>
          </div>

          {/* The stage keeps a height that follows the window, so the models
              always fit whole above the text. */}
          <div aria-hidden className="relative my-auto" style={{ height: "clamp(180px, calc(100vh - 430px), 490px)" }}>
            <Showcase models={models} />
          </div>

          <p className="relative max-w-[440px] font-display text-[32px] font-semibold leading-[1.1] tracking-[-0.03em]">{APP_TAGLINE}</p>
          <div className="relative mt-5 grid grid-cols-2 gap-3">
            {NOTES.map(([title, text]) => (
              <div key={title} className="rounded-[18px] border border-white/15 bg-white/[0.07] p-4 backdrop-blur-md">
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/75">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
