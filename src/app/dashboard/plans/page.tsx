import Link from "next/link";
import { PLAN_FEATURES, PLAN_LABEL, PLAN_ORDER, PLAN_PITCH, PLAN_PRICE_BRL } from "@/lib/plan-features";
import { normalizePlan } from "@/lib/plans";
import { getOwner } from "../context";
import { CancelSubscriptionButton } from "../clientes/CancelSubscriptionButton";

// Built from the same list as the public pricing page (src/lib/plan-features),
// which mirrors what src/lib/entitlements enforces, so what is sold here is
// exactly what the client gets.
export default async function PlansPage({ searchParams }: { searchParams: Promise<{ trocar?: string; plano?: string }> }) {
  const { profile } = await getOwner();
  const current = normalizePlan(profile.plan);
  const paidNow = current !== "free";
  const { trocar, plano } = await searchParams;
  const switchTo = trocar ? normalizePlan(trocar) : null;
  const switched = plano ? normalizePlan(plano) : null;
  const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Planos</h1>
        <p className="text-sm text-stone-500">Comece grátis, sem cartão. Troque ou cancele quando quiser.</p>
      </div>

      {switched && switched !== "free" ? (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
          Pronto, seu plano agora é o {PLAN_LABEL[switched]}. A diferença de valor entra na próxima fatura.
        </p>
      ) : null}

      {switchTo && switchTo !== "free" && paidNow && switchTo !== current ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 ring-2 ring-stone-900">
          <p className="text-sm">
            Trocar do <strong>{PLAN_LABEL[current]}</strong> para o <strong>{PLAN_LABEL[switchTo]}</strong> ({brl(PLAN_PRICE_BRL[switchTo])}/mês)? A
            diferença é calculada pelos dias que faltam e entra na próxima fatura.
          </p>
          <div className="flex gap-2">
            <Link href="/dashboard/plans" className="rounded-lg px-4 py-2 text-sm font-semibold ring-1 ring-stone-300 hover:ring-stone-900">
              Cancelar
            </Link>
            <a
              href={`/dashboard/clientes/${profile.id}/assinar?plan=${switchTo}&confirmar=1`}
              className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
            >
              Confirmar troca
            </a>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {PLAN_ORDER.map((plan) => {
          const isCurrent = plan === current;
          const recommended = plan === "essencial";
          const price = PLAN_PRICE_BRL[plan];
          return (
            <section
              key={plan}
              className={`relative flex flex-col rounded-2xl bg-white p-5 ring-1 ${recommended ? "ring-2 ring-stone-900" : "ring-stone-200"}`}
            >
              {recommended ? (
                <span className="absolute -top-2.5 left-5 rounded-full bg-stone-900 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                  Preço de lançamento
                </span>
              ) : null}

              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{PLAN_LABEL[plan]}</h2>
                {isCurrent ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Plano atual</span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-stone-500">{PLAN_PITCH[plan]}</p>

              <p className="mt-4">
                <span className="text-3xl font-bold tabular-nums">{price ? brl(price) : "Grátis"}</span>
                {price ? <span className="text-sm text-stone-500">/mês</span> : null}
              </p>

              <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm">
                {PLAN_FEATURES.map((f) => {
                  const value = f[plan];
                  return (
                    <li key={f.label} className={`flex items-start gap-2 ${value ? "" : "text-stone-400"}`}>
                      <span className={`mt-0.5 w-4 shrink-0 text-center ${value ? "text-emerald-600" : ""}`} aria-hidden="true">
                        {value ? "✓" : "–"}
                      </span>
                      <span>
                        {typeof value === "string" ? (
                          <>
                            {f.short ?? f.label}: <span className="text-stone-500">{value.toLowerCase()}</span>
                          </>
                        ) : (
                          f.label
                        )}
                        {value ? null : <span className="sr-only"> (não incluído)</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-5">
                {isCurrent ? (
                  <button type="button" disabled className="w-full rounded-lg bg-stone-100 py-2.5 text-sm font-semibold text-stone-500">
                    Seu plano atual
                  </button>
                ) : price ? (
                  <a
                    href={paidNow ? `/dashboard/plans?trocar=${plan}` : `/dashboard/clientes/${profile.id}/assinar?plan=${plan}`}
                    className="block w-full rounded-lg bg-stone-900 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-stone-800"
                  >
                    {paidNow ? `Trocar para o ${PLAN_LABEL[plan]}` : `Assinar ${PLAN_LABEL[plan]}`}
                  </a>
                ) : (
                  // The current plan is paid; this is the free card: cancel to go back.
                  <div className="flex h-[42px] items-center justify-center rounded-lg bg-stone-50 ring-1 ring-stone-200">
                    <CancelSubscriptionButton clientId={profile.id} />
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <p className="text-center text-xs text-stone-400">
        Pagamento seguro via Stripe. Ao cancelar, o plano continua até o fim do período já pago.
      </p>
    </div>
  );
}
