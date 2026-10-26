import Link from "next/link";
import { getOwner } from "../../../context";
import { DeleteForm } from "./DeleteForm";

export default async function DeleteClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { clients, accountId } = await getOwner();
  const { id } = await params;
  const client = clients.find((c) => c.id === id);

  return (
    <main className="mx-auto w-full max-w-xl">
      <Link href="/dashboard/clientes" className="text-sm text-stone-500 hover:text-stone-900">
        ← Meus clientes
      </Link>
      <div className="mt-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:p-8">
        <h1 className="text-2xl font-bold text-red-700">Excluir cliente</h1>
        {!client ? (
          <p className="mt-3 text-sm text-red-600">Cliente não encontrado.</p>
        ) : client.id === accountId ? (
          <p className="mt-3 text-sm text-red-600">
            Esta é a sua página principal e não pode ser excluída por aqui. Para encerrar sua conta, use Configurações →
            Excluir conta.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-stone-600">
              Você vai excluir <strong>{client.display_name || client.handle}</strong> (
              <span className="text-stone-500">/{client.handle}</span>) para sempre.
            </p>
            <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">
              <p className="font-semibold">Isso é permanente e não pode ser desfeito. Serão apagados:</p>
              <ul className="mt-2 list-disc pl-5 text-red-700">
                <li>A página e o link <span className="font-mono">/{client.handle}</span> (sai do ar)</li>
                <li>Todas as visitas e cliques (estatísticas)</li>
                <li>Todos os contatos capturados (leads)</li>
                <li>Os links curtos desse cliente</li>
                <li>A assinatura dele, se houver, é cancelada no Stripe</li>
              </ul>
            </div>
            <DeleteForm clientId={client.id} handle={client.handle} />
          </>
        )}
      </div>
    </main>
  );
}
