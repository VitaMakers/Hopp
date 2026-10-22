import { PRO_PRICE_BRL, requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const PLAN_LABEL: Record<string, string> = { free: "Essencial", pro: "Profissional" };

export default async function AdminPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const since60 = new Date(Date.now() - 60 * 86_400_000).toISOString();

  // Counts (head-only, so no rows are transferred).
  const [
    totalClients,
    proClients,
    stripeConnected,
    newClients30,
    newClientsPrev30,
    publishedPages,
    leads,
    views30,
    clicks30,
    recent,
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("plan", "pro"),
    admin.from("profiles").select("*", { count: "exact", head: true }).not("stripe_account_id", "is", null),
    admin.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", since30),
    admin.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", since60).lt("created_at", since30),
    admin.from("pages").select("*", { count: "exact", head: true }).not("published", "is", null),
    admin.from("contacts").select("*", { count: "exact", head: true }),
    admin.from("events").select("*", { count: "exact", head: true }).eq("kind", "page_view").gte("created_at", since30),
    admin.from("events").select("*", { count: "exact", head: true }).in("kind", ["block_click", "social_click"]).gte("created_at", since30),
    admin.from("profiles").select("handle, display_name, plan, created_at").order("created_at", { ascending: false }).limit(1000),
  ]);

  const total = totalClients.count ?? 0;
  const pro = proClients.count ?? 0;
  const free = Math.max(0, total - pro);
  const connected = stripeConnected.count ?? 0;
  const new30 = newClients30.count ?? 0;
  const newPrev = newClientsPrev30.count ?? 0;
  const mrr = pro * PRO_PRICE_BRL;

  const profiles = (recent.data ?? []) as { handle: string; display_name: string; plan: string; created_at: string }[];
  const days = 30;
  const daily = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) daily.set(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10), 0);
  for (const p of profiles) {
    const key = p.created_at.slice(0, 10);
    if (daily.has(key)) daily.set(key, (daily.get(key) ?? 0) + 1);
  }
  const series = [...daily.values()];
  const maxDaily = Math.max(1, ...series);
  const delta = newPrev ? ((new30 - newPrev) / newPrev) * 100 : null;
  const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const num = (v: number) => v.toLocaleString("pt-BR");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Painel do administrador</h1>
        <p className="text-sm text-stone-500">Visão geral da plataforma — visível apenas para você.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Clientes" value={num(total)} sub={`${num(new30)} novos em 30 dias`} delta={delta} />
        <Card label="Plano Profissional" value={num(pro)} sub={`${num(free)} no Essencial`} />
        <Card label="Receita mensal estimada" value={brl(mrr)} sub={`${num(pro)} × ${brl(PRO_PRICE_BRL)} · estimativa`} />
        <Card label="Páginas publicadas" value={num(publishedPages.count ?? 0)} sub={`${num(connected)} com Stripe conectado`} />
      </div>

      <section className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
        <h2 className="mb-4 font-semibold">Novos clientes por dia · 30 dias</h2>
        <div className="flex h-40 items-end gap-1" role="img" aria-label="Novos clientes por dia">
          {[...daily].map(([day, n]) => (
            <div
              key={day}
              title={`${day.split("-").reverse().join("/")}: ${n} novos`}
              className="flex-1 rounded-t bg-stone-800"
              style={{ height: `${Math.max(2, (n / maxDaily) * 100)}%` }}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="rounded-xl bg-white p-4 ring-1 ring-stone-200 lg:col-span-3">
          <h2 className="mb-3 font-semibold">Clientes recentes</h2>
          {profiles.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone-500">Nenhum cliente ainda.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-400">
                  <th className="pb-2 font-medium">Cliente</th>
                  <th className="pb-2 font-medium">Plano</th>
                  <th className="pb-2 text-right font-medium">Desde</th>
                </tr>
              </thead>
              <tbody>
                {profiles.slice(0, 10).map((p) => (
                  <tr key={p.handle} className="border-b border-stone-100 last:border-0">
                    <td className="py-2.5">
                      <span className="font-medium">{p.display_name || p.handle}</span>
                      <span className="ml-2 text-xs text-stone-400">/{p.handle}</span>
                    </td>
                    <td className="py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.plan === "pro" ? "bg-amber-100 text-amber-800" : "bg-stone-100 text-stone-600"}`}>
                        {PLAN_LABEL[p.plan] ?? p.plan}
                      </span>
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-stone-500">{p.created_at.slice(8, 10)}/{p.created_at.slice(5, 7)}/{p.created_at.slice(0, 4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="rounded-xl bg-white p-4 ring-1 ring-stone-200 lg:col-span-2">
          <h2 className="mb-3 font-semibold">Atividade da plataforma · 30 dias</h2>
          <ul className="flex flex-col gap-3 text-sm">
            <Row label="Visitas nas páginas" value={num(views30.count ?? 0)} />
            <Row label="Cliques" value={num(clicks30.count ?? 0)} />
            <Row label="Contatos capturados" value={num(leads.count ?? 0)} />
            <Row label="Contas Stripe conectadas" value={num(connected)} />
          </ul>
          <p className="mt-4 text-xs text-stone-400">
            A receita é uma estimativa (ainda não há cobrança de assinatura no app). Para receita real, dá para ligar o faturamento via Stripe.
          </p>
        </section>
      </div>
    </div>
  );
}

function Card({ label, value, sub, delta }: { label: string; value: string; sub?: string; delta?: number | null }) {
  const showDelta = delta !== undefined && delta !== null && isFinite(delta) && Math.abs(delta) >= 0.5;
  const up = (delta ?? 0) > 0;
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
      <p className="text-sm text-stone-500">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-3xl font-bold tabular-nums">{value}</p>
        {showDelta ? (
          <span className={`pb-1 text-xs font-semibold tabular-nums ${up ? "text-emerald-600" : "text-red-500"}`}>
            {up ? "▲" : "▼"} {Math.abs(delta!).toFixed(0)}%
          </span>
        ) : null}
      </div>
      {sub ? <p className="mt-1 text-xs text-stone-400">{sub}</p> : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex justify-between gap-3">
      <span className="text-stone-600">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </li>
  );
}
