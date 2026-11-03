import { PageView } from "@/components/page-view/PageView";
import { TEMPLATES } from "@/lib/page/templates";
import type { PageDoc } from "@/lib/page/schema";
import { AuthForm } from "./AuthForm";

// A real model rendered inside the promo phone (right side), like the landing.
function heroDoc(): PageDoc | null {
  const template = TEMPLATES.find((t) => t.id === "bf-loja");
  return template ? template.build("Loja Vibe") : null;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ criar?: string; mode?: string }>;
}) {
  const sp = await searchParams;
  // The "Criar grátis" buttons link to /login?criar, so the page opens straight
  // on the sign-up view.
  const initialMode: "signin" | "signup" = sp.criar !== undefined || sp.mode === "signup" ? "signup" : "signin";
  const hero = heroDoc();

  return (
    <main className="flex min-h-screen bg-white">
      {/* Left: the form */}
      <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm">
          <AuthForm initialMode={initialMode} />
        </div>
      </div>

      {/* Right: colorful promo panel with a real model running in a phone */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 lg:flex lg:flex-col lg:items-center lg:justify-center">
        <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="relative z-10 px-12 text-center">
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-white">
            Uma página.<br />Todas as suas possibilidades.
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-sm text-blue-100">
            Monte sua página, atualize com as suas informações e acompanhe quem clica em quê.
          </p>
        </div>

        <div className="relative z-10 mt-10">
          <div className="relative rounded-[44px] bg-stone-900 p-2.5 shadow-2xl ring-1 ring-black/20">
            <div className="relative h-[460px] w-[230px] overflow-hidden rounded-[36px] bg-black">
              {hero ? (
                <div className="pointer-events-none absolute left-0 top-0" style={{ width: 230 }}>
                  <PageView doc={hero} still />
                </div>
              ) : null}
              <span className="absolute left-1/2 top-2.5 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
