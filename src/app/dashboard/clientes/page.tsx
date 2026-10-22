import Link from "next/link";
import { accountMonthlyBRL, formatBRL, FREE_CLIENTS, normalizePlan, PLAN_LABEL } from "@/lib/plans";
import { getOwner } from "../context";
import { selectClient } from "./actions";

const PLAN_BADGE: Record<string, string> = {
  free: "bg-stone-100 text-stone-600",
  essencial: "bg-sky-100 text-sky-700",
  profissional: "bg-amber-100 text-amber-800",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default async function ClientsPage() {
  const { supabase, clients, profile } = await getOwner();
  const ids = clients.map((c) => c.id);

  // Last 30 days of activity, counted per client in one query.
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: events } = await supabase
    .from("events")
    .select("owner_id, kind")
    .in("owner_id", ids)
    .gte("created_at", since);

  const views = new Map<string, number>();
  const clicks = new Map<string, number>();
  for (const e of events ?? []) {
    const bucket = e.kind === "page_view" ? views : clicks;
    bucket.set(e.owner_id, (bucket.get(e.owner_id) ?? 0) + 1);
  }

  const monthly = accountMonthlyBRL(clients.map((c) => c.plan));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Meus clientes</h1>
          <p className="mt-1 text-sm text-stone-600">
            Gerencie várias páginas numa conta só e troque de cliente sem sair do painel.
          </p>
        </div>
        <Link href="/dashboard/clientes/novo" className="btn-primary whitespace-nowrap">
          + Adicionar cliente
        </Link>
      </div>

      <div className="flex flex-wrap gap-4 rounded-2xl bg-white p-4 text-sm ring-1 ring-stone-200">
        <div>
          <p className="text-stone-500">Clientes</p>
          <p className="text-lg font-semibold">{clients.length}</p>
        </div>
        <div>
          <p className="text-stone-500">Grátis incluídos</p>
          <p className="text-lg font-semibold">{FREE_CLIENTS}</p>
        </div>
        <div>
          <p className="text-stone-500">Mensalidade estimada</p>
          <p className="text-lg font-semibold">{formatBRL(monthly)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => {
          const selected = client.id === profile.id;
          const plan = normalizePlan(client.plan);
          return (
            <div
              key={client.id}
              className={`flex flex-col gap-4 rounded-2xl bg-white p-5 ring-1 transition ${selected ? "ring-2 ring-stone-900" : "ring-stone-200"}`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stone-900 text-sm font-semibold text-white">
                  {initials(client.display_name || client.handle)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{client.display_name || client.handle}</p>
                  <a
                    href={`/${client.handle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-xs text-stone-500 hover:underline"
                  >
                    /{client.handle}
                  </a>
                </div>
                <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PLAN_BADGE[plan]}`}>
                  {PLAN_LABEL[plan]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-stone-50 py-2">
                  <p className="text-lg font-bold">{views.get(client.id) ?? 0}</p>
                  <p className="text-[11px] text-stone-500">Visitas (30d)</p>
                </div>
                <div className="rounded-xl bg-stone-50 py-2">
                  <p className="text-lg font-bold">{clicks.get(client.id) ?? 0}</p>
                  <p className="text-[11px] text-stone-500">Cliques (30d)</p>
                </div>
              </div>

              {selected ? (
                <Link href="/dashboard" className="btn-primary text-center text-sm">
                  Cliente ativo — editar
                </Link>
              ) : (
                <form action={selectClient.bind(null, client.id)}>
                  <button type="submit" className="w-full rounded-lg border border-stone-300 py-2 text-sm font-medium transition hover:border-stone-900">
                    Entrar neste cliente
                  </button>
                </form>
              )}
            </div>
          );
        })}

        <Link
          href="/dashboard/clientes/novo"
          className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-300 p-5 text-center text-stone-500 transition hover:border-stone-900 hover:text-stone-900"
        >
          <span className="text-3xl leading-none">+</span>
          <span className="text-sm font-medium">Adicionar cliente</span>
        </Link>
      </div>
    </div>
  );
}
