import { deleteContact, deleteFormResponse } from "../actions";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { getOwner } from "../context";

// Rendered on the server, which runs in UTC; show the creator's local time.
const TIME_ZONE = "America/Sao_Paulo";

export default async function ContactsPage() {
  const { supabase, profile } = await getOwner();
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, email, phone, created_at")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(500);

  // Answers sent through form blocks on the page itself (forms with their own
  // link are listed under Formulários).
  const { data: responses } = await supabase
    .from("form_responses")
    .select("id, answers, created_at")
    .eq("owner_id", profile.id)
    .is("form_id", null)
    .order("created_at", { ascending: false })
    .limit(300);
  const answersOf = (value: unknown) =>
    Array.isArray(value) ? (value as { label?: string; value?: string }[]).filter((a) => a && (a.value ?? "").trim()) : [];

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
                <td className="p-3 text-stone-600">{new Date(contact.created_at).toLocaleString("pt-BR", { timeZone: TIME_ZONE })}</td>
                <td className="p-3 text-right">
                  <ConfirmDeleteButton action={deleteContact.bind(null, contact.id)} message="Excluir este contato?" />
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

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-bold">Respostas dos formulários da página</h2>
          <p className="text-sm text-stone-600">O que as pessoas enviaram pelos blocos de formulário da sua página.</p>
        </div>
        {responses?.length ? (
          <ul className="flex flex-col gap-3">
            {responses.map((r) => (
              <li key={r.id} className="rounded-xl bg-white p-4 text-sm ring-1 ring-stone-200">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs text-stone-500">{new Date(r.created_at).toLocaleString("pt-BR", { timeZone: TIME_ZONE })}</p>
                  <ConfirmDeleteButton action={deleteFormResponse.bind(null, r.id)} message="Excluir esta resposta?" />
                </div>
                <dl className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,180px)_1fr]">
                  {answersOf(r.answers).map((a, i) => (
                    <div key={i} className="contents">
                      <dt className="text-stone-500">{a.label || "Campo"}</dt>
                      <dd className="break-words text-stone-900">{a.value}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl bg-white p-6 text-center text-sm text-stone-500 ring-1 ring-stone-200">
            Nenhuma resposta ainda. Quando alguém enviar um formulário da sua página, aparece aqui.
          </p>
        )}
      </section>
    </div>
  );
}
