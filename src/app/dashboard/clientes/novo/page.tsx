import Link from "next/link";
import { siteOrigin } from "@/lib/request";
import { formatBRL, FREE_CLIENTS, PLAN_PRICE_BRL } from "@/lib/plans";
import { getOwner } from "../../context";
import { NewClientForm } from "./NewClientForm";

export default async function NewClientPage() {
  const { clients } = await getOwner();
  const paid = clients.length >= FREE_CLIENTS;

  return (
    <main className="mx-auto w-full max-w-xl">
      <Link href="/dashboard/clientes" className="text-sm text-stone-500 hover:text-stone-900">
        ← Meus clientes
      </Link>
      <div className="mt-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:p-8">
        <h1 className="text-2xl font-bold">Adicionar cliente</h1>
        {paid ? (
          <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
            Você já usou o <strong>{FREE_CLIENTS} cliente grátis</strong> do seu plano. Escolha o plano deste
            novo cliente abaixo: ao criar, você vai para o pagamento seguro no Stripe, e o cliente é ativado
            assim que a assinatura confirma.
          </div>
        ) : (
          <p className="mt-2 text-sm text-stone-600">
            Seu primeiro cliente é <strong>grátis</strong>. Escolha um modelo e o endereço da página.
          </p>
        )}
        <NewClientForm
          host={new URL(await siteOrigin()).host}
          paid={paid}
          essencialPrice={formatBRL(PLAN_PRICE_BRL.essencial)}
          profissionalPrice={formatBRL(PLAN_PRICE_BRL.profissional)}
        />
      </div>
    </main>
  );
}
