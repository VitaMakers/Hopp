import Link from "next/link";
import { getOwner } from "../../../context";
import { DetachForm } from "./DetachForm";

export default async function DetachPage({ params }: { params: Promise<{ id: string }> }) {
  const { clients, accountId } = await getOwner();
  const { id } = await params;
  const client = clients.find((c) => c.id === id);

  return (
    <main className="mx-auto w-full max-w-xl">
      <Link href="/dashboard/clientes" className="text-sm text-stone-500 hover:text-stone-900">
        ← Meus clientes
      </Link>
      <div className="mt-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:p-8">
        <h1 className="text-2xl font-bold">Desvincular cliente</h1>
        {!client ? (
          <p className="mt-3 text-sm text-red-600">Cliente não encontrado.</p>
        ) : client.id === accountId ? (
          <p className="mt-3 text-sm text-red-600">Esta é a sua página principal e não pode ser desvinculada.</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-stone-600">
              Transfere <strong>{client.display_name || client.handle}</strong> (<span className="text-stone-500">/{client.handle}</span>){" "}
              para a conta do próprio cliente. O link, a página, as estatísticas e os contatos continuam os mesmos — nada é
              recriado. Depois disso, <strong>você deixa de gerenciar este cliente</strong>.
            </p>
            <DetachForm clientId={client.id} />
          </>
        )}
      </div>
    </main>
  );
}
