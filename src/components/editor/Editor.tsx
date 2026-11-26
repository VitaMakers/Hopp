"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { publish, saveDraft } from "@/app/dashboard/actions";
import { ClientSwitcher } from "@/app/dashboard/ClientSwitcher";
import type { Client } from "@/app/dashboard/context";
import { BrandSignature } from "@/components/page-view/BrandSignature";
import { PageView } from "@/components/page-view/PageView";
import { APP_NAME } from "@/lib/env";
import { showsBadge } from "@/lib/entitlements";
import type { PageDoc } from "@/lib/page/schema";
import { BlocksPanel } from "./BlocksPanel";
import { BrandPanel } from "./BrandPanel";
import { IntegrationsPanel } from "./IntegrationsPanel";
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

// The last version this browser saved for each client, with the time the
// server recorded. Going back in the browser can remount the editor with the
// page as it was first loaded; this keeps the newer saved version instead, so
// the next edit doesn't write an old page over it.
const lastSaved = new Map<string, { doc: PageDoc; at: string }>();

export function Editor({
  clientId,
  clients,
  draftAt,
  initialDoc,
  handle,
  plan,
  courtesy = false,
  publishedAt: initialPublishedAt,
  stats,
}: {
  // The client (profile) this editor is editing; every save names it.
  clientId: string;
  // Every client of the account, for the switcher in the top bar.
  clients: Client[];
  // When the draft handed in as initialDoc was last written, per the server.
  draftAt?: string | null;
  initialDoc: PageDoc;
  handle: string;
  plan: string;
  // A client of the platform admin account: free, but keeps the signature.
  courtesy?: boolean;
  publishedAt: string | null;
  stats?: BlockStats;
}) {
  const [doc, setDoc] = useState(() => {
    const saved = lastSaved.get(clientId);
    return saved && draftAt && saved.at > draftAt ? saved.doc : initialDoc;
  });
  const [tab, setTab] = useState<TabId>("conteudo");
  const [device, setDevice] = useState<"celular" | "computador">("celular");
  const [notice, setNotice] = useState<string | null>(null);
  // When a block is clicked in the preview, jump to its editor (the nonce lets
  // the same block re-focus on a repeat click).
  const [focus, setFocus] = useState<{ id: string; n: number } | null>(null);
  // What is being edited right now, highlighted in green in the preview.
  const [active, setActive] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Paint a green outline on the preview element that matches what's being
  // edited (a block, or a premium area tagged with data-edit).
  // The preview only scrolls to the highlighted part when the selection
  // changes — not on every edit, or dragging/typing elsewhere (e.g. positioning
  // the cover) would keep pulling the preview to the open block.
  const scrolledTo = useRef<string | null>(null);
  useEffect(() => {
    const root = previewRef.current;
    if (!root) return;
    root.querySelectorAll(".vita-edit-highlight").forEach((el) => el.classList.remove("vita-edit-highlight"));
    if (!active) {
      scrolledTo.current = null;
      return;
    }
    const safe = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(active) : active;
    const el = root.querySelector(`[data-edit="${safe}"]`);
    if (el) {
      el.classList.add("vita-edit-highlight");
      if (scrolledTo.current !== active) {
        scrolledTo.current = active;
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
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
    if (result.ok && result.savedAt) lastSaved.set(clientId, { doc: next, at: result.savedAt });
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
        if (result.publishedAt) lastSaved.set(clientId, { doc, at: result.publishedAt });
        setMessage("Página publicada. Já está no ar.");
      } else {
        setMessage(result.error);
        // Nothing was written: keep the edits and save them as a draft.
        pendingDoc.current = doc;
        void flush();
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

  const badge = showsBadge(plan) || courtesy ? (
    <div className="mt-12">
      <BrandSignature appName={APP_NAME} />
    </div>
  ) : null;

  const preview = (
    <div className="flex flex-col items-center gap-4">
      <div role="tablist" aria-label="Tamanho da prévia" className="hidden rounded-[11px] bg-[#E9E7E1] p-[3px] lg:inline-flex">
        {(["celular", "computador"] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={device === id}
            onClick={() => setDevice(id)}
            className={`h-8 rounded-[9px] px-3.5 text-[13px] font-semibold transition-colors ${device === id ? "bg-white text-stone-900" : "text-stone-700 hover:text-stone-900"}`}
          >
            {id === "celular" ? "Celular" : "Computador"}
          </button>
        ))}
      </div>
      <div
        ref={previewRef}
        className={
          device === "computador"
            ? "hidden h-[min(680px,calc(100vh-13rem))] min-h-[420px] w-full max-w-[860px] overflow-y-auto rounded-[14px] border border-[#D9D6CE] bg-white lg:block"
            : "h-[min(690px,calc(100vh-13rem))] min-h-[480px] w-full max-w-[330px] overflow-y-auto rounded-[46px] border-[9px] border-stone-900 bg-white"
        }
      >
        <PageView doc={doc} plan={plan} onEdit={handleEdit} footer={badge} />
      </div>
      <p className="text-xs text-stone-600">Prévia ao vivo. Toque em qualquer parte para editar.</p>
    </div>
  );

  const statusNode = (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-stone-600" aria-live="polite">
      <span className={`h-[7px] w-[7px] rounded-full ${statusDot[status]}`} />
      {status === "saved" && !publishedAt ? "Rascunho salvo, ainda não publicado" : statusLabel[status]}
    </span>
  );

  // The editor takes the whole screen, over the dashboard menu, like a
  // focused workspace: its own top bar, the panel and the live preview.
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#F3F2EE] text-stone-900">
      <header className="flex h-[60px] shrink-0 items-center justify-between gap-3 border-b border-[#E5E2DA] bg-white px-3 lg:px-[18px]">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            href="/dashboard"
            aria-label="Voltar ao início"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-[#E5E2DA] text-stone-700 transition-colors hover:border-stone-400"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <ClientSwitcher clients={clients} currentId={clientId} />
        </div>
        <div className="flex shrink-0 items-center gap-2 lg:gap-3">
          <span className="hidden sm:inline-flex">{statusNode}</span>
          <a
            href={`/${handle}`}
            target="_blank"
            rel="noreferrer"
            className="hidden h-9 items-center rounded-[9px] border border-[#E5E2DA] bg-white px-3.5 text-sm font-semibold text-stone-900 transition-colors hover:border-stone-400 lg:inline-flex"
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

      {notice || message ? (
        <div className="shrink-0 border-b border-[#E5E2DA] bg-white px-4 py-2.5 lg:px-[18px]">
          {notice ? <p className="text-sm text-stone-900">{notice}</p> : null}
          {message ? <p className={`text-sm ${status === "error" ? "text-red-800" : "text-stone-800"}`}>{message}</p> : null}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 lg:grid lg:grid-cols-[80px_440px_minmax(0,1fr)]">
        <nav aria-label="Partes do editor" className="hidden flex-col items-center gap-1 border-r border-[#E5E2DA] bg-white py-3.5 lg:flex">
          {(["conteudo", "aparencia", "ajustes"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => selectTab(id)}
              aria-pressed={tab === id}
              className={`flex w-[66px] flex-col items-center gap-1.5 rounded-[11px] pb-2 pt-2.5 text-xs font-semibold transition-colors ${
                tab === id ? "bg-[#EDEDF8] text-stone-900" : "text-stone-600 hover:bg-[#F3F2EE] hover:text-stone-900"
              }`}
            >
              <TabIcon id={id} />
              {TAB_LABELS[id]}
            </button>
          ))}
        </nav>

        <section
          className={`h-full min-w-0 overflow-y-auto px-4 pb-28 pt-4 lg:border-r lg:border-[#E5E2DA] lg:bg-white lg:px-[22px] lg:pb-10 lg:pt-6 ${
            tab === "previa" ? "hidden lg:block" : ""
          }`}
        >
          {tab === "conteudo" || tab === "previa" ? (
            <BlocksPanel doc={doc} onChange={setDoc} focus={focus} stats={stats} plan={plan} onActive={setActive} />
          ) : null}
          {tab === "aparencia" ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-[24px] font-bold tracking-[-0.02em]">Aparência</h2>
                <Link href="/dashboard/modelos" className="text-[13px] font-semibold text-blue-600 underline underline-offset-4 hover:text-blue-700">
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
              <h2 className="font-display text-[24px] font-bold tracking-[-0.02em]">Ajustes da página</h2>
              <SeoPanel doc={doc} onChange={setDoc} handle={handle} />
              <IntegrationsPanel doc={doc} onChange={setDoc} plan={plan} />
              <BrandPanel doc={doc} onChange={setDoc} plan={plan} />
              <a href={`/${handle}`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-stone-800 underline underline-offset-4 lg:hidden">
                Ver a página publicada
              </a>
            </div>
          ) : null}
        </section>

        <section
          aria-label="Prévia da página"
          className={`h-full overflow-y-auto px-4 pb-28 pt-6 lg:block lg:pb-8 ${tab === "previa" ? "block" : "hidden"}`}
        >
          {preview}
        </section>
      </div>

      <nav aria-label="Partes do editor" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 gap-1 border-t border-[#E5E2DA] bg-white px-2 pb-[max(10px,env(safe-area-inset-bottom))] pt-1.5 lg:hidden">
        {(["conteudo", "aparencia", "previa", "ajustes"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => selectTab(id)}
            aria-pressed={tab === id}
            className={`flex flex-col items-center gap-1 rounded-[10px] py-2 text-xs font-semibold transition-colors ${
              tab === id ? "bg-[#EDEDF8] text-stone-900" : "text-stone-600"
            }`}
          >
            {id === "ajustes" ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                <circle cx="5" cy="12" r="1.8" />
                <circle cx="12" cy="12" r="1.8" />
                <circle cx="19" cy="12" r="1.8" />
              </svg>
            ) : (
              <TabIcon id={id} />
            )}
            {id === "ajustes" ? "Mais" : TAB_LABELS[id]}
          </button>
        ))}
      </nav>
    </div>
  );
}
