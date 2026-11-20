import Link from "next/link";
import { ModelThumb } from "@/components/page-view/ModelThumb";
import type { PageDoc } from "@/lib/page/schema";
import { TEMPLATES } from "@/lib/page/templates";
import { AuthForm } from "./AuthForm";

// The models shown in the side panel.
const SHOWN: [string, string][] = [
  ["bf-loja", "Loja Vibe"],
  ["resto-casa", "Casa Noma"],
  ["presenca", "Marina Alves"],
];

// What the product does, in place of testimonials (there are none to quote yet).
const NOTES: [string, string][] = [
  ["Modelos prontos", "Cardápio, loja e serviços desenhados. Você troca as informações e publica."],
  ["Veja quem clica", "Visitas e cliques por botão, link e rede social, direto no painel."],
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ criar?: string; mode?: string }>;
}) {
  const sp = await searchParams;
  // The "Criar grátis" buttons link to /login?criar, so the page opens straight
  // on the sign-up view.
  const initialMode: "signin" | "signup" = sp.criar !== undefined || sp.mode === "signup" ? "signup" : "signin";

  // Real models, built here so the browser draws exactly what the server sent.
  const models = SHOWN.map(([id, name]) => TEMPLATES.find((t) => t.id === id)?.build(name)).filter((doc): doc is PageDoc => !!doc);

  return (
    <main className="flex min-h-screen bg-white">
      {/* Left: the form */}
      <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-12 lg:w-[46%]">
        <div className="mx-auto w-full max-w-sm">
          <AuthForm initialMode={initialMode} />
          <p className="mt-6 text-center text-sm text-stone-600">
            <Link href="/precos" className="font-semibold text-stone-900 underline underline-offset-4">
              Ver planos e preços
            </Link>
          </p>
        </div>
      </div>

      {/* Right: a framed panel with real models and what the product does */}
      <div className="hidden flex-1 p-3 lg:block">
        <div className="relative h-full min-h-[620px] overflow-hidden rounded-[28px] bg-[#0b0c20]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_30%,rgba(58,85,245,0.45),transparent_70%)]" />
          <div aria-hidden className="absolute left-1/2 top-[-6%] flex -translate-x-1/2 -rotate-6 gap-5">
            {models.map((doc, i) => (
              <div key={i} className={`overflow-hidden rounded-[26px] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/15 ${i === 1 ? "mt-0" : "mt-24"}`}>
                <ModelThumb doc={doc} width={230} height={480} />
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-[#0b0c20] via-[#0b0c20]/80 to-transparent" />

          <div className="absolute inset-x-5 bottom-5 grid grid-cols-2 gap-3">
            {NOTES.map(([title, text]) => (
              <div key={title} className="rounded-[18px] border border-white/15 bg-white/[0.08] p-4 text-white backdrop-blur-md">
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
