import Link from "next/link";
import { APP_NAME } from "@/lib/env";
import { formatBRL } from "@/lib/plans";
import { normalizePlan, type Plan } from "@/lib/plans";
import { PLAN_FEATURES, PLAN_LABEL, PLAN_ORDER, PLAN_PITCH, PLAN_PRICE_BRL } from "@/lib/plan-features";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: `Planos e preços — ${APP_NAME}`,
  description: "Compare os planos Grátis, Essencial e Profissional: modelos premium, vídeo, métricas, formulários e selo verificado.",
};

// Public pricing page. Logged-in visitors get a direct "subscribe" button that
// reuses the existing Stripe checkout for their own page; everyone else is sent
// to sign up first.
export default async function PrecosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profileId: string | null = null;
  let currentPlan: Plan = "free";
  let loggedIn = false;
  if (user) {
    loggedIn = true;
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, plan")
      .eq("account_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (profile) {
      profileId = profile.id as string;
      currentPlan = normalizePlan(profile.plan as string);
    }
  }

  // Where each plan's button goes.
  function cta(plan: Plan): { href: string; label: string; disabled?: boolean } {
    if (loggedIn && currentPlan === plan) return { href: "#", label: "Seu plano atual", disabled: true };
    // Already paying: switching plans goes through the confirmation in Planos.
    if (loggedIn && plan !== "free" && currentPlan !== "free") return { href: `/dashboard/plans?trocar=${plan}`, label: `Trocar para o ${PLAN_LABEL[plan]}` };
    if (plan === "free") {
      return loggedIn
        ? { href: "/dashboard", label: "Ir para o painel" }
        : { href: "/login?criar=1", label: "Criar conta grátis" };
    }
    // Paid: logged-in users go straight to checkout for their own page.
    if (loggedIn && profileId) return { href: `/dashboard/clientes/${profileId}/assinar?plan=${plan}`, label: `Assinar ${PLAN_LABEL[plan]}` };
    return { href: "/login?criar=1", label: `Criar conta e assinar` };
  }

  const cell = (v: boolean | string) =>
    typeof v === "string" ? (
      <span className="text-sm font-medium text-stone-700">{v}</span>
    ) : v ? (
      <span className="text-emerald-600" aria-label="Incluído">✓</span>
    ) : (
      <span className="text-stone-300" aria-label="Não incluído">—</span>
    );

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-12">
      <div className="mx-auto w-full max-w-5xl">
        <header className="text-center">
          <Link href="/" className="text-sm font-semibold text-stone-500 hover:text-stone-900">
            {APP_NAME}
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-stone-900 sm:text-4xl">Escolha o seu plano</h1>
          <p className="mx-auto mt-3 max-w-xl text-stone-600">
            Comece grátis, sem cartão. O <strong>Essencial</strong> libera os modelos premium, vídeo e métricas completas. O <strong>Profissional</strong> soma formulários próprios, selo verificado e a página sem a marca Virtú.bio.
          </p>
        </header>

        {/* Plan cards */}
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PLAN_ORDER.map((plan) => {
            const featured = plan === "essencial";
            const c = cta(plan);
            return (
              <div
                key={plan}
                className={`relative flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ${featured ? "ring-2 ring-stone-900" : "ring-stone-200"}`}
              >
                {featured ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-stone-900 px-3 py-1 text-[11px] font-semibold text-white">
                    Preço de lançamento
                  </span>
                ) : null}
                <h2 className="text-lg font-bold text-stone-900">{PLAN_LABEL[plan]}</h2>
                <p className="mt-1 min-h-[40px] text-sm text-stone-500">{PLAN_PITCH[plan]}</p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-stone-900">
                    {plan === "free" ? "Grátis" : formatBRL(PLAN_PRICE_BRL[plan])}
                  </span>
                  {plan !== "free" ? <span className="text-sm text-stone-500">/mês</span> : null}
                </div>
                <ul className="mt-5 flex flex-1 flex-col gap-2.5 text-sm text-stone-700">
                  {PLAN_FEATURES.filter((f) => f[plan]).map((f) => (
                    <li key={f.label} className="flex items-start gap-2">
                      <span className="mt-0.5 text-emerald-600">✓</span>
                      <span>
                        {typeof f[plan] === "string" ? (
                          <>
                            {f.short ?? f.label}: <span className="text-stone-500">{String(f[plan]).toLowerCase()}</span>
                          </>
                        ) : (
                          f.label
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                {c.disabled ? (
                  <span className="mt-6 cursor-default rounded-lg bg-stone-100 py-2.5 text-center text-sm font-semibold text-stone-500">
                    {c.label}
                  </span>
                ) : (
                  <Link
                    href={c.href}
                    prefetch={false}
                    className={`mt-6 rounded-lg py-2.5 text-center text-sm font-semibold transition ${
                      featured ? "bg-stone-900 text-white hover:bg-stone-700" : "bg-white text-stone-900 ring-1 ring-stone-300 hover:ring-stone-900"
                    }`}
                  >
                    {c.label}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Full comparison */}
        <section className="mt-12 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
          <h2 className="border-b border-stone-100 px-5 py-4 text-lg font-bold text-stone-900">Comparar os planos</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="border-b border-stone-100 text-sm">
                  <th className="px-5 py-3 font-medium text-stone-500">Recurso</th>
                  {PLAN_ORDER.map((plan) => (
                    <th key={plan} className="px-3 py-3 text-center font-semibold text-stone-900">
                      {PLAN_LABEL[plan]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PLAN_FEATURES.map((f) => (
                  <tr key={f.label} className="border-b border-stone-50 last:border-0">
                    <td className="px-5 py-3 text-sm text-stone-700">{f.label}</td>
                    {PLAN_ORDER.map((plan) => (
                      <td key={plan} className="px-3 py-3 text-center">
                        {cell(f[plan])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-8 text-center text-sm text-stone-500">
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold text-stone-900 underline">
            Entrar
          </Link>.{" "}
          Você pode mudar de plano ou cancelar quando quiser.
        </p>
      </div>
    </main>
  );
}
