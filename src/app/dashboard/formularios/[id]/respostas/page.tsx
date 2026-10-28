import Link from "next/link";
import { notFound } from "next/navigation";
import { FORM_DISPLAY_TYPES, formBlockSchema } from "@/lib/page/schema";
import { getOwner } from "../../../context";
import { deleteResponse } from "../../actions";

const TIME_ZONE = "America/Sao_Paulo";
type Answer = { label: string; value: string };

export default async function RespostasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await getOwner();

  const { data: form } = await supabase.from("forms").select("id, code, config").eq("id", id).maybeSingle();
  if (!form) notFound();
  const parsed = formBlockSchema.safeParse(form.config);
  const title = parsed.success ? parsed.data.title || "Formulário" : "Formulário";
  const columns = parsed.success
    ? parsed.data.fields
        .filter((f) => !(FORM_DISPLAY_TYPES as readonly string[]).includes(f.type))
        .map((f, i) => f.label || `Campo ${i + 1}`)
    : [];

  const { data: responses } = await supabase
    .from("form_responses")
    .select("id, answers, created_at")
    .eq("form_id", id)
    .order("created_at", { ascending: false })
    .limit(1000);
  const rows = (responses ?? []) as { id: string; answers: Answer[]; created_at: string }[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/dashboard/formularios" className="text-sm text-stone-500 hover:text-stone-900">
            ← Formulários
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{title}</h1>
          <p className="text-sm text-stone-600">{rows.length} resposta(s) · sem limite de armazenamento.</p>
        </div>
        {rows.length ? (
          <a href={`/dashboard/formularios/${id}/respostas/export`} className="btn-primary">
            Exportar CSV
          </a>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-stone-500 ring-1 ring-stone-200">
          Nenhuma resposta ainda. Compartilhe o link do formulário para começar a receber.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-stone-200">
          <table className="w-full text-left text-sm">
            <thead className="text-stone-500">
              <tr className="border-b border-stone-200">
                <th className="whitespace-nowrap p-3 font-medium">Data</th>
                {columns.map((c, i) => (
                  <th key={i} className="whitespace-nowrap p-3 font-medium">
                    {c}
                  </th>
                ))}
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const map = new Map((Array.isArray(r.answers) ? r.answers : []).map((a) => [a.label, a.value]));
                return (
                  <tr key={r.id} className="border-t border-stone-100 align-top">
                    <td className="whitespace-nowrap p-3 text-stone-500">
                      {new Date(r.created_at).toLocaleString("pt-BR", { timeZone: TIME_ZONE })}
                    </td>
                    {columns.map((c, i) => (
                      <td key={i} className="max-w-xs whitespace-pre-wrap break-words p-3">
                        {map.get(c) || "—"}
                      </td>
                    ))}
                    <td className="p-3 text-right">
                      <form action={deleteResponse.bind(null, id, r.id)}>
                        <button type="submit" className="text-xs text-stone-400 hover:text-red-600 hover:underline">
                          Excluir
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
