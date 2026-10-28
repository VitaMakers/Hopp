import Link from "next/link";
import { getOwner } from "../context";
import { CopyLink } from "./CopyLink";
import { DeleteFormButton } from "./DeleteFormButton";
import { NewFormButton } from "./NewFormButton";

type FormRow = { id: string; code: string; config: { title?: string } | null; created_at: string };

export default async function FormulariosPage() {
  const { supabase, profile } = await getOwner();
  const { data: forms } = await supabase
    .from("forms")
    .select("id, code, config, created_at")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false });

  const list = (forms ?? []) as FormRow[];
  const ids = list.map((f) => f.id);

  const counts = new Map<string, number>();
  if (ids.length) {
    const { data: resp } = await supabase.from("form_responses").select("form_id").in("form_id", ids).limit(5000);
    for (const r of resp ?? []) if (r.form_id) counts.set(r.form_id, (counts.get(r.form_id) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Formulários</h1>
          <p className="text-sm text-stone-600">
            Crie formulários com link próprio pra divulgar onde quiser. As respostas caem aqui e no seu WhatsApp.
          </p>
        </div>
        <NewFormButton />
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-stone-500 ring-1 ring-stone-200">
          Nenhum formulário ainda. Clique em “+ Novo formulário” e escolha um modelo.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((f) => (
            <div key={f.id} className="flex flex-col gap-3 rounded-2xl bg-white p-5 ring-1 ring-stone-200">
              <div className="min-w-0">
                <p className="truncate font-semibold">{f.config?.title || "Formulário sem título"}</p>
                <a
                  href={`/f/${f.code}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-xs text-stone-500 hover:underline"
                >
                  /f/{f.code}
                </a>
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <Link href={`/dashboard/formularios/${f.id}`} className="text-stone-600 hover:text-stone-900 hover:underline">
                  Editar
                </Link>
                <CopyLink code={f.code} compact />
                <Link
                  href={`/dashboard/formularios/${f.id}/respostas`}
                  className="font-medium text-stone-700 hover:underline"
                >
                  Respostas
                  <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-emerald-700">
                    {counts.get(f.id) ?? 0}
                  </span>
                </Link>
                <DeleteFormButton id={f.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
