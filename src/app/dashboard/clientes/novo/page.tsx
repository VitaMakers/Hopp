import Link from "next/link";
import { siteOrigin } from "@/lib/request";
import { formatBRL, PLAN_PRICE_BRL } from "@/lib/plans";
import { getOwner } from "../../context";
import { NewClientForm } from "./NewClientForm";

export default async function NewClientPage() {
  await getOwner();

  return (
    <main className="mx-auto w-full max-w-xl">
      <Link href="/dashboard/clientes" className="text-sm text-stone-500 hover:text-stone-900">
        ← Meus clientes
      </Link>
      <div className="mt-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:p-8">
        <h1 className="text-2xl font-bold">Adicionar cliente</h1>
        <p className="mt-2 text-sm text-stone-600">
          Comece no <strong>Grátis</strong>, sem cartão, ou assine o <strong>Essencial</strong> ({formatBRL(PLAN_PRICE_BRL.essencial)}/mês)
          para liberar tudo. Se escolher o Essencial e não concluir o pagamento, o cliente fica no Grátis.
        </p>
        <NewClientForm
          host={new URL(await siteOrigin()).host}
          essencialPrice={formatBRL(PLAN_PRICE_BRL.essencial)}
        />
      </div>
    </main>
  );
}
