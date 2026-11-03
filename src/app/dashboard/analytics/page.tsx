import Link from "next/link";
import { LiveVisitors } from "./LiveVisitors";
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

  // Visitors active in the last 5 minutes (seeds the live banner).
  const fiveMinAgo = new Date(now.getTime() - 5 * 60_000).toISOString();
  const initialLive = new Set(
    events.filter((e) => e.kind === "page_view" && e.created_at >= fiveMinAgo).map((e) => e.visit_id).filter(Boolean),
  ).size;

  // Average time on page — a separate, error-tolerant query so a missing
  // duration_ms column (migration 0010 not run) never breaks the dashboard.
  const { data: sessions } = await supabase
    .from("events")
    .select("duration_ms, created_at")
    .eq("owner_id", profile.id)
    .eq("kind", "session")
    .gte("created_at", prevStart.toISOString())
    .limit(5000);
  const sessionRows = (sessions ?? []) as { duration_ms: number | null; created_at: string }[];
  const avgDuration = (fromIso: string, toIso?: string) => {
    const s = sessionRows.filter((r) => r.duration_ms != null && r.created_at >= fromIso && (!toIso || r.created_at < toIso));
    return s.length ? s.reduce((a, r) => a + (r.duration_ms ?? 0), 0) / s.length : 0;
  };
  const avgMs = avgDuration(windowStart.toISOString());
  const prevAvgMs = avgDuration(prevStart.toISOString(), windowStart.toISOString());
  const fmtDur = (ms: number) => {
    const sec = Math.round(ms / 1000);
    if (sec <= 0) return "—";
    if (sec < 60) return `${sec}s`;
    return `${Math.floor(sec / 60)}min ${sec % 60}s`;
  };

  // Visitor location — a separate, error-tolerant query so missing country/city
  // columns (migration 0011 not run) never break the dashboard.
  const { data: geoData } = await supabase
    .from("events")
    .select("country, city")
    .eq("owner_id", profile.id)
    .eq("kind", "page_view")
    .gte("created_at", windowStart.toISOString())
    .not("country", "is", null)
    .limit(5000);
  const geoRows = (geoData ?? []) as { country: string | null; city: string | null }[];
  const byCountry = new Map<string, number>();
  const byCity = new Map<string, number>();
  for (const r of geoRows) {
    if (r.country) byCountry.set(r.country, (byCountry.get(r.country) ?? 0) + 1);
    if (r.city) {
      const key = r.country ? `${r.city}|${r.country}` : r.city;
      byCity.set(key, (byCity.get(key) ?? 0) + 1);
    }
  }
  const countries = [...byCountry].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxCountry = Math.max(1, ...countries.map(([, n]) => n));
  const cities = [...byCity].sort((a, b) => b[1] - a[1]).slice(0, 6);

  // Device and campaign — error-tolerant (missing columns before migration 0012).
  const { data: uaData } = await supabase
    .from("events")
    .select("device, browser, utm_source, utm_campaign")
    .eq("owner_id", profile.id)
    .eq("kind", "page_view")
    .gte("created_at", windowStart.toISOString())
    .limit(5000);
  const uaRows = (uaData ?? []) as {
    device: string | null;
    browser: string | null;
    utm_source: string | null;
    utm_campaign: string | null;
  }[];
  const byDevice = new Map<string, number>();
  const byBrowser = new Map<string, number>();
  const byUtmSource = new Map<string, number>();
  const byCampaign = new Map<string, number>();
  for (const r of uaRows) {
    if (r.device) byDevice.set(r.device, (byDevice.get(r.device) ?? 0) + 1);
    if (r.browser) byBrowser.set(r.browser, (byBrowser.get(r.browser) ?? 0) + 1);
    if (r.utm_source) byUtmSource.set(r.utm_source, (byUtmSource.get(r.utm_source) ?? 0) + 1);
    if (r.utm_campaign) byCampaign.set(r.utm_campaign, (byCampaign.get(r.utm_campaign) ?? 0) + 1);
  }
  const devices = [...byDevice].sort((a, b) => b[1] - a[1]);
  const maxDevice = Math.max(1, ...devices.map(([, n]) => n));
  const browsers = [...byBrowser].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const campaignSources = [...byUtmSource].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const campaigns = [...byCampaign].sort((a, b) => b[1] - a[1]).slice(0, 6);

  // Clicks per link over the last 30 days, to show distinct people this week
  // and this month regardless of the selected window.
  const monthAgoIso = new Date(now.getTime() - 30 * 86_400_000).toISOString();
  const weekAgoIso = new Date(now.getTime() - 7 * 86_400_000).toISOString();
  const { data: linkClickData } = await supabase
    .from("events")
    .select("block_id, visit_id, created_at")
    .eq("owner_id", profile.id)
    .eq("kind", "block_click")
    .gte("created_at", monthAgoIso)
    .limit(20000);
  const linkClicks = (linkClickData ?? []) as { block_id: string | null; visit_id: string | null; created_at: string }[];

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

  // Distinct people per link, this week and this month.
  const linkAgg = new Map<string, { week: Set<string>; month: Set<string> }>();
  for (const c of linkClicks) {
    if (!c.block_id) continue;
    let entry = linkAgg.get(c.block_id);
    if (!entry) {
      entry = { week: new Set(), month: new Set() };
      linkAgg.set(c.block_id, entry);
    }
    const who = c.visit_id ?? c.created_at;
    entry.month.add(who);
    if (c.created_at >= weekAgoIso) entry.week.add(who);
  }
  const linkRows = [...linkAgg]
    .map(([id, s]) => ({ name: blockNames.get(id) ?? "Bloco removido", type: blockTypes.get(id), week: s.week.size, month: s.month.size }))
    .sort((a, b) => b.month - a.month)
    .slice(0, 12);

  // Peak hours: a weekday × hour grid of page views, in Brasília time.
  const heat: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  let heatMax = 0;
  const heatFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", weekday: "short", hour: "2-digit", hour12: false });
  const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (const e of current) {
    if (e.kind !== "page_view") continue;
    const parts = heatFmt.formatToParts(new Date(e.created_at));
    const wd = WD.indexOf(parts.find((p) => p.type === "weekday")?.value ?? "");
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0") % 24;
    if (wd < 0) continue;
    heat[wd][hour] += 1;
    if (heat[wd][hour] > heatMax) heatMax = heat[wd][hour];
  }

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

  const activity = current
    .filter((e) => e.kind !== "session")
    .slice(0, 8)
    .map((e) => describe(e, blockNames, linkNames))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

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

      <LiveVisitors initial={initialLive} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label="Visitas" value={summary.views} delta={pctChange(summary.views, prev.views)} spark={summary.daily.map((d) => d.views)} sparkColor="#2563eb" />
        <Kpi label="Visitantes" value={summary.visitors} delta={pctChange(summary.visitors, prev.visitors)} hint="Pessoas diferentes" />
        <Kpi label="Toques em botões" value={summary.clicks} delta={pctChange(summary.clicks, prev.clicks)} spark={summary.daily.map((d) => d.clicks)} sparkColor="#111827" />
        <Kpi
          label="Visitas com toque"
          value={`${(summary.clickRate * 100).toFixed(1).replace(".", ",")}%`}
          delta={pctChange(summary.clickRate, prev.clickRate)}
          hint="Visitas com ao menos um toque"
        />
        <Kpi label="Tempo médio" value={fmtDur(avgMs)} delta={pctChange(avgMs, prevAvgMs)} hint="Na sua página" />
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

      <Heatmap heat={heat} max={heatMax} />

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

      <section className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
        <h2 className="font-semibold">Pessoas por link</h2>
        <p className="mb-3 text-xs text-stone-500">Quantas pessoas diferentes clicaram em cada link.</p>
        {linkRows.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone-500">Sem cliques nos últimos 30 dias.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-400">
                <th className="pb-2 font-medium">Link</th>
                <th className="pb-2 text-right font-medium">Esta semana</th>
                <th className="pb-2 pl-3 text-right font-medium">Este mês</th>
              </tr>
            </thead>
            <tbody>
              {linkRows.map((r, i) => (
                <tr key={i} className="border-b border-stone-100 last:border-0">
                  <td className="py-2.5">
                    <span className="font-medium">{r.name}</span>
                    {r.type ? <span className="ml-2 text-xs text-stone-400">{BLOCK_CATALOG[r.type].label}</span> : null}
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{r.week.toLocaleString("pt-BR")}</td>
                  <td className="py-2.5 pl-3 text-right tabular-nums">{r.month.toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
        <h2 className="mb-3 font-semibold">Sessões por local</h2>
        {countries.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone-500">
            Sem dados de localização ainda — vão aparecer conforme as novas visitas chegarem.
          </p>
        ) : (
          <>
            <WorldMap countries={countries} />
            <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Países</p>
              <ul className="flex flex-col gap-2.5 text-sm">
                {countries.map(([cc, count]) => (
                  <li key={cc} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 truncate">
                      {flagEmoji(cc)} {countryName(cc)}
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
                      <span className="block h-full rounded-full bg-[#2563eb]" style={{ width: `${(count / maxCountry) * 100}%` }} />
                    </span>
                    <span className="w-10 text-right tabular-nums text-stone-500">{count.toLocaleString("pt-BR")}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Cidades</p>
              {cities.length === 0 ? (
                <p className="text-sm text-stone-500">Sem cidade identificada.</p>
              ) : (
                <ol className="flex flex-col gap-2 text-sm">
                  {cities.map(([key, count]) => {
                    const [city, cc] = key.split("|");
                    return (
                      <li key={key} className="flex justify-between gap-3">
                        <span className="truncate">
                          {cc ? `${flagEmoji(cc)} ` : ""}
                          {city}
                        </span>
                        <span className="tabular-nums text-stone-600">{count.toLocaleString("pt-BR")}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
            </div>
          </>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
          <h2 className="mb-3 font-semibold">Dispositivos</h2>
          {devices.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone-500">Sem dados de dispositivo ainda.</p>
          ) : (
            <>
              <ul className="flex flex-col gap-2.5 text-sm">
                {devices.map(([name, count]) => (
                  <li key={name} className="flex items-center gap-3">
                    <span className="w-24 shrink-0">{name}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
                      <span className="block h-full rounded-full bg-[#2563eb]" style={{ width: `${(count / maxDevice) * 100}%` }} />
                    </span>
                    <span className="w-10 text-right tabular-nums text-stone-500">{count.toLocaleString("pt-BR")}</span>
                  </li>
                ))}
              </ul>
              {browsers.length ? (
                <div className="mt-4 border-t border-stone-100 pt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Navegadores</p>
                  <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-600">
                    {browsers.map(([name, count]) => (
                      <li key={name} className="tabular-nums">
                        {name} <span className="text-stone-400">{count.toLocaleString("pt-BR")}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          )}
        </section>

        <section className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
          <h2 className="mb-3 font-semibold">Campanhas</h2>
          {campaignSources.length === 0 && campaigns.length === 0 ? (
            <div className="py-4 text-sm text-stone-500">
              <p>Nenhuma campanha ainda.</p>
              <p className="mt-2">
                Adicione <code className="rounded bg-stone-100 px-1">?utm_source=instagram&amp;utm_campaign=promo</code> no fim do seu
                link ao divulgar — assim dá para medir de qual post/anúncio veio cada visita.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {campaignSources.length ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Origem (utm_source)</p>
                  <ul className="flex flex-col gap-1.5 text-sm">
                    {campaignSources.map(([name, count]) => (
                      <li key={name} className="flex justify-between gap-3">
                        <span className="truncate">{name}</span>
                        <span className="tabular-nums text-stone-600">{count.toLocaleString("pt-BR")}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {campaigns.length ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Campanha (utm_campaign)</p>
                  <ul className="flex flex-col gap-1.5 text-sm">
                    {campaigns.map(([name, count]) => (
                      <li key={name} className="flex justify-between gap-3">
                        <span className="truncate">{name}</span>
                        <span className="tabular-nums text-stone-600">{count.toLocaleString("pt-BR")}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
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

function Kpi({
  label,
  value,
  delta,
  hint,
  spark,
  sparkColor = "#2563eb",
}: {
  label: string;
  value: number | string;
  delta: number | null;
  hint?: string;
  spark?: number[];
  sparkColor?: string;
}) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
      <p className="text-sm text-stone-500">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-3xl font-bold tabular-nums">{typeof value === "number" ? value.toLocaleString("pt-BR") : value}</p>
        <Delta value={delta} />
      </div>
      {spark && spark.some((v) => v > 0) ? (
        <div className="mt-2">
          <Spark data={spark} color={sparkColor} />
        </div>
      ) : hint ? (
        <p className="mt-1 text-xs text-stone-400">{hint}</p>
      ) : null}
    </div>
  );
}

function Spark({ data, color }: { data: number[]; color: string }) {
  const n = data.length;
  const max = Math.max(1, ...data);
  const x = (i: number) => (n <= 1 ? 50 : (i / (n - 1)) * 100);
  const y = (v: number) => 28 - (v / max) * 24 - 2;
  const line = data.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L 100 28 L 0 28 Z`;
  const id = `spark-${color.replace("#", "")}`;
  return (
    <svg viewBox="0 0 100 28" className="h-7 w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.2" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
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
  const daily = summary.daily;
  const n = daily.length;
  const max = Math.max(1, ...daily.map((d) => Math.max(d.views, d.clicks)));
  const W = 600;
  const H = 180;
  const padX = 4;
  const padTop = 10;
  const x = (i: number) => (n <= 1 ? W / 2 : (i / (n - 1)) * (W - padX * 2) + padX);
  const y = (v: number) => H - (v / max) * (H - padTop) - 2;
  const buildLine = (sel: (d: (typeof daily)[number]) => number) =>
    daily.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(sel(d)).toFixed(1)}`).join(" ");
  const viewsLine = buildLine((d) => d.views);
  const viewsArea = `${viewsLine} L ${x(n - 1).toFixed(1)} ${H} L ${x(0).toFixed(1)} ${H} Z`;
  const clicksLine = buildLine((d) => d.clicks);
  const step = n > 30 ? 10 : n > 10 ? 5 : 2;
  const labels = daily.filter((_, i) => i % step === 0);
  return (
    <section className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Visitas e cliques por dia</h2>
        <div className="flex gap-4 text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 rounded-full bg-[#2563eb]" /> Visitas
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 rounded-full bg-stone-800" /> Cliques
          </span>
        </div>
      </div>
      <div className="relative">
        <span className="absolute left-0 top-0 text-[10px] text-stone-400">{max.toLocaleString("pt-BR")}</span>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-48 w-full" preserveAspectRatio="none" role="img" aria-label="Gráfico de visitas e cliques por dia">
          <defs>
            <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2563eb" stopOpacity="0.22" />
              <stop offset="1" stopColor="#2563eb" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={viewsArea} fill="url(#viewsFill)" />
          <path d={viewsLine} fill="none" stroke="#2563eb" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
          <path d={clicksLine} fill="none" stroke="#111827" strokeWidth="1.5" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-stone-400">
        {labels.map((d) => (
          <span key={d.day}>
            {d.day.slice(8, 10)}/{d.day.slice(5, 7)}
          </span>
        ))}
      </div>
    </section>
  );
}

function Heatmap({ heat, max }: { heat: number[][]; max: number }) {
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const cols = { gridTemplateColumns: "repeat(24, minmax(0, 1fr))" } as const;
  const color = (v: number) => {
    if (v <= 0) return "#f5f5f4";
    const t = 0.18 + 0.82 * (v / max);
    return `rgba(37, 99, 235, ${t.toFixed(2)})`;
  };
  return (
    <section className="overflow-x-auto rounded-xl bg-white p-4 ring-1 ring-stone-200">
      <h2 className="mb-1 font-semibold">Horários de pico</h2>
      <p className="mb-3 text-xs text-stone-500">Quando as pessoas mais acessam (horário de Brasília).</p>
      {max === 0 ? (
        <p className="py-6 text-center text-sm text-stone-500">Ainda sem visitas suficientes para o mapa.</p>
      ) : (
        <div className="min-w-[560px]">
          <div className="flex">
            <span className="w-10 shrink-0" />
            <div className="grid flex-1 gap-[2px]" style={cols}>
              {Array.from({ length: 24 }).map((_, h) => (
                <span key={h} className="text-center text-[9px] text-stone-400">
                  {h % 6 === 0 ? `${h}h` : ""}
                </span>
              ))}
            </div>
          </div>
          {days.map((d, wd) => (
            <div key={d} className="mt-[2px] flex items-center">
              <span className="w-10 shrink-0 text-xs text-stone-500">{d}</span>
              <div className="grid flex-1 gap-[2px]" style={cols}>
                {heat[wd].map((v, h) => (
                  <span
                    key={h}
                    className="aspect-square rounded-[2px]"
                    style={{ background: color(v) }}
                    title={`${d}, ${h}h — ${v} ${v === 1 ? "visita" : "visitas"}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
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

// ISO-3166 alpha-2 → emoji flag (regional indicator letters).
function flagEmoji(cc: string): string {
  if (!/^[A-Za-z]{2}$/.test(cc)) return "🌐";
  const base = 0x1f1e6;
  return String.fromCodePoint(...[...cc.toUpperCase()].map((c) => base + c.charCodeAt(0) - 65));
}

const COUNTRY_NAMES: Record<string, string> = {
  BR: "Brasil",
  PT: "Portugal",
  US: "Estados Unidos",
  AR: "Argentina",
  CL: "Chile",
  CO: "Colômbia",
  MX: "México",
  UY: "Uruguai",
  PY: "Paraguai",
  PE: "Peru",
  ES: "Espanha",
  GB: "Reino Unido",
  FR: "França",
  DE: "Alemanha",
  IT: "Itália",
  CA: "Canadá",
  JP: "Japão",
  AU: "Austrália",
  AO: "Angola",
  MZ: "Moçambique",
};
function countryName(cc: string): string {
  return COUNTRY_NAMES[cc.toUpperCase()] ?? cc.toUpperCase();
}

// Rough continent blobs (equirectangular, in degrees) used to draw a dotted
// world map. Each is [centerLon, centerLat, radiusLon, radiusLat]; a grid point
// is "land" when it falls inside any blob.
const CONTINENTS: [number, number, number, number][] = [
  [-100, 45, 34, 20], // North America
  [-95, 62, 32, 13], // Canada
  [-85, 14, 11, 9], // Central America
  [-42, 72, 12, 9], // Greenland
  [-60, -15, 17, 30], // South America
  [-66, 3, 13, 11], // northern South America
  [15, 52, 27, 13], // Europe
  [18, 2, 23, 33], // Africa
  [95, 50, 52, 26], // Asia
  [80, 22, 12, 14], // India
  [112, 8, 17, 11], // Southeast Asia
  [134, -25, 17, 11], // Australia
];
function isLand(lon: number, lat: number): boolean {
  return CONTINENTS.some(([cx, cy, rx, ry]) => ((lon - cx) / rx) ** 2 + ((lat - cy) / ry) ** 2 <= 1);
}

// Approximate country centroids [lon, lat] for placing pins.
const CENTROIDS: Record<string, [number, number]> = {
  BR: [-52, -10], PT: [-8, 39.5], US: [-98, 39], AR: [-64, -38], CL: [-71, -35], CO: [-73, 4],
  MX: [-102, 23], UY: [-56, -33], PY: [-58, -23], PE: [-76, -10], ES: [-4, 40], GB: [-2, 54],
  FR: [2, 47], DE: [10, 51], IT: [12, 42], CA: [-106, 56], JP: [138, 36], AU: [134, -25],
  AO: [17, -12], MZ: [35, -18],
};

// A dotted world map with a pin per country, sized by sessions.
function WorldMap({ countries }: { countries: [string, number][] }) {
  const max = Math.max(1, ...countries.map(([, n]) => n));
  const lats: number[] = [];
  for (let lat = 78; lat >= -56; lat -= 4) lats.push(lat);
  const lons: number[] = [];
  for (let lon = -170; lon <= 178; lon += 4) lons.push(lon);
  const dots = lats.flatMap((lat) =>
    lons
      .filter((lon) => isLand(lon, lat))
      .map((lon) => <circle key={`${lon},${lat}`} cx={lon + 180} cy={90 - lat} r={1.1} className="fill-stone-300" />),
  );
  const pins = countries
    .filter(([cc]) => CENTROIDS[cc])
    .map(([cc, count]) => {
      const [lon, lat] = CENTROIDS[cc];
      const r = 2.2 + (count / max) * 5;
      return (
        <g key={cc}>
          <circle cx={lon + 180} cy={90 - lat} r={r + 2} fill="#2563eb" fillOpacity={0.15} />
          <circle cx={lon + 180} cy={90 - lat} r={r} fill="#2563eb" stroke="#fff" strokeWidth={0.8}>
            <title>{`${countryName(cc)}: ${count.toLocaleString("pt-BR")} ${count === 1 ? "sessão" : "sessões"}`}</title>
          </circle>
        </g>
      );
    });
  return (
    <div className="mb-5 overflow-hidden rounded-xl bg-stone-50 ring-1 ring-stone-100">
      <svg viewBox="8 14 344 150" className="h-56 w-full" role="img" aria-label="Mapa de sessões por país">
        {dots}
        {pins}
      </svg>
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
