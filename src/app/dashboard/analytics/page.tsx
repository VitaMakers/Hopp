import Link from "next/link";
import { pctChange, referrerName, summarize, type EventRow, type Summary } from "@/lib/analytics";
import { hasFullAnalytics } from "@/lib/entitlements";
import { BLOCK_CATALOG, SOCIAL_LABELS, blockSummary } from "@/lib/page/catalog";
import { pageDocSchema, type BlockType, type SocialPlatform } from "@/lib/page/schema";
import { getOwner } from "../context";

const WINDOWS = [7, 30, 90] as const;
// Enough for small pages; large accounts will need SQL aggregation instead.
const MAX_EVENTS = 50_000;

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const params = await searchParams;
  const days = WINDOWS.includes(Number(params.days) as (typeof WINDOWS)[number]) ? Number(params.days) : 30;
  const { supabase, profile } = await getOwner();

  // Free plan: only the total visit count, nothing else.
  if (!hasFullAnalytics(profile.plan)) {
    const { count } = await supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", profile.id)
      .eq("kind", "page_view");
    return <FreeAnalytics visits={count ?? 0} />;
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - days * 86_400_000);
  const prevStart = new Date(now.getTime() - 2 * days * 86_400_000);
  const [{ data: allEvents }, { data: page }, { data: links }] = await Promise.all([
    supabase
      .from("events")
      .select("kind, block_id, short_link_id, target, referrer, visit_id, created_at")
      .eq("owner_id", profile.id)
      .gte("created_at", prevStart.toISOString())
      .order("created_at", { ascending: false })
      .limit(MAX_EVENTS),
    supabase.from("pages").select("draft").eq("owner_id", profile.id).maybeSingle(),
    supabase.from("short_links").select("id, code, title").eq("owner_id", profile.id),
  ]);

  const events = (allEvents ?? []) as EventRow[];
  const current = events.filter((e) => e.created_at >= windowStart.toISOString());
  const previous = events.filter((e) => e.created_at < windowStart.toISOString());
  const summary = summarize(current, days, now);
  const prev = summarize(previous, days, windowStart);

  const doc = pageDocSchema.safeParse(page?.draft);
  const blockNames = new Map<string, string>();
  const blockTypes = new Map<string, BlockType>();
  if (doc.success) {
    for (const block of doc.data.blocks) {
      blockNames.set(block.id, blockSummary(block) || BLOCK_CATALOG[block.type].label);
      blockTypes.set(block.id, block.type);
    }
  }
  const linkNames = new Map((links ?? []).map((link) => [link.id, link.title || `/l/${link.code}`]));

  const sum = (map: Map<string, number>) => [...map.values()].reduce((a, b) => a + b, 0);
  const donut = [
    { label: "Blocos", value: sum(summary.byBlock), color: "#1f2937" },
    { label: "Redes sociais", value: sum(summary.bySocial), color: "#3b6ef5" },
    { label: "Links curtos", value: sum(summary.byShortLink), color: "#22c55e" },
  ].filter((s) => s.value > 0);

  const topBlocks = [...summary.byBlock]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id, count]) => ({ name: blockNames.get(id) ?? "Bloco removido", type: blockTypes.get(id), count }));
  const totalBlockClicks = sum(summary.byBlock);

  const sources = [...summary.byReferrer].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxSource = Math.max(1, ...sources.map(([, n]) => n));

  const activity = current.slice(0, 8).map((e) => describe(e, blockNames, linkNames));

  // "O que pede atenção": short, data-driven insights.
  const insights: string[] = [];
  if (topBlocks.length && totalBlockClicks) {
    const share = Math.round((topBlocks[0].count / totalBlockClicks) * 100);
    insights.push(`Seu botão mais tocado é “${topBlocks[0].name}” (${share}% dos toques).`);
  }
  const dViews = pctChange(summary.views, prev.views);
  if (dViews !== null && isFinite(dViews) && Math.abs(dViews) >= 5) {
    insights.push(`Visitas ${dViews > 0 ? "subiram" : "caíram"} ${Math.abs(dViews).toFixed(0)}% vs o período anterior.`);
  }
  const cr = Math.round(summary.clickRate * 100);
  if (summary.views > 0) {
    const before = prev.views > 0 ? ` (antes ${Math.round(prev.clickRate * 100)}%)` : "";
    insights.push(`${cr}% de quem visita toca em algo${before}.`);
  }
  if (sources.length) insights.push(`A maior parte das visitas vem de ${sources[0][0]}.`);
  if (summary.clicks === 0) insights.push("Ainda sem toques — compartilhe seu link para começar a receber dados.");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">O que as pessoas fazem na sua página</h1>
          <p className="text-sm text-stone-500">Comparado com o período anterior.</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-stone-100 p-1">
          {WINDOWS.map((w) => (
            <Link
              key={w}
              href={`?days=${w}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${w === days ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-900"}`}
            >
              {w} dias
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Visitas" value={summary.views} delta={pctChange(summary.views, prev.views)} />
        <Kpi label="Visitantes" value={summary.visitors} delta={pctChange(summary.visitors, prev.visitors)} hint="Pessoas diferentes" />
        <Kpi label="Toques em botões" value={summary.clicks} delta={pctChange(summary.clicks, prev.clicks)} />
        <Kpi
          label="Visitas com toque"
          value={`${(summary.clickRate * 100).toFixed(1).replace(".", ",")}%`}
          delta={pctChange(summary.clickRate, prev.clickRate)}
          hint="Visitas com ao menos um toque"
        />
      </div>

      {insights.length ? (
        <section className="rounded-xl bg-stone-900 p-5 text-white">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-300">O que pede atenção</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {insights.map((text, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <DailyChart summary={summary} />

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="rounded-xl bg-white p-4 ring-1 ring-stone-200 lg:col-span-3">
          <h2 className="mb-3 font-semibold">Toques por botão</h2>
          {topBlocks.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone-500">Sem cliques ainda. Compartilhe o seu link para começar.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-400">
                  <th className="pb-2 font-medium">Bloco</th>
                  <th className="pb-2 text-right font-medium">Cliques</th>
                  <th className="hidden pb-2 pl-3 font-medium sm:table-cell">Participação</th>
                </tr>
              </thead>
              <tbody>
                {topBlocks.map((row, index) => {
                  const share = totalBlockClicks ? Math.round((row.count / totalBlockClicks) * 100) : 0;
                  return (
                    <tr key={index} className="border-b border-stone-100 last:border-0">
                      <td className="py-2.5">
                        <span className="font-medium">{row.name}</span>
                        {row.type ? <span className="ml-2 text-xs text-stone-400">{BLOCK_CATALOG[row.type].label}</span> : null}
                      </td>
                      <td className="py-2.5 text-right tabular-nums">{row.count.toLocaleString("pt-BR")}</td>
                      <td className="hidden py-2.5 pl-3 sm:table-cell">
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                            <span className="block h-full rounded-full bg-stone-800" style={{ width: `${share}%` }} />
                          </span>
                          <span className="w-9 text-right text-xs tabular-nums text-stone-500">{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <section className="rounded-xl bg-white p-4 ring-1 ring-stone-200 lg:col-span-2">
          <h2 className="mb-3 font-semibold">Distribuição de cliques</h2>
          {donut.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone-500">Sem cliques ainda.</p>
          ) : (
            <div className="flex items-center gap-4">
              <Donut segments={donut} />
              <ul className="flex flex-1 flex-col gap-2 text-sm">
                {donut.map((s) => (
                  <li key={s.label} className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: s.color }} />
                    <span className="flex-1 truncate">{s.label}</span>
                    <span className="tabular-nums text-stone-500">{s.value.toLocaleString("pt-BR")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
          <h2 className="mb-3 font-semibold">Fontes de tráfego</h2>
          {sources.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone-500">Sem visitas ainda.</p>
          ) : (
            <ul className="flex flex-col gap-2.5 text-sm">
              {sources.map(([name, count]) => (
                <li key={name} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate">{name}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
                    <span className="block h-full rounded-full bg-[#3b6ef5]" style={{ width: `${(count / maxSource) * 100}%` }} />
                  </span>
                  <span className="w-10 text-right tabular-nums text-stone-500">{count.toLocaleString("pt-BR")}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
          <h2 className="mb-3 font-semibold">Atividade recente</h2>
          {activity.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone-500">Nada ainda.</p>
          ) : (
            <ul className="flex flex-col gap-3 text-sm">
              {activity.map((item, index) => (
                <li key={index} className="flex items-start justify-between gap-3">
                  <span className="flex items-start gap-2.5">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} />
                    <span>{item.text}</span>
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-xs text-stone-400">{item.when}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Ranking
          title="Cliques nas redes"
          rows={[...summary.bySocial].map(([platform, count]) => [SOCIAL_LABELS[platform as SocialPlatform] ?? platform, count])}
        />
        <Ranking title="Links curtos" rows={[...summary.byShortLink].map(([id, count]) => [linkNames.get(id) ?? "Link removido", count])} />
      </div>
    </div>
  );
}

function Kpi({ label, value, delta, hint }: { label: string; value: number | string; delta: number | null; hint?: string }) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
      <p className="text-sm text-stone-500">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-3xl font-bold tabular-nums">{typeof value === "number" ? value.toLocaleString("pt-BR") : value}</p>
        <Delta value={delta} />
      </div>
      {hint ? <p className="mt-1 text-xs text-stone-400">{hint}</p> : null}
    </div>
  );
}

function Delta({ value }: { value: number | null }) {
  if (value === null || !isFinite(value) || Math.abs(value) < 0.05) {
    return <span className="pb-1 text-xs text-stone-400">—</span>;
  }
  const up = value > 0;
  return (
    <span className={`pb-1 text-xs font-semibold tabular-nums ${up ? "text-emerald-600" : "text-red-500"}`}>
      {up ? "▲" : "▼"} {Math.abs(value).toFixed(0)}%
    </span>
  );
}

function DailyChart({ summary }: { summary: Summary }) {
  const max = Math.max(1, ...summary.daily.map((d) => Math.max(d.views, d.clicks)));
  const n = summary.daily.length;
  const step = n > 30 ? 10 : n > 10 ? 5 : 2;
  return (
    <section className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Visitas e cliques por dia</h2>
        <div className="flex gap-4 text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-stone-300" /> Visitas
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-stone-800" /> Cliques
          </span>
        </div>
      </div>
      <div className="flex h-44 items-end gap-[3px]" role="img" aria-label="Gráfico de visitas e cliques por dia">
        {summary.daily.map((day) => (
          <div
            key={day.day}
            title={`${day.day.split("-").reverse().join("/")}: ${day.views} visitas, ${day.clicks} cliques`}
            className="relative flex flex-1 items-end justify-center"
            style={{ height: "100%" }}
          >
            <div className="w-full rounded-t bg-stone-200" style={{ height: `${Math.max(2, (day.views / max) * 100)}%` }} />
            <div className="absolute bottom-0 w-1/2 rounded-t bg-stone-800" style={{ height: `${Math.max(day.clicks ? 2 : 0, (day.clicks / max) * 100)}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-stone-400">
        {summary.daily
          .filter((_, i) => i % step === 0)
          .map((d) => (
            <span key={d.day}>{d.day.slice(8, 10)}/{d.day.slice(5, 7)}</span>
          ))}
      </div>
    </section>
  );
}

function Donut({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let offset = 25; // start at top
  return (
    <svg viewBox="0 0 36 36" className="h-28 w-28 shrink-0 -rotate-0">
      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f0ef" strokeWidth="4" />
      {segments.map((s) => {
        const pct = (s.value / total) * 100;
        const dash = `${pct} ${100 - pct}`;
        const node = (
          <circle
            key={s.label}
            cx="18"
            cy="18"
            r="15.915"
            fill="none"
            stroke={s.color}
            strokeWidth="4"
            strokeDasharray={dash}
            strokeDashoffset={offset}
            transform="rotate(-90 18 18)"
          />
        );
        offset -= pct;
        return node;
      })}
      <text x="18" y="18.5" textAnchor="middle" dominantBaseline="middle" className="fill-stone-700 text-[5px] font-bold">
        {total.toLocaleString("pt-BR")}
      </text>
      <text x="18" y="23" textAnchor="middle" dominantBaseline="middle" className="fill-stone-400 text-[2.6px]">
        cliques
      </text>
    </svg>
  );
}

function describe(e: EventRow, blockNames: Map<string, string>, linkNames: Map<string, string>) {
  const when = relativeTime(e.created_at);
  switch (e.kind) {
    case "page_view":
      return { text: `Nova visita${e.referrer ? ` via ${referrerName(e.referrer)}` : ""}`, when, color: "#3b6ef5" };
    case "block_click":
      return { text: `Clique em “${blockNames.get(e.block_id ?? "") ?? "um bloco"}”`, when, color: "#1f2937" };
    case "social_click":
      return { text: `Clique em ${SOCIAL_LABELS[e.target as SocialPlatform] ?? e.target ?? "rede social"}`, when, color: "#f59e0b" };
    case "short_link_click":
      return { text: `Link curto ${linkNames.get(e.short_link_id ?? "") ?? ""}`.trim(), when, color: "#22c55e" };
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - Date.parse(iso);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  return `${days} d`;
}

function FreeAnalytics({ visits }: { visits: number }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Estatísticas</h1>
        <p className="text-sm text-stone-500">Acompanhe as visitas da sua página.</p>
      </div>
      <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-stone-200">
        <p className="text-sm text-stone-500">Total de visitas</p>
        <p className="mt-1 text-5xl font-bold tabular-nums">{visits.toLocaleString("pt-BR")}</p>
      </div>
      <div className="rounded-xl bg-stone-900 p-5 text-center text-white">
        <p className="font-semibold">Quer ver cliques, visitantes, origem do tráfego e mais?</p>
        <p className="mt-1 text-sm text-stone-300">As estatísticas completas estão nos planos Essencial e Profissional.</p>
        <Link href="/dashboard/plans" className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-semibold text-stone-900">
          Ver planos
        </Link>
      </div>
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
            <span className="tabular-nums text-stone-600">{count.toLocaleString("pt-BR")}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
