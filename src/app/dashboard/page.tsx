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
  const twoWeeksAgo = new Date(weekStart.getTime() - 7 * DAY).toISOString();
  const paid = isPaid(profile.plan);
  const full = hasFullAnalytics(profile.plan);

  const count = (query: PromiseLike<{ count: number | null }>) => query.then((r) => r.count ?? 0);
  const events = () => supabase.from("events").select("id", { count: "exact", head: true }).eq("owner_id", profile.id);

  const [{ data: page }, { data: viewRows }, viewsBefore, clicks, contacts, responses, everViewed, { data: clickRows }, { data: latest }, { data: latestResponses }] = await Promise.all([
    supabase.from("pages").select("draft, published_at").eq("owner_id", profile.id).maybeSingle(),
    fetchAll<{ created_at: string }>(
      (from, to) => supabase.from("events").select("created_at").eq("owner_id", profile.id).eq("kind", "page_view").gte("created_at", weekAgo).order("created_at", { ascending: false }).order("id").range(from, to),
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
  const views = viewRows.length;
  const perDay = new Map<string, number>();
  for (let i = 6; i >= 0; i--) perDay.set(dayKey(new Date(now.getTime() - i * DAY)), 0);
  for (const row of viewRows) {
    const key = dayKey(new Date(row.created_at));
    if (perDay.has(key)) perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }
  const todayKey = dayKey(now);
  const week = [...perDay].map(([key, total]) => ({
    key,
    total,
    today: key === todayKey,
    label: new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" }).format(new Date(`${key}T12:00:00Z`)).replace(".", ""),
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

  const parsed = pageDocSchema.safeParse(page?.draft);
  const doc: PageDoc | null = parsed.success ? parsed.data : null;
  const publishedAt = page?.published_at ? new Date(page.published_at) : null;
  const newContacts = contacts + responses;

  // Most clicked buttons this week, named as in the editor.
  const byBlock = new Map<string, number>();
  for (const row of clickRows) {
    if (row.block_id) byBlock.set(row.block_id, (byBlock.get(row.block_id) ?? 0) + 1);
  }
  // The page's own buttons, in the order they appear on it, each with its
  // taps this week. A button nobody tapped stays in the list: that is news too.
  const buttons = (doc?.blocks ?? [])
    .map((block, index) => ({ id: block.id, place: index + 1, name: blockSummary(block), total: byBlock.get(block.id) ?? 0, tappable: block.enabled && (block.type === "link" || block.type === "product") }))
    .filter((b) => b.name && (b.total > 0 || b.tappable))
    .slice(0, 8);
  const topMax = Math.max(1, ...buttons.map((b) => b.total));

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

  // The week said as a sentence, from the real numbers.
  const diff = views - viewsBefore;
  const headline = !publishedAt
    ? "Sua página ainda não está no ar."
    : views === 0
      ? "Ninguém abriu seu link esta semana."
      : views === 1
        ? "Seu link foi aberto 1 vez esta semana."
        : `Seu link foi aberto ${n(views)} vezes esta semana.`;
  const parts: string[] = [];
  if (!publishedAt) parts.push("Publique pelo editor para o endereço começar a funcionar.");
  else if (views === 0) parts.push("Coloque o link na bio do Instagram: é de lá que vem a maior parte das visitas.");
  else {
    if (viewsBefore) parts.push(diff === 0 ? "O mesmo que na semana passada." : `${n(Math.abs(diff))} a ${diff > 0 ? "mais" : "menos"} que na semana passada.`);
    if (full) {
      const taps = clicks === 0 ? "Nenhum toque nos botões" : clicks === 1 ? "1 toque nos botões" : `${n(clicks)} toques nos botões`;
      const got = newContacts === 0 ? "" : newContacts === 1 ? " e 1 contato novo" : ` e ${n(newContacts)} contatos novos`;
      parts.push(`${taps}${got}.`);
    }
  }
  const subline = parts.join(" ");
  const name = profile.display_name || profile.handle;
  const published = publishedAt
    ? `Publicada em ${publishedAt.toLocaleString("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE })}`
    : "Ainda não publicada";

  const panel = "rounded-[14px] border border-[#E5E2DA] bg-white";

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[640px]">
          <h1 className="font-display text-[30px] font-bold leading-[1.15] tracking-[-0.025em] sm:text-[34px]">{headline}</h1>
          <p className="mt-2.5 text-[15px] leading-relaxed text-stone-600">{subline}</p>
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
              <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
                Os modelos premium foram desenhados para restaurante, loja e serviço. Troque em um clique: seu nome, fotos e links continuam.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/modelos" className="inline-flex h-10 items-center rounded-[10px] border border-[#E5E2DA] px-4 text-sm font-semibold text-stone-900 transition-colors hover:border-stone-400">
                Ver todos os modelos
              </Link>
              <a
                href={`/dashboard/clientes/${profile.id}/assinar?plan=essencial`}
                className="inline-flex h-10 items-center rounded-[10px] bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
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
                <span className="block text-xs text-stone-600">{m.kind}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-12 lg:items-start">
        <div className="flex flex-col gap-5 lg:col-span-8">
          <section aria-labelledby="semana" className={`${panel} px-6 py-[22px]`}>
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="semana" className="text-base font-semibold">Visitas por dia</h2>
              <Link href="/dashboard/analytics" className="text-[13px] font-semibold text-blue-600 underline underline-offset-4 hover:text-blue-700">
                Ver estatísticas
              </Link>
            </div>
            <ol className="mt-5 grid grid-cols-7 gap-2 sm:gap-3" aria-label="Visitas em cada um dos últimos 7 dias">
              {week.map((d) => (
                <li key={d.key} className="flex flex-col items-center gap-1.5">
                  <span className={`text-[13px] font-semibold ${d.total ? "text-stone-900" : "text-stone-400"}`}>{n(d.total)}</span>
                  <span className="flex h-[72px] w-full max-w-[44px] items-end">
                    <span
                      className={`block w-full rounded-[5px] ${d.today ? "bg-blue-600" : d.total ? "bg-stone-900" : "bg-[#E5E2DA]"}`}
                      style={{ height: d.total ? `${Math.max(8, (d.total / weekMax) * 100)}%` : "3px" }}
                    />
                  </span>
                  <span className={`text-xs ${d.today ? "font-semibold text-blue-700" : "text-stone-600"}`}>{d.today ? "hoje" : d.label}</span>
                </li>
              ))}
            </ol>

            {full ? (
              buttons.length ? (
                <div className="mt-6 border-t border-[#EFEDE7] pt-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-base font-semibold">Onde tocaram</h3>
                    <p className="hidden text-[13px] text-stone-600 sm:block">Na ordem em que aparecem na página</p>
                  </div>
                  <ol className="mt-3 flex flex-col gap-1.5">
                    {buttons.map((b) => (
                      <li key={b.id} className="relative overflow-hidden rounded-[9px] bg-[#F6F5F1]">
                        {b.total ? <span aria-hidden className="absolute inset-y-0 left-0 bg-[#DCE3FF]" style={{ width: `${Math.max(6, (b.total / topMax) * 100)}%` }} /> : null}
                        <span className="relative flex items-center gap-3 px-3.5 py-2.5 text-sm">
                          <span className="w-5 shrink-0 text-[13px] text-stone-500">{b.place}</span>
                          <span className={`min-w-0 flex-1 truncate ${b.total ? "font-medium text-stone-900" : "text-stone-600"}`}>{b.name}</span>
                          <span className={`shrink-0 ${b.total ? "font-semibold text-stone-900" : "text-[13px] text-stone-500"}`}>
                            {b.total ? `${n(b.total)} ${b.total === 1 ? "toque" : "toques"}` : "nenhum toque"}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null
            ) : (
              <div className="mt-6 flex items-start gap-3 rounded-[10px] bg-[#F6F5F1] px-4 py-3.5">
                <svg viewBox="0 0 24 24" className="mt-0.5 h-[18px] w-[18px] shrink-0 text-stone-700" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="4" y="11" width="16" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                <p className="text-[13px] leading-relaxed text-stone-700">
                  Quantos toques cada botão recebe, de onde vem cada visita e quais cidades mais acessam ficam no plano Essencial.
                </p>
              </div>
            )}
          </section>

          <section aria-labelledby="contatos" className={`${panel} px-6 py-[22px]`}>
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="contatos" className="text-base font-semibold">Quem deixou contato</h2>
              <Link href={people.some((x) => x.via === "Captação") || !people.length ? "/dashboard/contacts" : "/dashboard/formularios"} className="text-[13px] font-semibold text-blue-600 underline underline-offset-4 hover:text-blue-700">
                Ver todos
              </Link>
            </div>
            {people.length ? (
              <ul className="mt-3">
                {people.map((c) => {
                  const digits = c.phone.replace(/\D/g, "");
                  return (
                    <li key={c.id} className="flex flex-wrap items-center gap-x-3.5 gap-y-1 border-t border-[#EFEDE7] py-3 first:border-t-0">
                      <span className="min-w-0 flex-1 basis-[200px]">
                        <span className="block truncate text-sm font-semibold">{c.title}</span>
                        {c.detail ? <span className="block truncate text-[13px] text-stone-600">{c.detail}</span> : null}
                      </span>
                      <span className="text-[13px] text-stone-600">
                        {c.via}, {new Date(c.at).toLocaleDateString("pt-BR", { day: "numeric", month: "short", timeZone: TIME_ZONE })}
                      </span>
                      {digits.length >= 10 ? (
                        <a
                          href={`https://wa.me/${digits.replace(/^(?!55)/, "55")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[13px] font-semibold text-blue-600 underline underline-offset-4 hover:text-blue-700"
                        >
                          Abrir conversa
                        </a>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                Ninguém deixou contato ainda. Para receber, coloque na página um bloco de captação ou um formulário.{" "}
                <Link href="/dashboard/editor" className="font-semibold text-stone-900 underline underline-offset-4">
                  Abrir o editor
                </Link>
              </p>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-5 lg:col-span-4">
          <section aria-label="Sua página" className={`${panel} p-5`}>
            {doc && paid ? (
              <div className="mb-4 flex justify-center rounded-[10px] bg-[#F3F2EE] py-5">
                <span className="block overflow-hidden rounded-[26px] border-[6px] border-stone-900">
                  <ModelThumb doc={doc} width={160} height={290} />
                </span>
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              <span className="truncate text-[15px] font-semibold">{name}</span>
              {publishedAt ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2F6B3A]">
                  <span className="h-[7px] w-[7px] rounded-full bg-[#2F9E4F]" />
                  No ar
                </span>
              ) : (
                <span className="text-xs font-semibold text-stone-600">Rascunho</span>
              )}
            </div>
            <p className="mt-0.5 truncate text-[13px] text-stone-600">{paid ? published : `${host}/${profile.handle}`}</p>
            <div className="mt-3.5 flex gap-2">
              <Link
                href="/dashboard/editor"
                className="inline-flex h-[38px] flex-1 items-center justify-center rounded-[10px] bg-stone-900 text-sm font-semibold text-white transition-colors hover:bg-stone-800"
              >
                Editar
              </Link>
              <CopyLinkButton handle={profile.handle} variant="button" label={paid ? "Compartilhar" : "Copiar link"} />
            </div>
          </section>

          {paid && doneCount < steps.length ? (
            <section aria-labelledby="passos" className={`${panel} p-5`}>
              <h2 id="passos" className="text-base font-semibold">Falta pouco</h2>
              <p className="mt-1 text-[13px] text-stone-600">
                {doneCount} de {steps.length} passos feitos
              </p>
              <span className="mt-3 block h-1.5 overflow-hidden rounded-[3px] bg-[#EFEDE7]">
                <span className="block h-full bg-stone-900" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
              </span>
              <ul className="mt-3">
                {steps
                  .filter((s) => !s.done)
                  .map((s) => (
                    <li key={s.label} className="flex items-start gap-2.5 border-t border-[#EFEDE7] py-2.5 first:border-t-0">
                      <span className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded-full border-[1.5px] border-[#B9B6C9]" />
                      <span className="flex-1">
                        <span className="block text-sm font-semibold">{s.label}</span>
                        {s.hint ? <span className="block text-[13px] text-stone-600">{s.hint}</span> : null}
                      </span>
                      {s.href ? (
                        <Link href={s.href} className="text-[13px] font-semibold text-blue-600 hover:text-blue-700">
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
  );
}
