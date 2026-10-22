import Link from "next/link";
import { env } from "@/lib/env";
import { formatBRL, FREE_CLIENTS, nextClientPriceBRL } from "@/lib/plans";
import { getOwner } from "../../context";
import { NewClientForm } from "./NewClientForm";

export default async function NewClientPage() {
  const { clients } = await getOwner();
  const paid = clients.length >= FREE_CLIENTS;
  const price = nextClientPriceBRL();

  return (
    <main className="mx-auto w-full max-w-xl">
      <Link href="/dashboard/clientes" className="text-sm text-stone-500 hover:text-stone-900">
        ← Meus clientes
      </Link>
      <div className="mt-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:p-8">
        <h1 className="text-2xl font-bold">Adicionar cliente</h1>
        {paid ? (
          <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
            Você já usou os <strong>{FREE_CLIENTS} cliente(s) grátis</strong> do seu plano. Este novo cliente
            entra na sua mensalidade a partir de <strong>{formatBRL(price)}/mês</strong>. A cobrança é ativada
            junto com a sua assinatura (em breve) — por enquanto você já pode criar e montar a página dele.
          </div>
        ) : (
          <p className="mt-2 text-sm text-stone-600">
            Seu primeiro cliente é <strong>grátis</strong>. Escolha um modelo e o endereço da página.
          </p>
        )}
        <NewClientForm host={new URL(env.siteUrl()).host} />
      </div>
    </main>
  );
}
