import Link from "next/link";
import { AuthForm } from "./AuthForm";

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

      {/* Right: a framed photograph, with what the product does over it */}
      <div className="hidden flex-1 p-3 lg:block">
        <div className="relative h-full min-h-[620px] overflow-hidden rounded-[28px] bg-[#0b1026]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/login-noite.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-[60%_center]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-[#060915]/85 to-transparent" />
          <div className="absolute inset-x-5 bottom-5 grid grid-cols-2 gap-3">
            {NOTES.map(([title, text]) => (
              <div key={title} className="rounded-[18px] border border-white/15 bg-[#0d1424]/70 p-4 text-white backdrop-blur-md">
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/80">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
