import Link from "next/link";
import { ModelThumb } from "@/components/page-view/ModelThumb";
import { hasFullAnalytics, isPaid } from "@/lib/entitlements";
import { blockSummary } from "@/lib/page/catalog";
import { pageDocSchema, type PageDoc } from "@/lib/page/schema";
import { TEMPLATES } from "@/lib/page/templates";
import { formatBRL, PLAN_PRICE_BRL } from "@/lib/plans";
import { siteOrigin } from "@/lib/request";
import { getOwner } from "./context";
import { CopyLinkButton } from "./CopyLinkButton";
import { fetchAll } from "@/lib/supabase/fetch-all";

const TIME_ZONE = "America/Sao_Paulo";
const DAY = 86_400_000;

// The premium models shown to free accounts, in this order.
const SHOWCASE = ["resto-menu", "resto-bar", "resto-bistro", "bf-loja", "presenca"];


const n = (v: number) => v.toLocaleString("pt-BR");


export default async function HomePage() {
  const { supabase, profile } = await getOwner();
  const host = new URL(await siteOrigin()).host;
  const now = new Date();
  // The week is today plus the six days before it, counted in Brasília time
  // (UTC-3 all year), so the daily columns add up to the total.
  const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(d);
  const weekStart = new Date(`${dayKey(new Date(now.getTime() - 6 * DAY))}T00:00:00-03:00`);
  const weekAgo = weekStart.toISOString();
  // The chart goes a little further back than the week in the summary.
  const CHART_DAYS = 12;
  const chartAgo = new Date(weekStart.getTime() - (CHART_DAYS - 7) * DAY).toISOString();
  const twoWeeksAgo = new Date(weekStart.getTime() - 7 * DAY).toISOString();
  const paid = isPaid(profile.plan);
  const full = hasFullAnalytics(profile.plan);

  const count = (query: PromiseLike<{ count: number | null }>) => query.then((r) => r.count ?? 0);
  const events = () => supabase.from("events").select("id", { count: "exact", head: true }).eq("owner_id", profile.id);

  const [{ data: page }, { data: viewRows }, viewsBefore, clicks, contacts, responses, everViewed, { data: clickRows }, { data: latest }, { data: latestResponses }] = await Promise.all([
    supabase.from("pages").select("draft, published, published_at").eq("owner_id", profile.id).maybeSingle(),
    fetchAll<{ created_at: string }>(
      (from, to) => supabase.from("events").select("created_at").eq("owner_id", profile.id).eq("kind", "page_view").gte("created_at", chartAgo).order("created_at", { ascending: false }).order("id").range(from, to),
      50_000,
    ),
    count(events().eq("kind", "page_view").gte("created_at", twoWeeksAgo).lt("created_at", weekAgo)),
    count(events().eq("kind", "block_click").gte("created_at", weekAgo)),
    count(supabase.from("contacts").select("id", { count: "exact", head: true }).eq("owner_id", profile.id).gte("created_at", weekAgo)),
    count(supabase.from("form_responses").select("id", { count: "exact", head: true }).eq("owner_id", profile.id).gte("created_at", weekAgo)),
    count(events().eq("kind", "page_view")),
    fetchAll<{ block_id: string | null }>(
      (from, to) => supabase.from("events").select("block_id").eq("owner_id", profile.id).eq("kind", "block_click").gte("created_at", weekAgo).order("created_at", { ascending: false }).order("id").range(from, to),
      20_000,
    ),
    supabase.from("contacts").select("id, email, phone, created_at").eq("owner_id", profile.id).order("created_at", { ascending: false }).limit(3),
    supabase.from("form_responses").select("id, answers, created_at").eq("owner_id", profile.id).order("created_at", { ascending: false }).limit(3),
  ]);

  // Visits per day, oldest first, today last.
  const views = viewRows.filter((r) => r.created_at >= weekAgo).length;
  const perDay = new Map<string, number>();
  for (let i = CHART_DAYS - 1; i >= 0; i--) perDay.set(dayKey(new Date(now.getTime() - i * DAY)), 0);
  for (const row of viewRows) {
    const key = dayKey(new Date(row.created_at));
    if (perDay.has(key)) perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }
  const todayKey = dayKey(now);
  const week = [...perDay].map(([key, total]) => ({
    key,
    total,
    today: key === todayKey,
    label: `${key.slice(8, 10)}/${key.slice(5, 7)}`,
  }));
  const weekMax = Math.max(1, ...week.map((d) => d.total));

  // People who left a way to reach them: the capture block and the forms,
  // newest first, in one list.
  type Person = { id: string; title: string; detail: string; phone: string; at: string; via: string };
  const people: Person[] = [
    ...(latest ?? []).map((c) => ({ id: `c${c.id}`, title: c.email || c.phone || "Contato", detail: c.email && c.phone ? c.phone : "", phone: c.phone ?? "", at: c.created_at, via: "Captação" })),
    ...((latestResponses ?? []) as { id: string; answers: unknown; created_at: string }[]).map((r) => {
      const values = (Array.isArray(r.answers) ? (r.answers as { label?: string; value?: unknown }[]) : [])
        .map((a) => (typeof a?.value === "string" ? a.value.trim() : Array.isArray(a?.value) ? a.value.join(", ") : ""))
        .filter(Boolean);
      const phone = values.find((v) => /^[\d\s()+-]{10,}$/.test(v)) ?? "";
      return { id: `r${r.id}`, title: values[0] || "Resposta de formulário", detail: values.slice(1, 3).join(", "), phone, at: r.created_at, via: "Formulário" };
    }),
  ]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 4);

  // This screen is about the page people are visiting: the published one. An
  // unpublished draft only stands in while nothing has gone live yet.
  const parsed = pageDocSchema.safeParse(page?.published ?? page?.draft);
  const doc: PageDoc | null = parsed.success ? parsed.data : null;
  const publishedAt = page?.published_at ? new Date(page.published_at) : null;
  const newContacts = contacts + responses;

  // Most clicked buttons this week, named as in the editor.
  const byBlock = new Map<string, number>();
  for (const row of clickRows) {
    if (row.block_id) byBlock.set(row.block_id, (byBlock.get(row.block_id) ?? 0) + 1);
  }
  // Where the taps went: the four most tapped buttons and the rest together.
  const ranked = [...byBlock.entries()]
    .map(([id, total]) => {
      const block = doc?.blocks.find((x) => x.id === id);
      return { name: block ? blockSummary(block) : "", total };
    })
    .filter((x) => x.name)
    .sort((x, y) => y.total - x.total);
  const tapTotal = ranked.reduce((sum, x) => sum + x.total, 0);
  const SLICE_COLORS = ["#2DD4BF", "#22B8F0", "#6D4AFF", "#3B82F6", "#B9B6C9"];
  const slices = [...ranked.slice(0, 4), ...(ranked.length > 4 ? [{ name: "Outros botões", total: ranked.slice(4).reduce((sum, x) => sum + x.total, 0) }] : [])].map(
    (x, i) => ({ ...x, color: SLICE_COLORS[i], share: tapTotal ? x.total / tapTotal : 0 }),
  );

  // What is still missing, from the page's real state.
  const steps = [
    { label: "Colocar foto e nome", done: !!doc && (!!doc.profile.avatarUrl || !!doc.profile.logo) && !!doc.profile.name.trim(), href: "/dashboard/editor" },
    { label: "Adicionar seus links", done: (doc?.blocks.length ?? 0) >= 2, href: "/dashboard/editor" },
    { label: "Publicar a página", done: !!publishedAt, href: "/dashboard/editor" },
    { label: "Colocar o link na bio do Instagram", done: everViewed > 0, href: null, hint: "É de lá que vem a maior parte das visitas." },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  const showcase = paid
    ? []
    : SHOWCASE.map((id) => TEMPLATES.find((t) => t.id === id))
        .filter((t): t is (typeof TEMPLATES)[number] => !!t)
        .map((t) => ({ id: t.id, name: t.name, kind: t.category, doc: t.build(t.name) }));

  const growth = viewsBefore ? Math.round(((views - viewsBefore) / viewsBefore) * 100) : null;
  const rate = views ? Math.round((clicks / views) * 100) : 0;
  const name = profile.display_name || profile.handle;
  const published = publishedAt
    ? `Publicada em ${publishedAt.toLocaleString("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE })}`
    : "Ainda não publicada";

  // Round the top of the chart up to a number that divides by four.
  const axisMax = Math.max(4, Math.ceil(weekMax / 4) * 4);
  const ticks = [axisMax, (axisMax * 3) / 4, axisMax / 2, axisMax / 4, 0];

  const panel = "rounded-[18px] border border-[#E5E2DA] bg-white";
  const tile = "rounded-[14px] bg-[#F6F5F1]";
  const muted = "text-stone-600";
  const R = 54;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div>
      <div className="flex flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-[30px] font-bold leading-tight tracking-[-0.025em]">Início</h1>
            <p className={`mt-1 text-sm ${muted}`}>
              {publishedAt ? `${name} está no ar${paid ? "" : " no plano grátis"}.` : `${name} ainda não foi publicada.`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CopyLinkButton handle={profile.handle} host={host} />
            <Link href="/dashboard/editor" className="inline-flex h-10 items-center rounded-[10px] bg-stone-900 px-[18px] text-sm font-semibold text-white transition-colors hover:bg-stone-800">
              Editar página
            </Link>
          </div>
        </header>

        {showcase.length ? (
          <section aria-labelledby="vitrine" className={`${panel} p-6`}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-xl">
                <h2 id="vitrine" className="font-display text-[22px] font-bold tracking-[-0.02em]">
                  Sua página pode parecer um site de verdade
                </h2>
                <p className={`mt-1.5 text-sm leading-relaxed ${muted}`}>
                  Os modelos premium foram desenhados para restaurante, loja e serviço. Troque em um clique: seu nome, fotos e links continuam.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/dashboard/modelos" className="inline-flex h-10 items-center rounded-[10px] border border-[#E5E2DA] px-4 text-sm font-semibold text-stone-900 transition-colors hover:border-stone-400">
                  Ver todos os modelos
                </Link>
                <a
                  href={`/dashboard/clientes/${profile.id}/assinar?plan=essencial`}
                  className="inline-flex h-10 items-center rounded-[10px] bg-gradient-to-r from-[#2DD4BF] to-[#2F7BFF] px-4 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Liberar por {formatBRL(PLAN_PRICE_BRL.essencial)}/mês
                </a>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {showcase.map((m) => (
                <Link key={m.id} href={`/dashboard/modelos?ver=${m.id}`} className="group block">
                  <span className="block overflow-hidden rounded-xl border border-[#E5E2DA] transition-colors group-hover:border-stone-400">
                    <ModelThumb doc={m.doc} width={180} height={296} />
                  </span>
                  <span className="mt-2 block text-sm font-semibold">{m.name}</span>
                  <span className={`block text-xs ${muted}`}>{m.kind}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-12 lg:items-start">
          <div className="flex min-w-0 flex-col gap-5 lg:col-span-8">
            <section aria-labelledby="resumo" className={`${panel} p-4 sm:p-5`}>
              <h2 id="resumo" className="text-[17px] font-semibold">Resumo dos últimos 7 dias</h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className={`${tile} grid grid-cols-2 px-4 py-4`}>
                  <div>
                    <dt className={`text-xs ${muted}`}>Visitas</dt>
                    <dd className="mt-1.5 text-[30px] font-semibold leading-none tracking-[-0.02em]">{n(views)}</dd>
                    <dd className={`mt-2 text-xs ${muted}`}>aberturas do link</dd>
                  </div>
                  <div className="border-l border-[#E5E2DA] pl-4">
                    <dt className={`text-xs ${muted}`}>Crescimento</dt>
                    <dd className="mt-1.5 flex items-center gap-1.5 text-[30px] font-semibold leading-none tracking-[-0.02em]">
                      {growth === null ? "—" : `${Math.abs(growth)}%`}
                      {growth ? (
                        <span className={`flex h-[18px] w-[18px] items-center justify-center rounded-full ${growth > 0 ? "bg-[#2DD4BF] text-[#06221E]" : "bg-[#FF6B5B] text-[#2A0B07]"}`}>
                          <svg viewBox="0 0 12 12" className={`h-2.5 w-2.5 ${growth > 0 ? "" : "rotate-180"}`} fill="currentColor" aria-hidden>
                            <path d="M6 2.5 10 8H2z" />
                          </svg>
                        </span>
                      ) : null}
                    </dd>
                    <dd className={`mt-2 text-xs ${muted}`}>{growth === null ? "sem semana anterior" : growth < 0 ? "menos que a semana anterior" : "sobre a semana anterior"}</dd>
                  </div>
                </div>
                <div className={`${tile} grid grid-cols-2 px-4 py-4`}>
                  <div>
                    <dt className={`text-xs ${muted}`}>Toques</dt>
                    <dd className="mt-1.5 text-[30px] font-semibold leading-none tracking-[-0.02em]">{full ? n(clicks) : "—"}</dd>
                    <dd className={`mt-2 text-xs ${muted}`}>nos botões</dd>
                  </div>
                  <div className="border-l border-[#E5E2DA] pl-4">
                    <dt className={`text-xs ${muted}`}>Aproveitamento</dt>
                    <dd className="mt-1.5 text-[30px] font-semibold leading-none tracking-[-0.02em]">{full && views ? `${rate}%` : "—"}</dd>
                    <dd className={`mt-2 text-xs ${muted}`}>{full ? "toques por visita" : "no plano Essencial"}</dd>
                  </div>
                </div>
                <div className={`${tile} px-4 py-4`}>
                  <dt className={`text-xs ${muted}`}>Contatos novos</dt>
                  <dd className="mt-1.5 text-[30px] font-semibold leading-none tracking-[-0.02em]">{n(newContacts)}</dd>
                  <dd className="mt-2 text-xs">
                    <Link href={responses ? "/dashboard/formularios" : "/dashboard/contacts"} className="font-medium text-blue-600 hover:underline">
                      {responses ? `${n(responses)} por formulário` : "Ver contatos"}
                    </Link>
                  </dd>
                </div>
              </dl>
            </section>

            <section aria-labelledby="visitas" className={`${panel} p-4 sm:p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 id="visitas" className="text-[17px] font-semibold">Visitas por dia</h2>
                  <p className={`mt-1 text-xs ${muted}`}>Quantas vezes o seu link foi aberto em cada dia.</p>
                </div>
                <Link href="/dashboard/analytics" className="inline-flex h-9 items-center rounded-[10px] border border-[#E5E2DA] px-3.5 text-[13px] font-semibold text-stone-900 transition-colors hover:border-stone-400">
                  Ver estatísticas
                </Link>
              </div>
              <div className={`${tile} mt-4 px-3 pb-3 pt-5 sm:px-5`}>
                <div className="flex gap-3">
                  <div className={`flex h-[240px] flex-col justify-between text-right text-[11px] ${muted}`} aria-hidden>
                    {ticks.map((t) => (
                      <span key={t} className="leading-none">{n(t)}</span>
                    ))}
                  </div>
                  <ol className="relative grid h-[240px] min-w-0 flex-1 grid-cols-12 gap-1.5 sm:gap-3" aria-label={`Visitas em cada um dos últimos ${CHART_DAYS} dias`}>
                    <span aria-hidden className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                      {ticks.map((t) => (
                        <span key={t} className="block h-px bg-stone-900/[0.07]" />
                      ))}
                    </span>
                    {week.map((d) => (
                      <li key={d.key} title={`${d.label}: ${n(d.total)} ${d.total === 1 ? "visita" : "visitas"}`} className="relative flex justify-center">
                        <span className="relative h-full w-full max-w-[22px] overflow-hidden rounded-t-[4px] bg-stone-900/[0.06]">
                          <span
                            className="absolute inset-x-0 bottom-0 rounded-t-[4px] bg-gradient-to-b from-[#2DD4BF] to-[#2F7BFF]"
                            style={{ height: `${(d.total / axisMax) * 100}%` }}
                          />
                        </span>
                        <span className="sr-only">
                          {d.label}: {n(d.total)}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className={`ml-7 mt-2.5 grid grid-cols-12 gap-1.5 text-center text-[10px] sm:gap-3 sm:text-[11px] ${muted}`} aria-hidden>
                  {week.map((d) => (
                    <span key={d.key} className={d.today ? "font-semibold text-stone-900" : ""}>
                      {d.today ? (
                        "hoje"
                      ) : (
                        <>
                          {d.label.slice(0, 2)}
                          <span className="hidden sm:inline">{d.label.slice(2)}</span>
                        </>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section aria-labelledby="contatos" className={`${panel} p-4 sm:p-5`}>
              <div className="flex items-baseline justify-between gap-4">
                <h2 id="contatos" className="text-[17px] font-semibold">Últimos contatos</h2>
                <Link href={people.some((x) => x.via === "Captação") || !people.length ? "/dashboard/contacts" : "/dashboard/formularios"} className="text-[13px] font-medium text-blue-600 hover:underline">
                  Ver todos
                </Link>
              </div>
              {people.length ? (
                <ul className="mt-3 flex flex-col gap-2">
                  {people.map((c) => {
                    const digits = c.phone.replace(/\D/g, "");
                    return (
                      <li key={c.id} className={`${tile} flex flex-wrap items-center gap-x-3.5 gap-y-1 px-4 py-3`}>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2DD4BF] to-[#2F7BFF] text-xs font-bold text-white">
                          {c.title.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1 basis-[180px]">
                          <span className="block truncate text-sm font-semibold">{c.title}</span>
                          {c.detail ? <span className={`block truncate text-[13px] ${muted}`}>{c.detail}</span> : null}
                        </span>
                        <span className={`text-[13px] ${muted}`}>
                          {c.via}, {new Date(c.at).toLocaleDateString("pt-BR", { day: "numeric", month: "short", timeZone: TIME_ZONE })}
                        </span>
                        {digits.length >= 10 ? (
                          <a href={`https://wa.me/${digits.replace(/^(?!55)/, "55")}`} target="_blank" rel="noreferrer" className="text-[13px] font-medium text-blue-600 hover:underline">
                            Abrir conversa
                          </a>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className={`mt-3 text-sm leading-relaxed ${muted}`}>
                  Ninguém deixou contato ainda. Para receber, coloque na página um bloco de captação ou um formulário.
                </p>
              )}
            </section>
          </div>

          <div className="flex min-w-0 flex-col gap-5 lg:col-span-4">
            <section aria-labelledby="botoes" className={`${panel} p-4 sm:p-5`}>
              <h2 id="botoes" className="text-[17px] font-semibold">Toques nos botões</h2>
              {full ? (
                <>
                  <div className="relative mx-auto mt-4 h-[190px] w-[190px]">
                    <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" aria-hidden>
                      <circle cx="70" cy="70" r={R} fill="none" stroke="#ECEAE4" strokeWidth="14" />
                      {slices.map((sl) => {
                        const len = Math.max(0, sl.share * C - (slices.length > 1 ? 3 : 0));
                        const el = (
                          <circle key={sl.name} cx="70" cy="70" r={R} fill="none" stroke={sl.color} strokeWidth="14" strokeLinecap="butt" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} />
                        );
                        offset += sl.share * C;
                        return el;
                      })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[30px] font-semibold leading-none tracking-[-0.02em]">{n(tapTotal)}</span>
                      <span className={`mt-1.5 text-xs ${muted}`}>toques na semana</span>
                    </div>
                  </div>
                  {slices.length ? (
                    <div className={`${tile} mt-5 px-4 py-3.5`}>
                      <h3 className="text-sm font-semibold">Botões</h3>
                      <ul className="mt-3 flex flex-col gap-3">
                        {slices.map((sl) => (
                          <li key={sl.name} className="flex items-center gap-3 text-[13px]">
                            <span className="h-3.5 w-3.5 shrink-0 rounded-full border-[3px]" style={{ borderColor: sl.color }} />
                            <span className="min-w-0 flex-1 truncate">{sl.name}</span>
                            <span className="shrink-0 font-semibold">{Math.round(sl.share * 100)}%</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className={`mt-4 text-center text-[13px] ${muted}`}>Nenhum toque nos botões esta semana.</p>
                  )}
                </>
              ) : (
                <p className={`mt-3 text-[13px] leading-relaxed ${muted}`}>
                  Quantos toques cada botão recebe, de onde vem cada visita e quais cidades mais acessam ficam no plano Essencial.
                </p>
              )}
            </section>

            <section aria-label="Sua página" className="overflow-hidden rounded-[18px] bg-gradient-to-br from-[#1FB8C4] to-[#2466D9] p-5 text-white">
              <div className="flex items-center gap-4">
                {doc && paid ? (
                  <span className="block shrink-0 overflow-hidden rounded-[14px] border-[3px] border-white/90">
                    <ModelThumb doc={doc} width={74} height={132} />
                  </span>
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[19px] font-bold leading-tight">{name}</p>
                  <p className="mt-1 text-[13px] leading-snug text-white/85">{publishedAt ? published : "Ainda não publicada"}</p>
                  <p className="mt-0.5 truncate text-[13px] text-white/85">
                    {host}/{profile.handle}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Link href="/dashboard/editor" className="inline-flex h-[38px] flex-1 items-center justify-center rounded-[10px] bg-white text-sm font-semibold text-[#0D2A4A] transition-colors hover:bg-white/90">
                  Editar
                </Link>
                <CopyLinkButton handle={profile.handle} variant="button" label={paid ? "Compartilhar" : "Copiar link"} />
              </div>
            </section>

            {paid && doneCount < steps.length ? (
              <section aria-labelledby="passos" className={`${panel} p-4 sm:p-5`}>
                <h2 id="passos" className="text-[17px] font-semibold">Falta pouco</h2>
                <p className={`mt-1 text-[13px] ${muted}`}>
                  {doneCount} de {steps.length} passos feitos
                </p>
                <span className="mt-3 block h-1.5 overflow-hidden rounded-[3px] bg-[#EFEDE7]">
                  <span className="block h-full bg-gradient-to-r from-[#2DD4BF] to-[#2F7BFF]" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
                </span>
                <ul className="mt-3">
                  {steps
                    .filter((st) => !st.done)
                    .map((st) => (
                      <li key={st.label} className="flex items-start gap-2.5 border-t border-[#EFEDE7] py-2.5 first:border-t-0">
                        <span className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded-full border-[1.5px] border-[#B9B6C9]" />
                        <span className="flex-1">
                          <span className="block text-sm font-semibold">{st.label}</span>
                          {st.hint ? <span className={`block text-[13px] ${muted}`}>{st.hint}</span> : null}
                        </span>
                        {st.href ? (
                          <Link href={st.href} className="text-[13px] font-medium text-blue-600 hover:underline">
                            Fazer
                          </Link>
                        ) : null}
                      </li>
                    ))}
                </ul>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
