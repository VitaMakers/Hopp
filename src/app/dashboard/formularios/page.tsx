import Link from "next/link";
import { canUseForms } from "@/lib/entitlements";
import { formatBRL, normalizePlan, PLAN_PRICE_BRL } from "@/lib/plans";
import { getOwner } from "../context";
import { CopyLink } from "./CopyLink";
import { DeleteFormButton } from "./DeleteFormButton";
import { NewFormButton } from "./NewFormButton";

type FormRow = { id: string; code: string; config: { title?: string } | null; created_at: string };

export default async function FormulariosPage() {
  const { supabase, profile } = await getOwner();
  const allowed = canUseForms(profile.plan);
  const { data: forms } = await supabase
    .from("forms")
    .select("id, code, config, created_at")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false });

  const list = (forms ?? []) as FormRow[];
  const ids = list.map((f) => f.id);

  const counts = new Map<string, number>();
  if (ids.length && allowed) {
    const { data: resp } = await supabase.from("form_responses").select("form_id").in("form_id", ids).limit(5000);
    for (const r of resp ?? []) if (r.form_id) counts.set(r.form_id, (counts.get(r.form_id) ?? 0) + 1);
  }

  if (!allowed) {
    const paid = normalizePlan(profile.plan) !== "free";
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-[30px] font-bold leading-tight tracking-[-0.025em]">Formulários</h1>
          <p className="mt-2 text-[15px] text-stone-600">Crie seus próprios formulários e receba as respostas aqui, sem outra ferramenta.</p>
        </div>
        <section className="flex flex-wrap items-start gap-6 rounded-[14px] border border-[#E5E2DA] bg-white p-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EDEDF8] text-stone-900">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </span>
          <div className="min-w-[240px] max-w-xl flex-1">
            <h2 className="text-lg font-semibold">Formulários são do plano Profissional</h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-stone-700">
              <li>Reserva de mesa, orçamento, inscrição ou o que precisar, com suas perguntas.</li>
              <li>Cada formulário tem link próprio e também entra como bloco na página.</li>
              <li>As respostas ficam aqui, organizadas, e saem numa planilha quando quiser.</li>
            </ul>
            {list.length ? (
              <p className="mt-3 text-[13px] text-stone-600">Seus {list.length} formulários continuam guardados e voltam ao assinar.</p>
            ) : null}
          </div>
          <div className="flex flex-col items-start gap-2">
            <a
              href={paid ? "/dashboard/plans?trocar=profissional" : `/dashboard/clientes/${profile.id}/assinar?plan=profissional`}
              className="inline-flex h-11 items-center rounded-[10px] bg-blue-600 px-5 text-[15px] font-semibold text-white transition-colors hover:bg-blue-700"
            >
              {paid ? "Passar para o Profissional" : "Assinar o Profissional"}
            </a>
            <span className="text-[13px] text-stone-600">{formatBRL(PLAN_PRICE_BRL.profissional)} por mês</span>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[30px] font-bold leading-tight tracking-[-0.025em]">Formulários</h1>
          <p className="mt-2 text-[15px] text-stone-600">
            Crie formulários com link próprio para divulgar onde quiser. As respostas ficam aqui e também em Contatos.
          </p>
        </div>
        <NewFormButton />
      </div>

      {list.length === 0 ? (
        <div className="rounded-[14px] border border-[#E5E2DA] bg-white p-8 text-center text-sm text-stone-600">
          Nenhum formulário ainda. Clique em “Novo formulário” e escolha um modelo para começar.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((f) => (
            <div key={f.id} className="flex flex-col gap-3 rounded-[14px] border border-[#E5E2DA] bg-white p-5">
              <div className="min-w-0">
                <p className="truncate font-semibold">{f.config?.title || "Formulário sem título"}</p>
                <a href={`/f/${f.code}`} target="_blank" rel="noreferrer" className="block truncate text-xs text-stone-600 hover:underline">
                  /f/{f.code}
                </a>
              </div>
              <p className="text-sm text-stone-700">
                <span className="font-semibold text-stone-900">{counts.get(f.id) ?? 0}</span> respostas
              </p>
              <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#EFEDE7] pt-3 text-[13px]">
                <Link href={`/dashboard/formularios/${f.id}/respostas`} className="font-semibold text-stone-900 hover:underline">
                  Ver respostas
                </Link>
                <Link href={`/dashboard/formularios/${f.id}`} className="text-stone-700 hover:text-stone-900 hover:underline">
                  Editar perguntas
                </Link>
                <CopyLink code={f.code} compact />
                <DeleteFormButton id={f.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
