import { AuthForm } from "./AuthForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ criar?: string; mode?: string }>;
}) {
  const sp = await searchParams;
  // The "Criar grátis" buttons link to /login?criar, so the page opens straight
  // on the sign-up view.
  const initialMode: "signin" | "signup" = sp.criar !== undefined || sp.mode === "signup" ? "signup" : "signin";

  const links = ["Meu portfólio", "Minha loja", "Fale no WhatsApp"];

  return (
    <main className="flex min-h-screen bg-white">
      {/* Left: the form */}
      <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm">
          <AuthForm initialMode={initialMode} />
        </div>
      </div>

      {/* Right: an original collage of floating cards (no phone) */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 lg:flex lg:items-center lg:justify-center">
        {/* soft colored glows */}
        <div className="pointer-events-none absolute -left-24 -top-16 h-80 w-80 rounded-full bg-sky-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-96 w-96 rounded-full bg-fuchsia-400/25 blur-3xl" />
        <div className="pointer-events-none absolute right-12 top-10 h-44 w-44 rounded-full bg-amber-300/20 blur-2xl" />

        <div className="relative h-[540px] w-[460px]">
          {/* Main profile card */}
          <div className="absolute left-1/2 top-1/2 w-72 -translate-x-1/2 -translate-y-1/2 -rotate-3 rounded-[28px] bg-white p-5 shadow-2xl ring-1 ring-black/5">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-bold text-white">
                MA
              </div>
              <div>
                <p className="text-base font-bold text-stone-900">Marina Alves</p>
                <p className="text-xs text-stone-500">Criadora &amp; Loja</p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2.5">
              {links.map((text) => (
                <div
                  key={text}
                  className="flex items-center justify-between rounded-full bg-stone-100 px-4 py-2.5 text-sm font-semibold text-stone-800"
                >
                  {text}
                  <span className="text-stone-400">›</span>
                </div>
              ))}
            </div>
          </div>

          {/* Handle pill */}
          <div className="absolute left-3 top-20 flex -rotate-6 items-center gap-1.5 rounded-full bg-white px-4 py-2 shadow-xl ring-1 ring-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand-mark.png" alt="" className="h-4 w-auto" />
            <span className="text-sm font-bold text-stone-900">/marina</span>
          </div>

          {/* Little message card */}
          <div className="absolute right-3 top-6 w-44 rotate-6 rounded-2xl bg-fuchsia-500 p-3 shadow-xl">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 shrink-0 rounded-full bg-white/30" />
              <div className="min-w-0 flex-1">
                <div className="h-2 w-20 rounded-full bg-white/80" />
                <div className="mt-1.5 h-2 w-12 rounded-full bg-white/50" />
              </div>
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-white" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
                <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
              </svg>
            </div>
          </div>

          {/* Media tile with a play button */}
          <div className="absolute bottom-8 right-8 flex h-28 w-36 rotate-3 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-xl">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow">
              <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5 text-orange-600" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </div>

          {/* Social badges */}
          <div className="absolute bottom-12 left-6 flex gap-2.5">
            {/* Instagram */}
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-900 text-white shadow-lg">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
                <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
              </svg>
            </span>
            {/* YouTube */}
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-900 text-white shadow-lg">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
                <rect x="3" y="6" width="18" height="12" rx="4" stroke="currentColor" strokeWidth="2" />
                <path d="M11 9.5v5l4-2.5z" fill="currentColor" />
              </svg>
            </span>
            {/* Music / TikTok */}
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-900 text-white shadow-lg">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
                <path d="M9 17a3 3 0 1 0 3 3V7c.7 1.6 2.2 2.7 4 2.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
