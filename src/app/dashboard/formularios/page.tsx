import Link from "next/link";
import { canUseForms } from "@/lib/entitlements";
import { formatBRL, normalizePlan, PLAN_PRICE_BRL } from "@/lib/plans";
import { getOwner } from "../context";
import { CopyLink } from "./CopyLink";
import { DeleteFormButton } from "./DeleteFormButton";
import { NewFormButton } from "./NewFormButton";
import { fetchAll } from "@/lib/supabase/fetch-all";

type FormRow = { id: string; code: string; config: { title?: string } | null; created_at: string };

type Answer = { label: string; value: string };

const ghost =
  "inline-flex h-9 items-center rounded-[9px] border border-[#E5E2DA] bg-white px-3.5 text-[13px] font-semibold text-stone-900 transition-colors hover:border-stone-400";

// "há 2 h", "ontem", "há 3 dias": short and readable in a list.
function ago(iso: string): string {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  if (d === 1) return "ontem";
  if (d < 14) return `há ${d} dias`;
  if (d < 60) return `há ${Math.round(d / 7)} semanas`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
}

// One response as "who, contact, the rest": the first answer names the person,
// a phone or e-mail becomes the contact line, everything else is the answer.
function summarize(answers: Answer[] | null) {
  const list = (Array.isArray(answers) ? answers : []).filter((a) => a?.value?.trim());
  const isContact = (a: Answer) => /@/.test(a.value) || a.value.replace(/\D/g, "").length >= 8 && /^[\d\s()+.-]+$/.test(a.value.trim());
  const who = list.find((a) => !isContact(a));
  const contact = list.find(isContact);
  const rest = list.filter((a) => a !== who && a !== contact).map((a) => a.value.trim());
  return { who: who?.value.trim() || "Sem nome", contact: contact?.value.trim() ?? "", rest: rest.join(" · ") };
}

export default async function FormulariosPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f: selected } = await searchParams;
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
  const last = new Map<string, string>();
  if (ids.length && allowed) {
    const { data: resp } = await fetchAll<{ form_id: string | null; created_at: string }>(
      (from, to) => supabase.from("form_responses").select("form_id, created_at").in("form_id", ids).order("created_at", { ascending: false }).order("id").range(from, to),
      20_000,
    );
    for (const r of resp) {
      if (!r.form_id) continue;
      counts.set(r.form_id, (counts.get(r.form_id) ?? 0) + 1);
      if (!last.has(r.form_id)) last.set(r.form_id, r.created_at);
    }
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

  const current = list.find((f) => f.id === selected) ?? list[0] ?? null;
  const { data: recent } = current
    ? await supabase.from("form_responses").select("id, answers, created_at").eq("form_id", current.id).order("created_at", { ascending: false }).limit(12)
    : { data: [] };
  const rows = (recent ?? []) as { id: string; answers: Answer[] | null; created_at: string }[];
  const total = current ? (counts.get(current.id) ?? 0) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[30px] font-bold leading-tight tracking-[-0.025em]">Formulários</h1>
          <p className="mt-2 text-[15px] text-stone-600">Crie seus próprios formulários e receba as respostas aqui, sem outra ferramenta.</p>
        </div>
        <NewFormButton />
      </div>

      {!current ? (
        <div className="rounded-[14px] border border-[#E5E2DA] bg-white p-8 text-center text-sm text-stone-600">
          Nenhum formulário ainda. Clique em “Criar formulário” e escolha um modelo para começar.
        </div>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <nav aria-label="Seus formulários" className="overflow-hidden rounded-[14px] border border-[#E5E2DA] bg-white">
            {list.map((f) => {
              const n = counts.get(f.id) ?? 0;
              const on = f.id === current.id;
              return (
                <Link
                  key={f.id}
                  href={`/dashboard/formularios?f=${f.id}`}
                  aria-current={on ? "true" : undefined}
                  className={`block border-b border-[#EFEDE7] px-[18px] py-4 transition-colors last:border-b-0 ${on ? "bg-[#F3F3FB]" : "hover:bg-[#FAF9F6]"}`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="truncate text-[15px] font-semibold">{f.config?.title || "Formulário sem título"}</span>
                    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-[#2F6B3A]">
                      <span className="h-[7px] w-[7px] rounded-full bg-[#2F9E4F]" />
                      Ativo
                    </span>
                  </span>
                  <span className="mt-1 block text-[13px] text-stone-600">
                    {n === 0 ? "Sem respostas ainda" : `${n} ${n === 1 ? "resposta" : "respostas"}${last.get(f.id) ? `, última ${ago(last.get(f.id)!)}` : ""}`}
                  </span>
                </Link>
              );
            })}
          </nav>

          <section className="min-w-0 rounded-[14px] border border-[#E5E2DA] bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold">{current.config?.title || "Formulário sem título"}</h2>
                <p className="mt-1 text-[13px] text-stone-600">
                  {total} {total === 1 ? "resposta" : "respostas"}. Aparece na sua página e tem link próprio.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/dashboard/formularios/${current.id}`} className={ghost}>
                  Editar perguntas
                </Link>
                <a href={`/dashboard/formularios/${current.id}/respostas/export`} className={ghost}>
                  Exportar planilha
                </a>
              </div>
            </div>

            {rows.length === 0 ? (
              <p className="mt-6 rounded-[10px] bg-[#F3F2EE] px-4 py-6 text-center text-sm text-stone-600">
                Nenhuma resposta ainda. Compartilhe o link do formulário para começar a receber.
              </p>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#E5E2DA] text-xs font-semibold text-stone-600">
                      <th className="pb-2.5 pr-4 font-semibold">Quem</th>
                      <th className="pb-2.5 pr-4 font-semibold">Resposta</th>
                      <th className="pb-2.5 text-right font-semibold">Quando</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const view = summarize(r.answers);
                      return (
                        <tr key={r.id} className="border-b border-[#EFEDE7] align-top last:border-b-0">
                          <td className="py-3.5 pr-4">
                            <span className="block font-semibold">{view.who}</span>
                            {view.contact ? <span className="block text-[13px] text-stone-600">{view.contact}</span> : null}
                          </td>
                          <td className="max-w-md break-words py-3.5 pr-4 text-stone-800">{view.rest || "—"}</td>
                          <td className="whitespace-nowrap py-3.5 text-right text-stone-600">{ago(r.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#EFEDE7] pt-4 text-[13px]">
              <Link href={`/dashboard/formularios/${current.id}/respostas`} className="font-semibold text-stone-900 hover:underline">
                Ver todas as respostas
              </Link>
              <a href={`/f/${current.code}`} target="_blank" rel="noreferrer" className="text-stone-700 hover:text-stone-900 hover:underline">
                Abrir o formulário
              </a>
              <CopyLink code={current.code} compact />
              <DeleteFormButton id={current.id} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
