import { defaultPageDoc } from "@/lib/page/catalog";
import { normalizeLegacyCover } from "@/lib/page/migrate";
import { pageDocSchema } from "@/lib/page/schema";
import { Editor } from "@/components/editor/Editor";
import { getOwner } from "../context";

export default async function EditorPage() {
  const { supabase, profile, clients } = await getOwner();
  const { data: page } = await supabase
    .from("pages")
    .select("draft, published_at, updated_at")
    .eq("owner_id", profile.id)
    .maybeSingle();
  const parsed = pageDocSchema.safeParse(page?.draft);
  // A saved page that can't be read must never be replaced by a blank one (the
  // autosave would overwrite the owner's content). Show a notice instead.
  if (!parsed.success && page?.draft) {
    console.error("draft failed validation", profile.id, parsed.error.issues.slice(0, 3));
    return (
      <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-200">
        <h1 className="text-xl font-bold">Não conseguimos abrir esta página agora</h1>
        <p className="mt-2 text-sm text-stone-600">
          O conteúdo está guardado e nada foi apagado. Recarregue em alguns instantes; se continuar, fale com o suporte informando o endereço /{profile.handle}.
        </p>
      </div>
    );
  }
  const doc = normalizeLegacyCover(parsed.success ? parsed.data : defaultPageDoc(profile.display_name || profile.handle));
  // Onboarding writes the profile and the page separately; if the second
  // write failed, create the page now so saving and publishing have a row.
  if (!page) await supabase.from("pages").insert({ owner_id: profile.id, draft: doc });

  // Per-block performance for the last 30 days, shown inline in the blocks list.
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data: ev } = await supabase
    .from("events")
    .select("kind, block_id")
    .eq("owner_id", profile.id)
    .gte("created_at", since)
    .limit(50000);
  let views = 0;
  const clicks: Record<string, number> = {};
  for (const e of (ev ?? []) as { kind: string; block_id: string | null }[]) {
    if (e.kind === "page_view") views += 1;
    else if (e.kind === "block_click" && e.block_id) clicks[e.block_id] = (clicks[e.block_id] ?? 0) + 1;
  }

  return (
    <Editor
      key={profile.id}
      clientId={profile.id}
      clients={clients}
      draftAt={page?.updated_at ?? null}
      initialDoc={doc}
      handle={profile.handle}
      plan={profile.plan}
      publishedAt={page?.published_at ?? null}
      stats={{ views, clicks }}
    />
  );
}
