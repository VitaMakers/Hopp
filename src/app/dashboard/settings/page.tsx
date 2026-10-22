import { getPaymentProvider, type AccountStatus } from "@/lib/payments";
import { PLAN_LABEL, normalizePlan } from "@/lib/plans";
import { getOwner } from "../context";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ payments?: string }>;
}) {
  const { profile, user } = await getOwner();
  const { payments } = await searchParams;

  let status: AccountStatus | null = null;
  let statusError = false;
  if (profile.stripe_account_id) {
    try {
      status = await getPaymentProvider().getAccountStatus(profile.stripe_account_id);
    } catch {
      statusError = true;
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <section className="rounded-xl bg-white p-5 ring-1 ring-stone-200">
        <h2 className="font-semibold">Conta</h2>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-stone-500">E-mail</dt>
          <dd>{user.email}</dd>
          <dt className="text-stone-500">Endereço</dt>
          <dd>/{profile.handle}</dd>
          <dt className="text-stone-500">Plano</dt>
          <dd>{PLAN_LABEL[normalizePlan(profile.plan)]}</dd>
        </dl>
      </section>

      <section className="rounded-xl bg-white p-5 ring-1 ring-stone-200">
        <h2 className="font-semibold">Receber pagamentos</h2>
        <p className="mt-1 text-sm text-stone-600">
          Conecte uma conta Stripe para vender pela sua página. O dinheiro das vendas cai direto na sua conta.
        </p>
        {payments === "error" || statusError ? (
          <p className="mt-3 text-sm text-red-600">Não foi possível falar com o Stripe. Tente de novo em instantes.</p>
        ) : null}
        {status?.chargesEnabled ? (
          <p className="mt-3 text-sm font-medium text-emerald-700">Conta conectada e pronta para receber.</p>
        ) : (
          <>
            {status?.detailsSubmitted ? (
              <p className="mt-3 text-sm text-amber-700">Cadastro enviado. O Stripe ainda está analisando a conta.</p>
            ) : null}
            {/* Route handler, not a page: <Link> would prefetch it. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/dashboard/settings/payments/connect" className="btn-primary mt-4 inline-block">
              {profile.stripe_account_id ? "Continuar cadastro no Stripe" : "Conectar Stripe"}
            </a>
          </>
        )}
      </section>
    </div>
  );
}
