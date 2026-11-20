import Link from "next/link";
import { getPaymentProvider, type AccountStatus } from "@/lib/payments";
import { PLAN_LABEL, normalizePlan } from "@/lib/plans";
import { DNS_A_VALUE, DNS_CNAME_VALUE, domainStatus, type DomainStatus } from "@/lib/domains";
import { canUseCustomDomain } from "@/lib/entitlements";
import { getOwner } from "../context";
import { DomainForm } from "./DomainForm";
import { SecurityForm } from "./SecurityForm";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ payments?: string }>;
}) {
  const { supabase, profile, user } = await getOwner();
  // Read apart from the main profile query, so the panel keeps working even
  // before the domain column exists in the database.
  const domainAllowed = canUseCustomDomain(profile.plan);
  const { data: domainRow, error: domainMissing } = await supabase.from("profiles").select("custom_domain").eq("id", profile.id).maybeSingle();
  const domain = (domainRow as { custom_domain?: string | null } | null)?.custom_domain ?? null;
  const live: DomainStatus | null = domain && domainAllowed ? await domainStatus(domain) : null;
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

      <section className="rounded-xl bg-white p-5 ring-1 ring-stone-200">
        <h2 className="font-semibold">Domínio próprio</h2>
        <p className="mt-1 text-sm text-stone-600">
          Use um endereço seu, como suamarca.com.br, para abrir a sua página. O endereço /{profile.handle} continua funcionando.
        </p>
        {!domainAllowed ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-[#F3F2EE] px-4 py-3">
            <p className="text-sm text-stone-700">Disponível no plano Profissional.</p>
            <Link
              href={normalizePlan(profile.plan) === "free" ? `/dashboard/clientes/${profile.id}/assinar?plan=profissional` : "/dashboard/plans?trocar=profissional"}
              prefetch={false}
              className="inline-flex h-9 items-center rounded-[9px] bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Ver o Profissional
            </Link>
          </div>
        ) : domainMissing ? (
          <p className="mt-4 text-sm text-stone-600">Este recurso está sendo ativado. Tente de novo em instantes.</p>
        ) : (
          <>
            <DomainForm clientId={profile.id} domain={domain} />
            {domain ? (
              <div className="mt-5 border-t border-[#EFEDE7] pt-4">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                  {domain}
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${live === "active" ? "text-[#2F6B3A]" : "text-stone-600"}`}>
                    <span className={`h-[7px] w-[7px] rounded-full ${live === "active" ? "bg-[#2F9E4F]" : "bg-amber-500"}`} />
                    {live === "active" ? "No ar" : live === "manual" ? "Aguardando ativação" : live === "pending" ? "Aguardando o DNS" : "Verificando"}
                  </span>
                </p>
                {live !== "active" ? (
                  <>
                    <p className="mt-3 text-sm text-stone-700">No site onde você comprou o domínio, abra a área de DNS e crie um destes registros:</p>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[420px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-[#E5E2DA] text-xs text-stone-600">
                            <th className="pb-2 pr-4 font-semibold">Quando usar</th>
                            <th className="pb-2 pr-4 font-semibold">Tipo</th>
                            <th className="pb-2 pr-4 font-semibold">Nome</th>
                            <th className="pb-2 font-semibold">Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-[#EFEDE7]">
                            <td className="py-2.5 pr-4 text-stone-700">Domínio principal (marca.com.br)</td>
                            <td className="py-2.5 pr-4 font-mono text-[13px]">A</td>
                            <td className="py-2.5 pr-4 font-mono text-[13px]">@</td>
                            <td className="py-2.5 font-mono text-[13px]">{DNS_A_VALUE}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 pr-4 text-stone-700">Subdomínio (link.marca.com.br)</td>
                            <td className="py-2.5 pr-4 font-mono text-[13px]">CNAME</td>
                            <td className="py-2.5 pr-4 font-mono text-[13px]">link</td>
                            <td className="py-2.5 font-mono text-[13px]">{DNS_CNAME_VALUE}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-3 text-[13px] text-stone-600">
                      Depois de criar o registro, o domínio pode levar de alguns minutos a algumas horas para começar a abrir. Recarregue esta tela para ver a situação.
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-stone-700">
                    Sua página abre em{" "}
                    <a href={`https://${domain}`} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-4">
                      {domain}
                    </a>
                    .
                  </p>
                )}
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className="rounded-xl bg-white p-5 ring-1 ring-stone-200">
        <h2 className="font-semibold">Segurança da conta</h2>
        <div className="mt-3">
          <SecurityForm />
        </div>
      </section>

      <p className="text-center text-xs text-stone-400">
        <Link href="/privacidade" className="underline">Política de Privacidade</Link>
        {" · "}
        <Link href="/termos" className="underline">Termos de Uso</Link>
      </p>
    </div>
  );
}
