"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { publish, saveDraft } from "@/app/dashboard/actions";
import { PageView } from "@/components/page-view/PageView";
import { APP_NAME, APP_TAGLINE } from "@/lib/env";
import { showsBadge } from "@/lib/entitlements";
import type { PageDoc } from "@/lib/page/schema";
import { BlocksPanel } from "./BlocksPanel";
import { ProfilePanel } from "./ProfilePanel";
import { SeoPanel } from "./SeoPanel";
import { TemplatesPanel } from "./TemplatesPanel";
import { ThemePanel } from "./ThemePanel";

// The active section is chosen in the left sidebar (src/app/dashboard/Sidebar.tsx).
// They stay in sync through the URL hash and a "vita:section" window event, so
// switching never reloads the page or drops unsaved edits.
const TAB_IDS = ["templates", "blocks", "profile", "theme", "seo"] as const;
type TabId = (typeof TAB_IDS)[number];
const TAB_LABELS: Record<TabId, string> = {
  templates: "Modelos",
  blocks: "Blocos",
  profile: "Perfil",
  theme: "Aparência",
  seo: "SEO",
};

type Status = "saved" | "dirty" | "saving" | "error";

export function Editor({
  initialDoc,
  handle,
  plan,
  publishedAt: initialPublishedAt,
}: {
  initialDoc: PageDoc;
  handle: string;
  plan: string;
  publishedAt: string | null;
}) {
  const [doc, setDoc] = useState(initialDoc);
  const [tab, setTab] = useState<TabId>("blocks");
  // When a block is clicked in the preview, jump to its editor (the nonce lets
  // the same block re-focus on a repeat click).
  const [focus, setFocus] = useState<{ id: string; n: number } | null>(null);

  // Switch section and let the sidebar follow (via the hash + event).
  function selectTab(id: TabId) {
    setTab(id);
    if (typeof window !== "undefined") {
      history.replaceState(null, "", `#${id}`);
      window.dispatchEvent(new CustomEvent("vita:section", { detail: id }));
    }
  }

  // Follow the sidebar: open the section named in the hash, and whenever the
  // sidebar fires "vita:section".
  useEffect(() => {
    const fromHash = window.location.hash.slice(1) as TabId;
    if (TAB_IDS.includes(fromHash)) setTab(fromHash);
    const onSection = (e: Event) => {
      const id = (e as CustomEvent).detail as TabId;
      if (TAB_IDS.includes(id)) setTab(id);
    };
    window.addEventListener("vita:section", onSection);
    return () => window.removeEventListener("vita:section", onSection);
  }, []);

  function handleEdit(target: string) {
    if (target === "profile") return selectTab("profile");
    // Premium model parts live in the Aparência (theme) tab: open it and focus
    // the matching card.
    if (target === "appearance" || target === "premium" || target.startsWith("premium:")) {
      selectTab("theme");
      const id = target === "appearance" || target === "premium" ? "premium:__group" : target;
      return setFocus((f) => ({ id, n: (f?.n ?? 0) + 1 }));
    }
    // A real block id opens the Blocos tab and focuses that block.
    selectTab("blocks");
    setFocus((f) => ({ id: target, n: (f?.n ?? 0) + 1 }));
  }
  const [status, setStatus] = useState<Status>("saved");
  const [publishedAt, setPublishedAt] = useState(initialPublishedAt);
  const [message, setMessage] = useState<string | null>(null);
  const [publishing, startPublish] = useTransition();
  const firstRender = useRef(true);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  // Build the public URL from the current domain, so it works on virttu.tech
  // or any other domain the app is served from.
  useEffect(() => setOrigin(window.location.origin), []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${origin}/${handle}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  // Autosave the draft a moment after the last change.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setStatus("dirty");
    const timer = setTimeout(async () => {
      setStatus("saving");
      const result = await saveDraft(doc);
      setStatus(result.ok ? "saved" : "error");
      if (!result.ok) setMessage(result.error);
    }, 1200);
    return () => clearTimeout(timer);
  }, [doc]);

  function onPublish() {
    setMessage(null);
    startPublish(async () => {
      const result = await publish(doc);
      if (result.ok) {
        setStatus("saved");
        setPublishedAt(result.publishedAt ?? new Date().toISOString());
        setMessage("Página publicada.");
      } else {
        setMessage(result.error);
      }
    });
  }

  const statusLabel: Record<Status, string> = {
    saved: "Rascunho salvo",
    dirty: "Alterações não salvas",
    saving: "Salvando...",
    error: "Erro ao salvar",
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold">{TAB_LABELS[tab]}</h1>
          <span className="text-xs text-stone-500">{statusLabel[status]}</span>
          <div className="ml-auto flex items-center gap-3">
            {publishedAt ? (
              <span className="hidden text-xs text-stone-500 sm:inline">
                Publicada em {new Date(publishedAt).toLocaleString("pt-BR")}
              </span>
            ) : null}
            <button type="button" onClick={onPublish} disabled={publishing} className="btn-primary">
              {publishing ? "Publicando..." : "Publicar"}
            </button>
          </div>
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 ring-1 ring-stone-200">
          <span className="text-xs font-medium text-stone-500">Seu link:</span>
          <code className="min-w-0 flex-1 truncate text-sm text-stone-800">
            {origin ? `${origin.replace(/^https?:\/\//, "")}/${handle}` : `/${handle}`}
          </code>
          <button
            type="button"
            onClick={copyLink}
            className="rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-stone-700"
          >
            {copied ? "Copiado!" : "Copiar link"}
          </button>
          <a
            href={`/${handle}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-stone-700 ring-1 ring-stone-300 transition hover:ring-stone-900"
          >
            Abrir
          </a>
          {!publishedAt ? (
            <span className="w-full text-xs text-amber-700">Clique em Publicar para o link ficar no ar.</span>
          ) : null}
        </div>
        {message ? <p className="mb-3 text-sm text-stone-700">{message}</p> : null}

        {tab === "templates" ? <TemplatesPanel doc={doc} onChange={setDoc} plan={plan} onGoToBlocks={() => selectTab("blocks")} /> : null}
        {tab === "blocks" ? <BlocksPanel doc={doc} onChange={setDoc} focus={focus} /> : null}
        {tab === "profile" ? <ProfilePanel doc={doc} onChange={setDoc} plan={plan} /> : null}
        {tab === "theme" ? <ThemePanel doc={doc} onChange={setDoc} focus={focus} /> : null}
        {tab === "seo" ? <SeoPanel doc={doc} onChange={setDoc} handle={handle} /> : null}
      </section>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <p className="mb-2 text-center text-xs text-stone-500">Prévia</p>
        <div className="mx-auto h-[680px] w-full max-w-[360px] overflow-y-auto rounded-[2.2rem] border-[10px] border-stone-900 bg-white shadow-xl">
          <PageView
            doc={doc}
            plan={plan}
            onEdit={handleEdit}
            footer={
              showsBadge(plan) ? (
                <div className="mt-12 flex flex-col items-center gap-0.5 text-center opacity-70">
                  <span className="text-sm font-semibold">{APP_NAME}</span>
                  <span className="text-xs">{APP_TAGLINE}</span>
                </div>
              ) : null
            }
          />
        </div>
      </aside>
    </div>
  );
}
