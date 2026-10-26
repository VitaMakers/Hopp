import { deleteFormResponse } from "../actions";
import { getOwner } from "../context";

const TIME_ZONE = "America/Sao_Paulo";

type Answer = { label: string; value: string };

export default async function FormulariosPage() {
  const { supabase, profile } = await getOwner();
  const { data: responses } = await supabase
    .from("form_responses")
    .select("id, answers, created_at")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = (responses ?? []) as { id: string; answers: Answer[]; created_at: string }[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Formulários</h1>
        <p className="text-sm text-stone-600">
          Respostas enviadas pelos blocos de formulário da sua página. Cada envio também abre o WhatsApp do visitante com os
          dados preenchidos.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm text-stone-500 ring-1 ring-stone-200">
          Nenhuma resposta ainda. Adicione um bloco <strong>&quot;Formulário&quot;</strong> na sua página (aba Blocos) e
          configure o WhatsApp que recebe.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-stone-200">
              <p className="text-xs text-stone-400">
                {new Date(r.created_at).toLocaleString("pt-BR", { timeZone: TIME_ZONE })}
              </p>
              <dl className="flex flex-col gap-2 text-sm">
                {(Array.isArray(r.answers) ? r.answers : []).map((a, i) => (
                  <div key={i}>
                    <dt className="text-xs font-medium text-stone-500">{a.label}</dt>
                    <dd className="whitespace-pre-wrap break-words text-stone-800">{a.value || "—"}</dd>
                  </div>
                ))}
              </dl>
              <form action={deleteFormResponse.bind(null, r.id)} className="mt-auto">
                <button type="submit" className="text-xs text-stone-400 transition hover:text-red-600 hover:underline">
                  Excluir resposta
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
