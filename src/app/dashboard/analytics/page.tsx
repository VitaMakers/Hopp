import Link from "next/link";
import { GeoPanel, type GeoCity, type GeoCountry } from "./GeoPanel";
import { LiveVisitors } from "./LiveVisitors";
import { COUNTRIES } from "./world";
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
  const geoQuery = (columns: string) =>
    supabase
      .from("events")
      .select(columns)
      .eq("owner_id", profile.id)
      .eq("kind", "page_view")
      .gte("created_at", windowStart.toISOString())
      .not("country", "is", null)
      .limit(5000);
  // The position columns are newer (migration 0016): fall back without them.
  let { data: geoData, error: geoError } = await geoQuery("country, city, lat, lon");
  if (geoError) ({ data: geoData, error: geoError } = await geoQuery("country, city"));
  const geoRows = (geoData ?? []) as unknown as { country: string | null; city: string | null; lat?: number | null; lon?: number | null }[];
  // Each city with its visits and, when known, where it is.
  const cityAgg = new Map<string, { city: string; cc: string; count: number; lat: number; lon: number; located: number }>();
  for (const r of geoRows) {
    if (!r.city || !r.country) continue;
    const key = `${r.city}|${r.country}`;
    const entry = cityAgg.get(key) ?? { city: r.city, cc: r.country, count: 0, lat: 0, lon: 0, located: 0 };
    entry.count += 1;
    if (typeof r.lat === "number" && typeof r.lon === "number") {
      entry.lat += r.lat;
      entry.lon += r.lon;
      entry.located += 1;
    }
    cityAgg.set(key, entry);
  }
  const geoCities: GeoCity[] = [...cityAgg.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 120)
    .map((c) => ({ city: c.city, cc: c.cc, count: c.count, lat: c.located ? c.lat / c.located : null, lon: c.located ? c.lon / c.located : null }));
  const byCountry = new Map<string, number>();
  const byCity = new Map<string, number>();
  for (const r of geoRows) {
    if (r.country) byCountry.set(r.country, (byCountry.get(r.country) ?? 0) + 1);
    if (r.city) {
      const key = r.country ? `${r.city}|${r.country}` : r.city;
      byCity.set(key, (byCity.get(key) ?? 0) + 1);
    }
  }
  const geoCountries: GeoCountry[] = [...byCountry]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([cc, count]) => ({ cc, name: countryName(cc), count, box: COUNTRIES[cc]?.b ?? null }));

  // Device and campaign — error-tolerant (missing columns before migration 0012).
  const { data: uaData } = await supabase
    .from("events")
    .select("device, os, browser, utm_source, utm_campaign")
    .eq("owner_id", profile.id)
    .eq("kind", "page_view")
    .gte("created_at", windowStart.toISOString())
    .limit(5000);
  const uaRows = (uaData ?? []) as {
    device: string | null;
    os?: string | null;
    browser: string | null;
    utm_source: string | null;
    utm_campaign: string | null;
  }[];
  const byDevice = new Map<string, number>();
  const byOs = new Map<string, number>();
  const byBrowser = new Map<string, number>();
  const byUtmSource = new Map<string, number>();
  const byCampaign = new Map<string, number>();
  for (const r of uaRows) {
    if (r.device) byDevice.set(r.device, (byDevice.get(r.device) ?? 0) + 1);
    if (r.os) byOs.set(r.os, (byOs.get(r.os) ?? 0) + 1);
    if (r.browser) byBrowser.set(r.browser, (byBrowser.get(r.browser) ?? 0) + 1);
    if (r.utm_source) byUtmSource.set(r.utm_source, (byUtmSource.get(r.utm_source) ?? 0) + 1);
    if (r.utm_campaign) byCampaign.set(r.utm_campaign, (byCampaign.get(r.utm_campaign) ?? 0) + 1);
  }
  const devices = [...byDevice].sort((a, b) => b[1] - a[1]);
  const systems = [...byOs].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const browsers = [...byBrowser].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, n]) => [BROWSER_LABELS[name] ?? name, n] as [string, number]);

  // Phone models and returning visitors come from newer columns (migration
  // 0017): each query stands alone, so the panel works before they exist.
  const { data: modelData } = await supabase
    .from("events")
    .select("model")
    .eq("owner_id", profile.id)
    .eq("kind", "page_view")
    .gte("created_at", windowStart.toISOString())
    .not("model", "is", null)
    .limit(5000);
  const byModel = new Map<string, number>();
  for (const r of (modelData ?? []) as unknown as { model: string | null }[]) {
    if (r.model) byModel.set(modelName(r.model), (byModel.get(modelName(r.model)) ?? 0) + 1);
  }
  const models = [...byModel].sort((a, b) => b[1] - a[1]).slice(0, 6);

  // Returning visitors: clicks in the last 30 days against the 30 before,
  // whatever window is selected above.
  const d30 = new Date(now.getTime() - 30 * 86_400_000).toISOString();
  const d60 = new Date(now.getTime() - 60 * 86_400_000).toISOString();
  const { data: visitorData, error: visitorError } = await supabase
    .from("events")
    .select("kind, block_id, target, visitor_id, created_at, city, device, os, model")
    .eq("owner_id", profile.id)
    .gte("created_at", d60)
    .not("visitor_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(20000);
  type VisitorRow = { kind: string; block_id: string | null; target: string | null; visitor_id: string; created_at: string; city: string | null; device: string | null; os: string | null; model: string | null };
  type Visitor = { id: string; visits: number; visitsBefore: number; now: number; before: number; last: string; city: string; device: string; clicks: Map<string, number> };
  const visitorMap = new Map<string, Visitor>();
  for (const e of (visitorData ?? []) as unknown as VisitorRow[]) {
    let v = visitorMap.get(e.visitor_id);
    if (!v) {
      v = { id: e.visitor_id, visits: 0, visitsBefore: 0, now: 0, before: 0, last: e.created_at, city: "", device: "", clicks: new Map() };
      visitorMap.set(e.visitor_id, v);
    }
    const recent = e.created_at >= d30;
    if (e.kind === "page_view") {
      if (recent) v.visits += 1;
      else v.visitsBefore += 1;
      // Rows arrive newest first: keep the latest city and device.
      if (!v.city && e.city) v.city = e.city;
      if (!v.device) v.device = e.model ? modelName(e.model) : [e.device, e.os].filter(Boolean).join(", ");
    } else if (e.kind === "block_click" || e.kind === "social_click") {
      if (recent) {
        v.now += 1;
        const key = e.kind === "block_click" ? `b:${e.block_id ?? ""}` : `s:${e.target ?? ""}`;
        v.clicks.set(key, (v.clicks.get(key) ?? 0) + 1);
      } else v.before += 1;
    }
  }
  const seenRecently = [...visitorMap.values()].filter((v) => v.visits > 0);
  const returning = seenRecently.filter((v) => v.visits + v.visitsBefore > 1).length;
  const topVisitors = seenRecently
    .filter((v) => v.visits + v.visitsBefore > 1 || v.now > 0)
    .sort((a, b) => b.now - a.now || b.visits - a.visits)
    .slice(0, 12);
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

  // ---- Numbers the highlights add on top of the summary ----
  const spDay = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const todayKey = spDay(now.toISOString());
  const yesterdayKey = spDay(new Date(now.getTime() - 86_400_000).toISOString());
  const dayCount = (kinds: string[], key: string, distinct = false) => {
    const rows = current.filter((e) => kinds.includes(e.kind) && spDay(e.created_at) === key);
    return distinct ? new Set(rows.map((e) => e.visit_id ?? e.created_at)).size : rows.length;
  };
  const CLICK_KINDS = ["block_click", "social_click"];
  const today = { views: dayCount(["page_view"], todayKey), visitors: dayCount(["page_view"], todayKey, true), clicks: dayCount(CLICK_KINDS, todayKey) };
  const yesterday = { views: dayCount(["page_view"], yesterdayKey), visitors: dayCount(["page_view"], yesterdayKey, true), clicks: dayCount(CLICK_KINDS, yesterdayKey) };

  // Average visits per weekday, in Brasília time.
  const weekdayTotals = Array.from({ length: 7 }, () => ({ total: 0, days: new Set<string>() }));
  for (let i = 0; i < days; i++) {
    const d = new Date(now.getTime() - i * 86_400_000);
    const wd = new Date(spDay(d.toISOString()) + "T12:00:00Z").getUTCDay();
    weekdayTotals[wd].days.add(spDay(d.toISOString()));
  }
  for (const e of current) {
    if (e.kind !== "page_view") continue;
    const wd = new Date(spDay(e.created_at) + "T12:00:00Z").getUTCDay();
    weekdayTotals[wd].total += 1;
  }
  const weekdays = ["Dom.", "Seg.", "Ter.", "Qua.", "Qui.", "Sex.", "Sáb."].map((label, i) => ({
    label,
    value: weekdayTotals[i].days.size ? weekdayTotals[i].total / weekdayTotals[i].days.size : 0,
  }));

  const bounce = summary.views ? 1 - summary.clickRate : 0;
  const prevBounce = prev.views ? 1 - prev.clickRate : 0;
  const clicksPerVisit = summary.views ? summary.clicks / summary.views : 0;
  const prevClicksPerVisit = prev.views ? prev.clicks / prev.views : 0;
  const fmtDate = (d: Date) => d.toLocaleDateString("pt-BR", { day: "numeric", month: "short", timeZone: "America/Sao_Paulo" });
  const comparedWith = `${fmtDate(prevStart)} a ${fmtDate(new Date(windowStart.getTime() - 86_400_000))}`;
  const deviceColors = ["#3A55F5", "#58B6E0", "#191A3D", "#B9B6C9"];
  const deviceSegments = devices.map(([label, value], i) => ({ label, value, color: deviceColors[i % deviceColors.length] }));
  const deviceTotal = devices.reduce((a, [, n]) => a + n, 0);

  const panel = "rounded-[14px] border border-[#E5E2DA] bg-white";
  const empty = "py-6 text-center text-sm text-stone-600";

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[30px] font-bold leading-tight tracking-[-0.025em]">Estatísticas</h1>
          <p className="mt-2 text-[15px] text-stone-600">Uma visão geral da atividade da sua página.</p>
        </div>
      </header>

      <LiveVisitors initial={initialLive} />

      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Período" className="inline-flex rounded-[11px] bg-[#E9E7E1] p-[3px]">
          {WINDOWS.map((w) => (
            <Link
              key={w}
              href={`?days=${w}`}
              role="tab"
              aria-selected={w === days}
              className={`flex h-8 items-center rounded-[9px] px-3.5 text-[13px] font-semibold transition-colors ${w === days ? "bg-white text-stone-900" : "text-stone-700 hover:text-stone-900"}`}
            >
              <span className="hidden sm:inline">Últimos&nbsp;</span>
              {w} dias
            </Link>
          ))}
        </div>
        <p className="text-sm text-stone-600">em comparação com o período anterior ({comparedWith})</p>
      </div>

      {/* Principais estatísticas */}
      <section aria-labelledby="principais" className={`${panel} p-5`}>
        <h2 id="principais" className="text-[15px] font-semibold">
          Principais estatísticas
        </h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <Stat label="Sessões da página" value={summary.views} delta={pctChange(summary.views, prev.views)} spark={summary.daily.map((d) => d.views)} today={today.views} yesterday={yesterday.views} />
          <Stat label="Visitantes únicos" value={summary.visitors} delta={pctChange(summary.visitors, prev.visitors)} spark={summary.daily.map((d) => d.views)} today={today.visitors} yesterday={yesterday.visitors} />
          <Stat label="Cliques nos botões" value={summary.clicks} delta={pctChange(summary.clicks, prev.clicks)} spark={summary.daily.map((d) => d.clicks)} today={today.clicks} yesterday={yesterday.clicks} />
        </div>
      </section>

      {/* Conheça seus visitantes */}
      <section aria-labelledby="visitantes" className={`${panel} p-6`}>
        <h2 id="visitantes" className="font-display text-xl font-bold tracking-[-0.02em]">
          Conheça seus visitantes
        </h2>
        <div className="mt-5 grid gap-6 lg:grid-cols-3 lg:gap-0">
          <div className="lg:pr-6">
            <h3 className="text-[15px] font-medium text-stone-800">Sessões ao longo do tempo</h3>
            <AreaChart daily={summary.daily} />
          </div>
          <div className="lg:border-l lg:border-[#EFEDE7] lg:px-6">
            <h3 className="text-[15px] font-medium text-stone-800">Principais fontes de tráfego</h3>
            {sources.length === 0 ? (
              <p className={empty}>Sem visitas ainda.</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-4">
                {sources.slice(0, 5).map(([name, count]) => (
                  <BarRow key={name} name={name} count={count} max={maxSource} delta={pctChange(count, prev.byReferrer.get(name) ?? 0)} />
                ))}
              </ul>
            )}
          </div>
          <div className="lg:border-l lg:border-[#EFEDE7] lg:pl-6">
            <h3 className="text-[15px] font-medium text-stone-800">Sessões por dispositivo</h3>
            {deviceSegments.length === 0 ? (
              <p className={empty}>Sem dados de dispositivo ainda.</p>
            ) : (
              <div className="mt-4 flex items-center gap-5">
                <Donut segments={deviceSegments} caption="sessões" />
                <ul className="flex min-w-0 flex-1 flex-col gap-3 text-sm">
                  {deviceSegments.map((seg) => (
                    <li key={seg.label}>
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: seg.color }} />
                        <span className="truncate">{seg.label}</span>
                      </span>
                      <span className="mt-0.5 block pl-4 text-[13px] text-stone-600">
                        <strong className="font-semibold text-stone-900">{Math.round((seg.value / Math.max(1, deviceTotal)) * 100)}%</strong> · {seg.value.toLocaleString("pt-BR")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Sessões por cidade: mapa */}
      <section aria-labelledby="mapa" className={`${panel} p-6`}>
        <h2 id="mapa" className="font-display text-xl font-bold tracking-[-0.02em]">
          Sessões por cidade
        </h2>
        <div className="mt-5">
          {geoCountries.length === 0 ? (
            <p className={empty}>Sem dados de localização ainda. Eles aparecem conforme as visitas chegam.</p>
          ) : (
            <GeoPanel countries={geoCountries} cities={geoCities}>
              {Object.entries(COUNTRIES).map(([cc, shape]) => (
                <path key={cc} d={shape.d} />
              ))}
            </GeoPanel>
          )}
        </div>
      </section>

      {/* Aparelhos dos visitantes */}
      <section aria-labelledby="aparelhos" className={`${panel} p-6`}>
        <h2 id="aparelhos" className="font-display text-xl font-bold tracking-[-0.02em]">
          Aparelhos dos visitantes
        </h2>
        <div className="mt-5 grid gap-6 lg:grid-cols-3 lg:gap-0">
          <div className="lg:pr-6">
            <h3 className="text-[15px] font-medium text-stone-800">Sistema</h3>
            {systems.length === 0 ? <p className={empty}>Sem dados ainda.</p> : <ShareBars rows={systems.map(([name, n]) => [SYSTEM_LABELS[name] ?? name, n])} />}
          </div>
          <div className="lg:border-l lg:border-[#EFEDE7] lg:px-6">
            <h3 className="text-[15px] font-medium text-stone-800">Modelos de celular</h3>
            {models.length === 0 ? (
              <p className={empty}>Os modelos aparecem para as visitas recebidas a partir de agora.</p>
            ) : (
              <>
                <ShareBars rows={models} />
                <p className="mt-3 text-xs text-stone-600">O iPhone não informa o modelo exato; ele aparece em grupos, pelo tamanho da tela.</p>
              </>
            )}
          </div>
          <div className="lg:border-l lg:border-[#EFEDE7] lg:pl-6">
            <h3 className="text-[15px] font-medium text-stone-800">Navegador</h3>
            {browsers.length === 0 ? <p className={empty}>Sem dados ainda.</p> : <ShareBars rows={browsers} />}
          </div>
        </div>
      </section>

      {/* Visitantes que mais voltam */}
      <section aria-labelledby="recorrentes" className={`${panel} p-6`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 id="recorrentes" className="font-display text-xl font-bold tracking-[-0.02em]">
              Visitantes que mais voltam
            </h2>
            <p className="mt-1.5 text-sm text-stone-600">Cada visitante é um número anônimo, por aparelho. Cliques nos últimos 30 dias, comparados com os 30 anteriores.</p>
          </div>
          {seenRecently.length ? (
            <dl className="flex gap-7 text-sm">
              <div>
                <dt className="text-xs text-stone-600">Visitantes novos</dt>
                <dd>
                  <strong className="text-lg font-semibold tabular-nums">{(seenRecently.length - returning).toLocaleString("pt-BR")}</strong>{" "}
                  <span className="text-stone-600">{Math.round(((seenRecently.length - returning) / seenRecently.length) * 100)}%</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-stone-600">Voltaram</dt>
                <dd>
                  <strong className="text-lg font-semibold tabular-nums">{returning.toLocaleString("pt-BR")}</strong>{" "}
                  <span className="text-stone-600">{Math.round((returning / seenRecently.length) * 100)}%</span>
                </dd>
              </div>
            </dl>
          ) : null}
        </div>

        {visitorError || topVisitors.length === 0 ? (
          <p className={`${empty} mt-2`}>
            {visitorError || seenRecently.length === 0
              ? "A contagem por visitante começa com as visitas recebidas a partir de agora."
              : "Ainda ninguém voltou à página nem clicou nos últimos 30 dias."}
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <div className="min-w-[720px]">
              <div className={`${VISITOR_GRID} border-b border-[#E5E2DA] pb-2.5 text-xs font-semibold text-stone-600`}>
                <span>Visitante</span>
                <span>Aparelho</span>
                <span>Cidade</span>
                <span className="text-right">Visitas</span>
                <span className="text-right">Cliques este mês</span>
                <span className="text-right">Mês passado</span>
                <span className="text-right">Última visita</span>
              </div>
              {topVisitors.map((v) => (
                <details key={v.id} className="group border-b border-[#EFEDE7] open:bg-[#F7F7FD]">
                  <summary className={`${VISITOR_GRID} cursor-pointer list-none py-3.5 text-sm marker:hidden hover:bg-[#F7F7FD] [&::-webkit-details-marker]:hidden`}>
                    <span className="flex items-center gap-2 font-semibold">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-stone-600 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="m9 6 6 6-6 6" />
                      </svg>
                      Visitante nº {visitorNumber(v.id)}
                    </span>
                    <span className="truncate text-stone-700">{v.device || "—"}</span>
                    <span className="truncate text-stone-700">{v.city || "—"}</span>
                    <span className="text-right tabular-nums">{v.visits}</span>
                    <span className="text-right tabular-nums">
                      <strong className="font-semibold">{v.now}</strong> <VisitorChange now={v.now} before={v.before} />
                    </span>
                    <span className="text-right tabular-nums text-stone-700">{v.before}</span>
                    <span className="text-right text-stone-600">{relativeTime(v.last)}</span>
                  </summary>
                  <div className="px-6 pb-4">
                    {v.clicks.size === 0 ? (
                      <p className="text-[13px] text-stone-600">Este visitante não clicou em nada este mês.</p>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-stone-600">Onde este visitante clicou este mês</p>
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {[...v.clicks]
                            .sort((a, b) => b[1] - a[1])
                            .map(([key, n]) => (
                              <li key={key} className="rounded-full border border-[#E5E2DA] bg-white px-3 py-1 text-[13px]">
                                {key.startsWith("b:") ? (blockNames.get(key.slice(2)) ?? "Bloco removido") : (SOCIAL_LABELS[key.slice(2) as SocialPlatform] ?? key.slice(2))}{" "}
                                <strong className="font-semibold tabular-nums">{n}</strong>
                              </li>
                            ))}
                        </ul>
                      </>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}
        <p className="mt-4 text-xs text-stone-600">Clique em um visitante para ver em quais botões ele tocou. Se a mesma pessoa usar outro aparelho, ela aparece como outro visitante.</p>
      </section>

      {/* Explorar engajamento */}
      <section aria-labelledby="engajamento" className={`${panel} p-6`}>
        <h2 id="engajamento" className="font-display text-xl font-bold tracking-[-0.02em]">
          Explorar engajamento dos visitantes
        </h2>
        <div className="mt-5 grid gap-6 lg:grid-cols-3 lg:gap-0">
          <div className="lg:pr-6">
            <h3 className="text-[15px] font-medium text-stone-800">Botões mais clicados</h3>
            {topBlocks.length === 0 ? (
              <p className={empty}>Nenhum botão clicado nesse período.</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-4">
                {topBlocks.slice(0, 5).map((row, i) => (
                  <BarRow key={i} name={row.name} count={row.count} max={topBlocks[0].count} />
                ))}
              </ul>
            )}
          </div>
          <div className="lg:border-l lg:border-[#EFEDE7] lg:px-6">
            <h3 className="text-[15px] font-medium text-stone-800">Estatísticas de engajamento</h3>
            <ul className="mt-2">
              <Engagement label="Cliques por sessão" value={clicksPerVisit.toFixed(1).replace(".", ",")} delta={pctChange(clicksPerVisit, prevClicksPerVisit)} icon="pages" />
              <Engagement label="Duração média da sessão" value={fmtDur(avgMs)} delta={pctChange(avgMs, prevAvgMs)} icon="clock" />
              <Engagement label="Taxa de rejeição" value={`${(bounce * 100).toFixed(1).replace(".", ",")}%`} delta={pctChange(bounce, prevBounce)} icon="exit" lowerIsBetter />
            </ul>
            <p className="mt-3 text-xs text-stone-600">Rejeição é a parte das sessões que saiu sem clicar em nada.</p>
          </div>
          <div className="lg:border-l lg:border-[#EFEDE7] lg:pl-6">
            <h3 className="text-[15px] font-medium text-stone-800">Média de sessões por dia da semana</h3>
            <WeekdayBars data={weekdays} />
          </div>
        </div>
      </section>

      {insights.length ? (
        <section className={`${panel} p-6`}>
          <h2 className="font-display text-xl font-bold tracking-[-0.02em]">O que pede atenção</h2>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm">
            {insights.map((text, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Heatmap heat={heat} max={heatMax} />

      <div className="grid gap-5 lg:grid-cols-5">
        <section className={`${panel} p-5 lg:col-span-3`}>
          <h2 className="mb-3 text-[15px] font-semibold">Toques por botão</h2>
          {topBlocks.length === 0 ? (
            <p className={empty}>Sem cliques ainda. Compartilhe o seu link para começar.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E2DA] text-left text-xs text-stone-600">
                  <th className="pb-2 font-semibold">Bloco</th>
                  <th className="pb-2 text-right font-semibold">Cliques</th>
                  <th className="hidden pb-2 pl-3 font-semibold sm:table-cell">Participação</th>
                </tr>
              </thead>
              <tbody>
                {topBlocks.map((row, index) => {
                  const share = totalBlockClicks ? Math.round((row.count / totalBlockClicks) * 100) : 0;
                  return (
                    <tr key={index} className="border-b border-[#EFEDE7] last:border-0">
                      <td className="py-2.5">
                        <span className="font-medium">{row.name}</span>
                        {row.type ? <span className="ml-2 text-xs text-stone-600">{BLOCK_CATALOG[row.type].label}</span> : null}
                      </td>
                      <td className="py-2.5 text-right tabular-nums">{row.count.toLocaleString("pt-BR")}</td>
                      <td className="hidden py-2.5 pl-3 sm:table-cell">
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EFEDE7]">
                            <span className="block h-full rounded-full bg-stone-900" style={{ width: `${share}%` }} />
                          </span>
                          <span className="w-9 text-right text-xs tabular-nums text-stone-600">{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <section className={`${panel} p-5 lg:col-span-2`}>
          <h2 className="mb-3 text-[15px] font-semibold">Distribuição de cliques</h2>
          {donut.length === 0 ? (
            <p className={empty}>Sem cliques ainda.</p>
          ) : (
            <div className="flex items-center gap-4">
              <Donut segments={donut} />
              <ul className="flex flex-1 flex-col gap-2 text-sm">
                {donut.map((seg) => (
                  <li key={seg.label} className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: seg.color }} />
                    <span className="flex-1 truncate">{seg.label}</span>
                    <span className="tabular-nums text-stone-600">{seg.value.toLocaleString("pt-BR")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={`${panel} p-5`}>
          <h2 className="text-[15px] font-semibold">Pessoas por link</h2>
          <p className="mb-3 text-xs text-stone-600">Quantas pessoas diferentes clicaram em cada link.</p>
          {linkRows.length === 0 ? (
            <p className={empty}>Sem cliques nos últimos 30 dias.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E2DA] text-left text-xs text-stone-600">
                  <th className="pb-2 font-semibold">Link</th>
                  <th className="pb-2 text-right font-semibold">Esta semana</th>
                  <th className="pb-2 pl-3 text-right font-semibold">Este mês</th>
                </tr>
              </thead>
              <tbody>
                {linkRows.map((r, i) => (
                  <tr key={i} className="border-b border-[#EFEDE7] last:border-0">
                    <td className="py-2.5 font-medium">{r.name}</td>
                    <td className="py-2.5 text-right tabular-nums">{r.week.toLocaleString("pt-BR")}</td>
                    <td className="py-2.5 pl-3 text-right tabular-nums">{r.month.toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className={`${panel} p-5`}>
          <h2 className="mb-3 text-[15px] font-semibold">Atividade recente</h2>
          {activity.length === 0 ? (
            <p className={empty}>Nada ainda.</p>
          ) : (
            <ul className="flex flex-col gap-3 text-sm">
              {activity.map((item, index) => (
                <li key={index} className="flex items-start justify-between gap-3">
                  <span className="flex items-start gap-2.5">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} />
                    <span>{item.text}</span>
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-xs text-stone-600">{item.when}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={`${panel} p-5`}>
        <h2 className="mb-3 text-[15px] font-semibold">Campanhas</h2>
        {campaignSources.length === 0 && campaigns.length === 0 ? (
          <div className="text-sm text-stone-600">
            <p>Nenhuma campanha ainda.</p>
            <p className="mt-2">
              Adicione <code className="rounded bg-[#F3F2EE] px-1">?utm_source=instagram&amp;utm_campaign=promo</code> no fim do seu link ao divulgar. Assim dá para medir de qual post ou anúncio veio cada visita.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {(
              [
                ["Origem", campaignSources],
                ["Campanha", campaigns],
              ] as const
            ).map(([title, rows]) =>
              rows.length ? (
                <div key={title}>
                  <p className="mb-2 text-xs font-semibold text-stone-600">{title}</p>
                  <ul className="flex flex-col gap-1.5 text-sm">
                    {rows.map(([name, count]) => (
                      <li key={name} className="flex justify-between gap-3">
                        <span className="truncate">{name}</span>
                        <span className="tabular-nums text-stone-600">{count.toLocaleString("pt-BR")}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null,
            )}
          </div>
        )}
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <Ranking
          title="Cliques nas redes"
          rows={[...summary.bySocial].map(([platform, count]) => [SOCIAL_LABELS[platform as SocialPlatform] ?? platform, count])}
        />
        <Ranking title="Links curtos" rows={[...summary.byShortLink].map(([id, count]) => [linkNames.get(id) ?? "Link removido", count])} />
      </div>
    </div>
  );
}

const VISITOR_GRID = "grid grid-cols-[1.5fr_1.5fr_1.1fr_0.6fr_1.2fr_0.8fr_0.9fr] items-center gap-4 px-2";

const SYSTEM_LABELS: Record<string, string> = { iOS: "iOS (iPhone)", Android: "Android", Windows: "Windows", macOS: "macOS", Linux: "Linux", Outro: "Outros" };
const BROWSER_LABELS: Record<string, string> = { Instagram: "Instagram (dentro do app)", Facebook: "Facebook (dentro do app)", TikTok: "TikTok (dentro do app)", Outro: "Outros" };

// Android phones report a factory code; the common ones get their shop name.
const MODEL_NAMES: Record<string, string> = {
  "SM-S911B": "Galaxy S23", "SM-S916B": "Galaxy S23+", "SM-S918B": "Galaxy S23 Ultra", "SM-S921B": "Galaxy S24", "SM-S926B": "Galaxy S24+", "SM-S928B": "Galaxy S24 Ultra",
  "SM-S901E": "Galaxy S22", "SM-G991B": "Galaxy S21", "SM-G780G": "Galaxy S20 FE", "SM-S711B": "Galaxy S23 FE",
  "SM-A546E": "Galaxy A54", "SM-A556E": "Galaxy A55", "SM-A346M": "Galaxy A34", "SM-A356E": "Galaxy A35", "SM-A256E": "Galaxy A25", "SM-A245M": "Galaxy A24",
  "SM-A155M": "Galaxy A15", "SM-A145M": "Galaxy A14", "SM-A055M": "Galaxy A05", "SM-A057M": "Galaxy A05s", "SM-A536E": "Galaxy A53", "SM-A135M": "Galaxy A13",
  "SM-A325M": "Galaxy A32", "SM-A125M": "Galaxy A12", "SM-A035M": "Galaxy A03", "SM-M546B": "Galaxy M54", "SM-M346B": "Galaxy M34",
};
function modelName(raw: string): string {
  const key = raw.trim();
  const known = MODEL_NAMES[key.toUpperCase()] ?? MODEL_NAMES[key.toUpperCase().replace(/\/DS$/, "")];
  if (known) return known;
  // Motorola and Xiaomi already send a readable name ("moto g54 5G").
  return key.replace(/^moto /i, "Moto ").replace(/\b5g\b/i, "5G");
}

// A short, stable number for an anonymous visitor.
function visitorNumber(id: string): string {
  return String(parseInt(id.replace(/-/g, "").slice(0, 8), 16) % 100000).padStart(4, "0");
}

function VisitorChange({ now, before }: { now: number; before: number }) {
  if (before === 0) return now > 0 ? <span className="text-xs font-medium text-[#2F6B3A]">novo este mês</span> : null;
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) return <span className="text-xs text-stone-600">igual</span>;
  return <span className={`text-xs font-medium ${pct > 0 ? "text-[#2F6B3A]" : "text-red-700"}`}>{pct > 0 ? "+" : ""}{pct}%</span>;
}

// Named bars with each one's share of the total.
function ShareBars({ rows }: { rows: [string, number][] }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  const total = Math.max(1, rows.reduce((a, r) => a + r[1], 0));
  return (
    <ul className="mt-4 flex flex-col gap-4">
      {rows.map(([name, n]) => (
        <li key={name}>
          <span className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{name}</span>
            <span className="flex shrink-0 items-baseline gap-2.5">
              <span className="text-xs tabular-nums text-stone-600">{Math.round((n / total) * 100)}%</span>
              <span className="font-semibold tabular-nums">{n.toLocaleString("pt-BR")}</span>
            </span>
          </span>
          <span className="mt-1.5 block h-[5px] overflow-hidden rounded-full bg-[#E9E8EF]">
            <span className="block h-full rounded-full bg-blue-500" style={{ width: `${Math.max(2, (n / max) * 100)}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

// One of the three headline numbers: value, change against the previous
// period, a small trend line, and today next to yesterday.
function Stat({ label, value, delta, spark, today, yesterday }: { label: string; value: number; delta: number | null; spark: number[]; today: number; yesterday: number }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-[10px] border border-[#EFEDE7] p-3.5">
      <div className="min-w-0">
        <p className="text-[13px] text-stone-700">{label}</p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="text-[22px] font-semibold tabular-nums tracking-[-0.02em]">{value.toLocaleString("pt-BR")}</span>
          <Trend value={delta} />
        </p>
        <p className="mt-1 text-xs text-stone-600">
          {today.toLocaleString("pt-BR")} hoje <span aria-hidden>·</span> {yesterday.toLocaleString("pt-BR")} ontem
        </p>
      </div>
      <div className="mt-3 w-[42%] max-w-[150px] shrink-0">{spark.some((v) => v > 0) ? <Spark data={spark} color="#3A55F5" /> : <span className="block h-px w-full translate-y-3 bg-[#D9DDFD]" />}</div>
    </div>
  );
}

// Change against the previous period: an arrow and the percentage, green when
// it is good news and red when it is not.
function Trend({ value, lowerIsBetter = false }: { value: number | null; lowerIsBetter?: boolean }) {
  if (value === null || !isFinite(value)) return null;
  if (Math.abs(value) < 0.5) return <span className="text-xs tabular-nums text-stone-600">0%</span>;
  const up = value > 0;
  const good = lowerIsBetter ? !up : up;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium tabular-nums ${good ? "text-[#2F6B3A]" : "text-red-700"}`}>
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={up ? "M3 17 9 11l4 4 8-8M15 7h6v6" : "M3 7l6 6 4-4 8 8M15 17h6v-6"} />
      </svg>
      {Math.abs(value).toFixed(0)}%
    </span>
  );
}

// A named bar with its count, and the change when there is one to compare.
function BarRow({ name, count, max, delta }: { name: string; count: number; max: number; delta?: number | null }) {
  return (
    <li>
      <span className="flex items-baseline justify-between gap-3 text-sm">
        <span className="truncate">{name}</span>
        <span className="flex shrink-0 items-center gap-2.5">
          {delta !== undefined ? <Trend value={delta} /> : null}
          <span className="font-semibold tabular-nums">{count.toLocaleString("pt-BR")}</span>
        </span>
      </span>
      <span className="mt-1.5 block h-[5px] overflow-hidden rounded-full bg-[#E9E8EF]">
        <span className="block h-full rounded-full bg-blue-500" style={{ width: `${Math.max(2, (count / Math.max(1, max)) * 100)}%` }} />
      </span>
    </li>
  );
}

function Engagement({ label, value, delta, icon, lowerIsBetter }: { label: string; value: string; delta: number | null; icon: "pages" | "clock" | "exit"; lowerIsBetter?: boolean }) {
  return (
    <li className="flex items-center gap-3 border-b border-[#EFEDE7] py-3.5 last:border-b-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EDEDF8] text-stone-900">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          {icon === "pages" ? (
            <path d="M9 11V5a1.5 1.5 0 0 1 3 0v5m0 0V8.5a1.5 1.5 0 0 1 3 0V11m0 0v-1a1.5 1.5 0 0 1 3 0v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L3.5 15a1.5 1.5 0 0 1 2.5-1.6L9 16" />
          ) : icon === "clock" ? (
            <>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </>
          ) : (
            <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10" />
          )}
        </svg>
      </span>
      <span className="min-w-0 flex-1 text-sm">{label}</span>
      <Trend value={delta} lowerIsBetter={lowerIsBetter} />
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </li>
  );
}

// Sessions per day as a filled line, with a light scale on the left.
function AreaChart({ daily }: { daily: Summary["daily"] }) {
  const n = daily.length;
  const max = Math.max(1, ...daily.map((d) => d.views));
  const top = Math.max(4, Math.ceil(max / 4) * 4);
  const W = 320;
  const H = 170;
  const left = 26;
  const x = (i: number) => left + (n <= 1 ? (W - left) / 2 : (i / (n - 1)) * (W - left - 4));
  const y = (v: number) => 8 + (1 - v / top) * (H - 16);
  // A smooth curve through the points (each segment eased horizontally).
  const line = daily
    .map((d, i) => {
      if (i === 0) return `M${x(0).toFixed(1)} ${y(d.views).toFixed(1)}`;
      const mid = ((x(i - 1) + x(i)) / 2).toFixed(1);
      return `C${mid} ${y(daily[i - 1].views).toFixed(1)} ${mid} ${y(d.views).toFixed(1)} ${x(i).toFixed(1)} ${y(d.views).toFixed(1)}`;
    })
    .join(" ");
  const area = `${line} L${x(n - 1).toFixed(1)} ${H - 8} L${x(0).toFixed(1)} ${H - 8} Z`;
  const ticks = [1, 0.75, 0.5, 0.25].map((t) => Math.round(top * t));
  const step = Math.max(1, Math.ceil(n / 5));
  const label = (day: string) => new Date(day + "T12:00:00Z").toLocaleDateString("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" }).replace(".", "");
  return (
    <div className="mt-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Sessões por dia">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={left} x2={W} y1={y(t)} y2={y(t)} stroke="#EFEDE7" strokeWidth="1" />
            <text x={left - 6} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill="#5B5D7A">
              {t}
            </text>
          </g>
        ))}
        <path d={area} fill="#3A55F5" opacity="0.16" />
        <path d={line} fill="none" stroke="#3A55F5" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="flex justify-between pl-[26px] text-[11px] text-stone-600">
        {daily.filter((_, i) => i % step === 0).map((d) => (
          <span key={d.day}>{label(d.day)}</span>
        ))}
      </div>
    </div>
  );
}

function WeekdayBars({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="mt-4 flex h-[150px] items-end gap-2.5">
      {data.map((d) => (
        <div key={d.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
          <span className="text-[11px] tabular-nums text-stone-600">{d.value >= 10 ? Math.round(d.value) : d.value.toFixed(1).replace(".", ",").replace(",0", "")}</span>
          <span className="block w-full rounded-t-[4px] bg-blue-500" style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }} />
          <span className="truncate text-[11px] text-stone-600">{d.label}</span>
        </div>
      ))}
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

function Donut({ segments, caption = "cliques" }: { segments: { label: string; value: number; color: string }[]; caption?: string }) {
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
        {caption}
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
        <p className="mt-1 text-sm text-stone-300">As estatísticas completas estão no plano Essencial.</p>
        <Link href="/dashboard/plans" className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-semibold text-stone-900">
          Ver planos
        </Link>
      </div>
    </div>
  );
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
