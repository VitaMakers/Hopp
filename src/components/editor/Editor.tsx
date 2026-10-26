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

const TABS = [
  { id: "templates", label: "Modelos" },
  { id: "blocks", label: "Blocos" },
  { id: "profile", label: "Perfil" },
  { id: "theme", label: "Aparência" },
  { id: "seo", label: "SEO" },
] as const;

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
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("blocks");
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
          <div className="flex rounded-lg bg-white p-1 ring-1 ring-stone-200">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`rounded-md px-3 py-1.5 text-sm ${tab === item.id ? "bg-stone-900 text-white" : "text-stone-600"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
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

        {tab === "templates" ? <TemplatesPanel doc={doc} onChange={setDoc} plan={plan} onGoToBlocks={() => setTab("blocks")} /> : null}
        {tab === "blocks" ? <BlocksPanel doc={doc} onChange={setDoc} /> : null}
        {tab === "profile" ? <ProfilePanel doc={doc} onChange={setDoc} plan={plan} /> : null}
        {tab === "theme" ? <ThemePanel doc={doc} onChange={setDoc} /> : null}
        {tab === "seo" ? <SeoPanel doc={doc} onChange={setDoc} handle={handle} /> : null}
      </section>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <p className="mb-2 text-center text-xs text-stone-500">Prévia</p>
        <div className="mx-auto h-[680px] w-full max-w-[360px] overflow-y-auto rounded-[2.2rem] border-[10px] border-stone-900 bg-white shadow-xl">
          <PageView
            doc={doc}
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
