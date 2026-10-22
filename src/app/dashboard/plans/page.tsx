import { PLAN_LABEL, PLAN_PRICE_BRL, PLANS, normalizePlan, type Plan } from "@/lib/plans";
import { getOwner } from "../context";

// What each tier includes, shown on the pricing cards.
const FEATURES: Record<Plan, string[]> = {
  free: [
    "Página publicada no ar",
    "Modelos essenciais (básicos)",
    "Estatísticas básicas",
    "1 link curto",
    "Selo “Feito com Hopp”",
  ],
  essencial: [
    "Tudo do Grátis",
    "Sem o selo “Feito com Hopp”",
    "Todos os modelos essenciais",
    "Estatísticas completas",
    "Links curtos ilimitados",
  ],
  profissional: [
    "Tudo do Essencial",
    "Modelos Premium",
    "Capa em vídeo e grade de vídeos",
    "Vender com pagamento (Stripe)",
    "Prioridade no suporte",
  ],
};

const TAGLINE: Record<Plan, string> = {
  free: "Para começar e publicar sua página.",
  essencial: "Sua marca sem o selo, com tudo o que precisa.",
  profissional: "Para quem leva a presença digital a sério.",
};

// The tier highlighted as the recommended choice.
const RECOMMENDED: Plan = "essencial";

export default async function PlansPage() {
  const { profile } = await getOwner();
  const current = normalizePlan(profile.plan);
  const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Planos</h1>
        <p className="text-sm text-stone-500">Escolha o plano ideal para a sua página. Você pode mudar quando quiser.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = plan === current;
          const recommended = plan === RECOMMENDED;
          const price = PLAN_PRICE_BRL[plan];
          return (
            <section
              key={plan}
              className={`relative flex flex-col rounded-2xl bg-white p-5 ring-1 ${recommended ? "ring-2 ring-stone-900" : "ring-stone-200"}`}
            >
              {recommended ? (
                <span className="absolute -top-2.5 left-5 rounded-full bg-stone-900 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                  Mais popular
                </span>
              ) : null}

              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{PLAN_LABEL[plan]}</h2>
                {isCurrent ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Plano atual</span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-stone-500">{TAGLINE[plan]}</p>

              <p className="mt-4">
                <span className="text-3xl font-bold tabular-nums">{price ? brl(price) : "Grátis"}</span>
                {price ? <span className="text-sm text-stone-500">/mês</span> : null}
              </p>

              <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm">
                {FEATURES[plan].map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true">
                      <path fill="currentColor" d="M8.2 13.3 4.9 10l-1.1 1.1 4.4 4.4 8-8-1.1-1.1z" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5">
                {isCurrent ? (
                  <button type="button" disabled className="w-full rounded-lg bg-stone-100 py-2.5 text-sm font-semibold text-stone-500">
                    Seu plano atual
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    title="A cobrança via Stripe entra em breve"
                    className={`w-full rounded-lg py-2.5 text-sm font-semibold ${recommended ? "bg-stone-900 text-white opacity-60" : "bg-stone-100 text-stone-600"}`}
                  >
                    {price ? "Assinar" : "Usar o Grátis"} · em breve
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <p className="text-center text-xs text-stone-400">
        O pagamento das assinaturas (Stripe) está a caminho. Por enquanto, esta tela mostra os planos; em breve dá para assinar e
        trocar de plano aqui mesmo.
      </p>
    </div>
  );
}
