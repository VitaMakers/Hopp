import { deleteContact } from "../actions";
import { getOwner } from "../context";

export default async function ContactsPage() {
  const { supabase, profile } = await getOwner();
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, email, phone, created_at")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Contatos</h1>
          <p className="text-sm text-stone-600">Pessoas que se inscreveram pelos blocos de captação.</p>
        </div>
        {/* Route handler, not a page: <Link> would prefetch it. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/dashboard/contacts/export" className="btn-primary">
          Exportar CSV
        </a>
      </div>
      <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-stone-200">
        <table className="w-full text-left text-sm">
          <thead className="text-stone-500">
            <tr>
              <th className="p-3 font-medium">E-mail</th>
              <th className="p-3 font-medium">WhatsApp</th>
              <th className="p-3 font-medium">Data</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {(contacts ?? []).map((contact) => (
              <tr key={contact.id} className="border-t border-stone-100">
                <td className="p-3">{contact.email}</td>
                <td className="p-3">{contact.phone ?? "—"}</td>
                <td className="p-3 text-stone-600">{new Date(contact.created_at).toLocaleString("pt-BR")}</td>
                <td className="p-3 text-right">
                  <form action={deleteContact.bind(null, contact.id)}>
                    <button type="submit" className="text-red-600">
                      Excluir
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {contacts?.length ? null : (
              <tr>
                <td colSpan={4} className="p-6 text-center text-stone-500">
                  Nenhum contato ainda. Adicione um bloco &quot;Captar contatos&quot; na sua página.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
