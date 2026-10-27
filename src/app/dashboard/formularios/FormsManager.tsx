"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { publish, saveDraft } from "@/app/dashboard/actions";
import { BlockFields } from "@/components/editor/BlockFields";
import { FORM_PRESETS } from "@/lib/page/catalog";
import type { Block, PageDoc } from "@/lib/page/schema";

type Status = "saved" | "dirty" | "saving" | "error";

export function FormsManager({ initialDoc, handle }: { initialDoc: PageDoc; handle: string }) {
  const [doc, setDoc] = useState(initialDoc);
  const [status, setStatus] = useState<Status>("saved");
  const [message, setMessage] = useState<string | null>(null);
  const [publishing, startPublish] = useTransition();
  const [picking, setPicking] = useState(false);
  const firstRender = useRef(true);

  // Autosave the draft shortly after the last change (same as the main editor).
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
    }, 1000);
    return () => clearTimeout(timer);
  }, [doc]);

  const forms = doc.blocks.filter((b) => b.type === "form");

  function updateBlock(updated: Block) {
    setDoc({ ...doc, blocks: doc.blocks.map((b) => (b.id === updated.id ? updated : b)) });
  }
  function addForm(presetId: string) {
    const preset = FORM_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setDoc({ ...doc, blocks: [...doc.blocks, preset.build()] });
    setPicking(false);
  }
  function removeForm(id: string) {
    if (!window.confirm("Remover este formulário da página? As respostas já recebidas continuam salvas.")) return;
    setDoc({ ...doc, blocks: doc.blocks.filter((b) => b.id !== id) });
  }

  function onPublish() {
    setMessage(null);
    startPublish(async () => {
      const result = await publish(doc);
      setMessage(result.ok ? "Formulário publicado — já está no ar na sua página." : result.error);
    });
  }

  const statusLabel: Record<Status, string> = {
    saved: "Rascunho salvo",
    dirty: "Alterações não salvas",
    saving: "Salvando...",
    error: "Erro ao salvar",
  };

  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-200 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Seus formulários</h2>
          <p className="text-xs text-stone-500">
            Aparecem na sua página <span className="font-medium">/{handle}</span>. Publique para ir ao ar.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-500">{statusLabel[status]}</span>
          <button type="button" onClick={onPublish} disabled={publishing} className="btn-primary text-sm">
            {publishing ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </div>

      {message ? <p className="mb-3 text-sm text-stone-700">{message}</p> : null}

      <div className="flex flex-col gap-4">
        {forms.length === 0 ? (
          <p className="rounded-xl bg-stone-50 p-4 text-sm text-stone-500 ring-1 ring-stone-200">
            Nenhum formulário ainda. Clique em “Criar formulário” para começar.
          </p>
        ) : (
          forms.map((block, i) => (
            <div key={block.id} className="rounded-xl border border-stone-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold">Formulário {i + 1}</span>
                <button type="button" onClick={() => removeForm(block.id)} className="text-xs text-red-600 hover:underline">
                  Remover
                </button>
              </div>
              <BlockFields block={block} onChange={updateBlock} />
            </div>
          ))
        )}

        {picking ? (
          <div className="rounded-xl border border-stone-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Escolha um modelo</p>
              <button type="button" onClick={() => setPicking(false)} className="text-xs text-stone-500 hover:underline">
                Cancelar
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {FORM_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => addForm(preset.id)}
                  className="flex flex-col gap-1 rounded-lg border border-stone-200 p-3 text-left transition hover:border-stone-900"
                >
                  <span className="text-sm font-semibold">{preset.name}</span>
                  <span className="text-xs text-stone-500">{preset.description}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="self-start rounded-lg border border-dashed border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 transition hover:border-stone-900 hover:text-stone-900"
          >
            + Criar formulário
          </button>
        )}
      </div>
    </div>
  );
}
