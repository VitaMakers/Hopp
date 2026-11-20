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

const TIME_ZONE = "America/Sao_Paulo";
const DAY = 86_400_000;

// The premium models shown to free accounts, in this order.
const SHOWCASE = ["resto-menu", "resto-bar", "resto-bistro", "bf-loja", "presenca"];

function greeting(now: Date): string {
  const hour = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hourCycle: "h23", timeZone: TIME_ZONE }).format(now));
  if (hour < 5) return "Boa noite";
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

const n = (v: number) => v.toLocaleString("pt-BR");

function change(now: number, before: number): { text: string; up: boolean | null } {
  if (!before) return { text: now ? "Primeira semana com visitas" : "Ainda sem visitas", up: null };
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) return { text: "Igual à semana anterior", up: null };
  return { text: `${pct > 0 ? "+" : ""}${pct}% sobre a semana anterior`, up: pct > 0 };
}

export default async function HomePage() {
  const { supabase, profile } = await getOwner();
  const host = new URL(await siteOrigin()).host;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * DAY).toISOString();
  const twoWeeksAgo = new Date(now.getTime() - 14 * DAY).toISOString();
  const paid = isPaid(profile.plan);
  const full = hasFullAnalytics(profile.plan);

  const count = (query: PromiseLike<{ count: number | null }>) => query.then((r) => r.count ?? 0);
  const events = () => supabase.from("events").select("id", { count: "exact", head: true }).eq("owner_id", profile.id);

  const [{ data: page }, views, viewsBefore, clicks, contacts, responses, everViewed, { data: clickRows }, { data: latest }] = await Promise.all([
    supabase.from("pages").select("draft, published_at").eq("owner_id", profile.id).maybeSingle(),
    count(events().eq("kind", "page_view").gte("created_at", weekAgo)),
    count(events().eq("kind", "page_view").gte("created_at", twoWeeksAgo).lt("created_at", weekAgo)),
    count(events().eq("kind", "block_click").gte("created_at", weekAgo)),
    count(supabase.from("contacts").select("id", { count: "exact", head: true }).eq("owner_id", profile.id).gte("created_at", weekAgo)),
    count(supabase.from("form_responses").select("id", { count: "exact", head: true }).eq("owner_id", profile.id).gte("created_at", weekAgo)),
    count(events().eq("kind", "page_view")),
    supabase.from("events").select("block_id").eq("owner_id", profile.id).eq("kind", "block_click").gte("created_at", weekAgo).limit(5000),
    supabase.from("contacts").select("id, email, phone, created_at").eq("owner_id", profile.id).order("created_at", { ascending: false }).limit(3),
  ]);

  const parsed = pageDocSchema.safeParse(page?.draft);
  const doc: PageDoc | null = parsed.success ? parsed.data : null;
  const publishedAt = page?.published_at ? new Date(page.published_at) : null;
  const newContacts = contacts + responses;

  // Most clicked buttons this week, named as in the editor.
  const byBlock = new Map<string, number>();
  for (const row of (clickRows ?? []) as { block_id: string | null }[]) {
    if (row.block_id) byBlock.set(row.block_id, (byBlock.get(row.block_id) ?? 0) + 1);
  }
  const top = [...byBlock.entries()]
    .map(([id, total]) => {
      const block = doc?.blocks.find((b) => b.id === id);
      return block ? { id, name: blockSummary(block), total } : null;
    })
    .filter((x): x is { id: string; name: string; total: number } => !!x)
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);
  const topMax = top[0]?.total ?? 1;

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

  const v = change(views, viewsBefore);
  const name = profile.display_name || profile.handle;
  const published = publishedAt
    ? `Publicada em ${publishedAt.toLocaleString("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE })}`
    : "Ainda não publicada";

  const panel = "rounded-[14px] border border-[#E5E2DA] bg-white";

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[30px] font-bold leading-tight tracking-[-0.025em]">{greeting(now)}</h1>
          <p className="mt-2 text-[15px] text-stone-600">
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
            <div className="flex items-baseline justify-between">
              <h2 id="semana" className="text-base font-semibold">Últimos 7 dias</h2>
              <Link href="/dashboard/analytics" className="text-[13px] font-semibold text-blue-600 underline underline-offset-4 hover:text-blue-700">
                Ver estatísticas
              </Link>
            </div>
            {full ? (
              <>
                <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-0">
                  <div className="sm:pr-5">
                    <dt className="text-[13px] text-stone-600">Visitas</dt>
                    <dd className="mt-1 text-[26px] font-semibold tracking-[-0.02em]">{n(views)}</dd>
                    <dd className={`mt-0.5 text-xs ${v.up ? "text-[#2F6B3A]" : "text-stone-600"}`}>{v.text}</dd>
                  </div>
                  <div className="sm:border-l sm:border-[#EFEDE7] sm:px-5">
                    <dt className="text-[13px] text-stone-600">Cliques nos botões</dt>
                    <dd className="mt-1 text-[26px] font-semibold tracking-[-0.02em]">{n(clicks)}</dd>
                    <dd className="mt-0.5 text-xs text-stone-600">
                      {views ? `${Math.round((clicks / views) * 100)} cliques a cada 100 visitas` : "Sem visitas na semana"}
                    </dd>
                  </div>
                  <div className="sm:border-l sm:border-[#EFEDE7] sm:pl-5">
                    <dt className="text-[13px] text-stone-600">Contatos novos</dt>
                    <dd className="mt-1 text-[26px] font-semibold tracking-[-0.02em]">{n(newContacts)}</dd>
                    <dd className="mt-0.5 text-xs text-stone-600">
                      {responses ? `${n(responses)} por formulário` : "Captação e formulários"}
                    </dd>
                  </div>
                </dl>
                {top.length ? (
                  <div className="mt-5 border-t border-[#EFEDE7] pt-4">
                    <h3 className="mb-3 text-[13px] font-semibold text-stone-700">Botões mais clicados</h3>
                    <ul className="flex flex-col gap-2.5">
                      {top.map((t) => (
                        <li key={t.id} className="grid grid-cols-[minmax(0,170px)_minmax(0,1fr)_64px] items-center gap-3.5 text-sm">
                          <span className="truncate">{t.name}</span>
                          <span className="h-2 overflow-hidden rounded bg-[#EFEDE7]">
                            <span className="block h-full rounded bg-stone-900" style={{ width: `${Math.max(4, (t.total / topMax) * 100)}%` }} />
                          </span>
                          <span className="text-right text-stone-700">{n(t.total)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="mt-4 flex flex-wrap items-start gap-7">
                <div>
                  <p className="text-[13px] text-stone-600">Visitas</p>
                  <p className="mt-1 text-[26px] font-semibold tracking-[-0.02em]">{n(views)}</p>
                </div>
                <div className="flex min-w-[240px] flex-1 items-start gap-3 rounded-[10px] bg-[#F6F5F1] px-4 py-3.5">
                  <svg viewBox="0 0 24 24" className="mt-0.5 h-[18px] w-[18px] shrink-0 text-stone-700" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="4" y="11" width="16" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                  <p className="text-[13px] leading-relaxed text-stone-700">
                    Quantos cliques cada botão recebe, de onde vem cada visita e quais cidades mais acessam ficam no plano Essencial.
                  </p>
                </div>
              </div>
            )}
          </section>

          <section aria-labelledby="contatos" className={`${panel} px-6 py-[22px]`}>
            <div className="flex items-baseline justify-between">
              <h2 id="contatos" className="text-base font-semibold">Últimos contatos</h2>
              <Link href="/dashboard/contacts" className="text-[13px] font-semibold text-blue-600 underline underline-offset-4 hover:text-blue-700">
                Ver todos
              </Link>
            </div>
            {latest?.length ? (
              <ul className="mt-3">
                {latest.map((c) => (
                  <li key={c.id} className="flex items-center gap-3.5 border-t border-[#EFEDE7] py-3 first:border-t-0">
                    <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#EDEDF8] text-xs font-semibold">
                      {(c.email || c.phone || "?").slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{c.email || c.phone}</span>
                      {c.email && c.phone ? <span className="block text-[13px] text-stone-600">{c.phone}</span> : null}
                    </span>
                    <span className="text-[13px] text-stone-600">
                      {new Date(c.created_at).toLocaleDateString("pt-BR", { day: "numeric", month: "short", timeZone: TIME_ZONE })}
                    </span>
                    {c.phone && c.phone.replace(/\D/g, "").length >= 10 ? (
                      <a
                        href={`https://wa.me/${c.phone.replace(/\D/g, "").replace(/^(?!55)/, "55")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[13px] font-semibold text-blue-600 underline underline-offset-4 hover:text-blue-700"
                      >
                        Abrir conversa
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-stone-600">
                Ninguém deixou contato ainda. Um bloco de captação ou um formulário na página traz os contatos para cá.
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
