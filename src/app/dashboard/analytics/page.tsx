import { summarize, type EventRow } from "@/lib/analytics";
import { BLOCK_CATALOG, SOCIAL_LABELS, blockSummary } from "@/lib/page/catalog";
import { pageDocSchema, type SocialPlatform } from "@/lib/page/schema";
import { getOwner } from "../context";

const DAYS = 30;
// Enough for small pages; large accounts will need SQL aggregation instead.
const MAX_EVENTS = 50_000;

export default async function AnalyticsPage() {
  const { supabase, profile } = await getOwner();
  const since = new Date(Date.now() - DAYS * 86_400_000).toISOString();
  const [{ data: events }, { data: page }, { data: links }] = await Promise.all([
    supabase
      .from("events")
      .select("kind, block_id, short_link_id, target, visit_id, created_at")
      .eq("owner_id", profile.id)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(MAX_EVENTS),
    supabase.from("pages").select("draft").eq("owner_id", profile.id).maybeSingle(),
    supabase.from("short_links").select("id, code, title").eq("owner_id", profile.id),
  ]);

  const summary = summarize((events ?? []) as EventRow[], DAYS);
  const doc = pageDocSchema.safeParse(page?.draft);
  const blockNames = new Map<string, string>();
  if (doc.success) {
    for (const block of doc.data.blocks) {
      blockNames.set(block.id, blockSummary(block) || BLOCK_CATALOG[block.type].label);
    }
  }
  const linkNames = new Map((links ?? []).map((link) => [link.id, link.title || `/l/${link.code}`]));
  const maxDaily = Math.max(1, ...summary.daily.map((day) => day.views));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Estatísticas · últimos {DAYS} dias</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Visitas" value={summary.views.toLocaleString("pt-BR")} />
        <Stat label="Cliques" value={summary.clicks.toLocaleString("pt-BR")} />
        <Stat
          label="Taxa de clique"
          value={`${(summary.clickRate * 100).toFixed(1).replace(".", ",")}%`}
          hint="Visitas com pelo menos um clique"
        />
      </div>

      <section className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
        <h2 className="mb-4 font-semibold">Visitas por dia</h2>
        <div className="flex h-40 items-end gap-1" role="img" aria-label="Gráfico de visitas por dia">
          {summary.daily.map((day) => (
            <div
              key={day.day}
              title={`${day.day.split("-").reverse().join("/")}: ${day.views} visitas, ${day.clicks} cliques`}
              className="flex-1 rounded-t bg-stone-800"
              style={{ height: `${Math.max(2, (day.views / maxDaily) * 100)}%` }}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Ranking
          title="Cliques por bloco"
          rows={[...summary.byBlock].map(([id, count]) => [blockNames.get(id) ?? "Bloco removido", count])}
        />
        <Ranking
          title="Cliques nas redes"
          rows={[...summary.bySocial].map(([platform, count]) => [
            SOCIAL_LABELS[platform as SocialPlatform] ?? platform,
            count,
          ])}
        />
        <Ranking
          title="Links curtos"
          rows={[...summary.byShortLink].map(([id, count]) => [linkNames.get(id) ?? "Link removido", count])}
        />
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-stone-500">{hint}</p> : null}
    </div>
  );
}

function Ranking({ title, rows }: { title: string; rows: [string, number][] }) {
  const sorted = rows.sort((a, b) => b[1] - a[1]).slice(0, 10);
  return (
    <section className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {sorted.length === 0 ? <p className="text-sm text-stone-500">Sem cliques ainda.</p> : null}
      <ol className="flex flex-col gap-2 text-sm">
        {sorted.map(([name, count], index) => (
          <li key={`${name}-${index}`} className="flex justify-between gap-3">
            <span className="truncate">{name}</span>
            <span className="tabular-nums text-stone-600">{count}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
