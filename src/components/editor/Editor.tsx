"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { publish, saveDraft } from "@/app/dashboard/actions";
import { PageView } from "@/components/page-view/PageView";
import { APP_NAME, APP_TAGLINE } from "@/lib/env";
import { showsBadge } from "@/lib/entitlements";
import type { PageDoc } from "@/lib/page/schema";
import { BlocksPanel } from "./BlocksPanel";
import { SeoPanel } from "./SeoPanel";
import { ThemePanel } from "./ThemePanel";

// Three parts, each in one place: what is on the page (Conteúdo), how it looks
// (Aparência) and page settings like SEO (Ajustes). On a phone a fourth tab
// shows the live preview. The URL hash keeps the part on reload.
const TAB_IDS = ["conteudo", "aparencia", "ajustes", "previa"] as const;
type TabId = (typeof TAB_IDS)[number];
const TAB_LABELS: Record<TabId, string> = {
  conteudo: "Conteúdo",
  aparencia: "Aparência",
  ajustes: "Ajustes",
  previa: "Prévia",
};

const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function TabIcon({ id }: { id: TabId }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      {id === "conteudo" ? (
        <>
          <rect x="3" y="4" width="18" height="4" rx="1.5" {...P} />
          <rect x="3" y="10" width="18" height="4" rx="1.5" {...P} />
          <rect x="3" y="16" width="18" height="4" rx="1.5" {...P} />
        </>
      ) : id === "aparencia" ? (
        <>
          <path d="M12 21a9 9 0 1 1 9-9c0 2.2-1.8 3-3.5 3H16a2 2 0 0 0-1.4 3.4A1.5 1.5 0 0 1 12 21z" {...P} />
          <circle cx="7.5" cy="10.5" r="1" fill="currentColor" />
          <circle cx="12" cy="7" r="1" fill="currentColor" />
          <circle cx="16.5" cy="10.5" r="1" fill="currentColor" />
        </>
      ) : id === "ajustes" ? (
        <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1.5 14h5M9.5 8h5M17.5 16h5" {...P} />
      ) : (
        <>
          <rect x="6" y="2" width="12" height="20" rx="2.5" {...P} />
          <path d="M10.5 18h3" {...P} />
        </>
      )}
    </svg>
  );
}

type Status = "saved" | "dirty" | "saving" | "error";

export type BlockStats = { views: number; clicks: Record<string, number> };

export function Editor({
  clientId,
  initialDoc,
  handle,
  plan,
  publishedAt: initialPublishedAt,
  stats,
}: {
  // The client (profile) this editor is editing; every save names it.
  clientId: string;
  initialDoc: PageDoc;
  handle: string;
  plan: string;
  publishedAt: string | null;
  stats?: BlockStats;
}) {
  const [doc, setDoc] = useState(initialDoc);
  const [tab, setTab] = useState<TabId>("conteudo");
  const [notice, setNotice] = useState<string | null>(null);
  // When a block is clicked in the preview, jump to its editor (the nonce lets
  // the same block re-focus on a repeat click).
  const [focus, setFocus] = useState<{ id: string; n: number } | null>(null);
  // What is being edited right now, highlighted in green in the preview.
  const [active, setActive] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Paint a green outline on the preview element that matches what's being
  // edited (a block, or a premium area tagged with data-edit).
  useEffect(() => {
    const root = previewRef.current;
    if (!root) return;
    root.querySelectorAll(".vita-edit-highlight").forEach((el) => el.classList.remove("vita-edit-highlight"));
    if (!active) return;
    const safe = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(active) : active;
    const el = root.querySelector(`[data-edit="${safe}"]`);
    if (el) {
      el.classList.add("vita-edit-highlight");
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [active, doc]);

  // Switch part; the hash keeps it on reload.
  function selectTab(id: TabId) {
    setTab(id);
    if (typeof window !== "undefined") history.replaceState(null, "", `${window.location.pathname}#${id}`);
  }

  useEffect(() => {
    const fromHash = window.location.hash.slice(1) as TabId;
    if (TAB_IDS.includes(fromHash) && fromHash !== "previa") setTab(fromHash);
    // Coming back from the models gallery after applying one.
    if (new URLSearchParams(window.location.search).get("modelo") === "aplicado") {
      setNotice("Modelo aplicado no rascunho. Revise e publique quando quiser.");
      history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  function handleEdit(target: string) {
    // Everything clickable in the preview is edited in Conteúdo.
    selectTab("conteudo");
    if (target === "profile") return;
    if (target === "appearance" || target === "premium" || target.startsWith("premium:")) {
      const id = target === "appearance" || target === "premium" ? "premium:__group" : target;
      return setFocus((f) => ({ id, n: (f?.n ?? 0) + 1 }));
    }
    setFocus((f) => ({ id: target, n: (f?.n ?? 0) + 1 }));
  }
  const [status, setStatus] = useState<Status>("saved");
  const [publishedAt, setPublishedAt] = useState(initialPublishedAt);
  const [message, setMessage] = useState<string | null>(null);
  const [publishing, startPublish] = useTransition();
  const firstRender = useRef(true);

  // Autosave the draft a moment after the last change. pendingDoc holds edits
  // not yet sent; saveSeq makes sure only the newest save sets the status.
  const pendingDoc = useRef<PageDoc | null>(null);
  const saveSeq = useRef(0);

  const flush = useCallback(async () => {
    const next = pendingDoc.current;
    if (!next) return;
    pendingDoc.current = null;
    const seq = ++saveSeq.current;
    setStatus("saving");
    const result = await saveDraft(clientId, next);
    // A newer save started, or newer edits are waiting: let those decide.
    if (seq !== saveSeq.current || pendingDoc.current) return;
    setStatus(result.ok ? "saved" : "error");
    if (result.ok) {
      // Clear an earlier save error once saving works again.
      setMessage((m) => (m && m.startsWith("Não foi possível salvar") ? null : m));
    } else {
      setMessage(result.error);
    }
  }, [clientId]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    pendingDoc.current = doc;
    setStatus("dirty");
    const timer = setTimeout(() => void flush(), 1200);
    return () => clearTimeout(timer);
  }, [doc, flush]);

  // Leaving the editor (another dashboard page, closing the tab) must not drop
  // the last edits: save them on the way out, and warn before closing the tab
  // while something is still unsaved.
  useEffect(() => {
    const onHide = () => {
      if (pendingDoc.current) void flush();
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingDoc.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("pagehide", onHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (pendingDoc.current) void flush();
    };
  }, [flush]);

  function onPublish() {
    setMessage(null);
    startPublish(async () => {
      // Publishing also saves the draft, so nothing is pending afterwards.
      pendingDoc.current = null;
      saveSeq.current += 1;
      const result = await publish(clientId, doc);
      if (result.ok) {
        setStatus("saved");
        setPublishedAt(result.publishedAt ?? new Date().toISOString());
        setMessage("Página publicada. Já está no ar.");
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

  const statusDot: Record<Status, string> = {
    saved: "bg-[#2F9E4F]",
    dirty: "bg-amber-500",
    saving: "bg-amber-500",
    error: "bg-red-600",
  };

  const preview = (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs text-stone-600">Prévia ao vivo. Toque em qualquer parte para editar.</p>
      <div
        ref={previewRef}
        className="h-[min(690px,calc(100vh-11rem))] min-h-[520px] w-full max-w-[340px] overflow-y-auto rounded-[46px] border-[9px] border-stone-900 bg-white"
      >
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
    </div>
  );

  return (
    <div className="flex flex-col gap-4 pb-20 lg:pb-0">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-[26px] font-bold tracking-[-0.02em]">Minha página</h1>
          <span className="inline-flex items-center gap-1.5 text-[13px] text-stone-600" aria-live="polite">
            <span className={`h-[7px] w-[7px] rounded-full ${statusDot[status]}`} />
            {statusLabel[status]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {publishedAt ? (
            <span className="hidden text-xs text-stone-600 xl:inline">
              Publicada em {new Date(publishedAt).toLocaleString("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          ) : null}
          <a
            href={`/${handle}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center rounded-[9px] border border-[#E5E2DA] bg-white px-3.5 text-sm font-semibold text-stone-900 transition-colors hover:border-stone-400"
          >
            Ver página
          </a>
          <button
            type="button"
            onClick={onPublish}
            disabled={publishing}
            className="h-9 rounded-[9px] bg-blue-600 px-[18px] text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {publishing ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </header>

      {!publishedAt ? (
        <p className="rounded-[10px] bg-amber-50 px-4 py-2.5 text-sm text-amber-900 ring-1 ring-amber-200">
          Sua página ainda não está no ar. Quando estiver pronta, clique em Publicar.
        </p>
      ) : null}
      {notice ? <p className="rounded-[10px] bg-[#EDEDF8] px-4 py-2.5 text-sm text-stone-900">{notice}</p> : null}
      {message ? (
        <p className={`rounded-[10px] px-4 py-2.5 text-sm ${status === "error" ? "bg-red-50 text-red-800 ring-1 ring-red-200" : "bg-white text-stone-800 ring-1 ring-[#E5E2DA]"}`}>
          {message}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-[14px] border border-[#E5E2DA] bg-white lg:grid lg:grid-cols-[76px_minmax(0,460px)_minmax(0,1fr)]">
        <nav aria-label="Partes do editor" className="hidden flex-col items-center gap-1 border-r border-[#E5E2DA] py-3.5 lg:flex">
          {(["conteudo", "aparencia", "ajustes"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => selectTab(id)}
              aria-pressed={tab === id}
              className={`flex w-16 flex-col items-center gap-1.5 rounded-[11px] pb-2 pt-2.5 text-xs font-semibold transition-colors ${
                tab === id ? "bg-[#EDEDF8] text-stone-900" : "text-stone-600 hover:bg-[#F3F2EE] hover:text-stone-900"
              }`}
            >
              <TabIcon id={id} />
              {TAB_LABELS[id]}
            </button>
          ))}
        </nav>

        <section className={`min-w-0 p-5 lg:border-r lg:border-[#E5E2DA] ${tab === "previa" ? "hidden lg:block" : ""}`}>
          {tab === "conteudo" || tab === "previa" ? (
            <BlocksPanel doc={doc} onChange={setDoc} focus={focus} stats={stats} plan={plan} onActive={setActive} />
          ) : null}
          {tab === "aparencia" ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">Aparência</h2>
                <Link href="/dashboard/modelos" className="text-[13px] font-semibold text-blue-600 hover:text-blue-700">
                  Trocar modelo
                </Link>
              </div>
              <ThemePanel
                doc={doc}
                onChange={setDoc}
                onGoColors={() => {
                  selectTab("conteudo");
                  setFocus((f) => ({ id: "premium:colors", n: (f?.n ?? 0) + 1 }));
                }}
              />
            </div>
          ) : null}
          {tab === "ajustes" ? (
            <div className="flex flex-col gap-4">
              <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">Ajustes da página</h2>
              <SeoPanel doc={doc} onChange={setDoc} handle={handle} />
            </div>
          ) : null}
        </section>

        <section
          aria-label="Prévia da página"
          className={`bg-[#F6F5F1] px-4 py-6 lg:block ${tab === "previa" ? "block" : "hidden"}`}
        >
          <div className="lg:sticky lg:top-6">{preview}</div>
        </section>
      </div>

      <nav aria-label="Partes do editor" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 gap-1 border-t border-[#E5E2DA] bg-white px-2 pb-5 pt-1.5 lg:hidden">
        {TAB_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => selectTab(id)}
            aria-pressed={tab === id}
            className={`flex flex-col items-center gap-1 rounded-[10px] py-2 text-xs font-semibold transition-colors ${
              tab === id ? "bg-[#EDEDF8] text-stone-900" : "text-stone-600"
            }`}
          >
            <TabIcon id={id} />
            {TAB_LABELS[id]}
          </button>
        ))}
      </nav>
    </div>
  );
}
