"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BlockFields } from "@/components/editor/BlockFields";
import type { Block } from "@/lib/page/schema";
import { CopyLink } from "../CopyLink";
import { deleteForm, saveFormConfig } from "../actions";

type FormConfig = Extract<Block, { type: "form" }>;
type Status = "saved" | "dirty" | "saving" | "error";

export function FormEditor({ id, code, initialConfig }: { id: string; code: string; initialConfig: FormConfig }) {
  const [config, setConfig] = useState<FormConfig>(initialConfig);
  const [status, setStatus] = useState<Status>("saved");
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setStatus("dirty");
    const timer = setTimeout(async () => {
      setStatus("saving");
      const r = await saveFormConfig(id, config);
      setStatus(r.ok ? "saved" : "error");
    }, 1000);
    return () => clearTimeout(timer);
  }, [config, id]);

  const label: Record<Status, string> = {
    saved: "Salvo",
    dirty: "Alterações não salvas",
    saving: "Salvando...",
    error: "Erro ao salvar",
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/formularios" className="text-sm text-stone-500 hover:text-stone-900">
          ← Formulários
        </Link>
        <span className="text-xs text-stone-500">{label[status]}</span>
      </div>

      <div className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
        <p className="mb-2 text-sm font-medium text-stone-700">Link do formulário</p>
        <CopyLink code={code} />
        <div className="mt-3 flex gap-4 text-xs">
          <a href={`/f/${code}`} target="_blank" rel="noreferrer" className="text-stone-600 hover:underline">
            Abrir formulário
          </a>
          <Link href={`/dashboard/formularios/${id}/respostas`} className="text-stone-600 hover:underline">
            Ver respostas
          </Link>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
        <BlockFields block={config} onChange={(b) => setConfig(b as FormConfig)} />
      </div>

      <form
        action={deleteForm.bind(null, id)}
        onSubmit={(e) => {
          if (!window.confirm("Excluir este formulário e todas as suas respostas? Não dá para desfazer.")) e.preventDefault();
        }}
      >
        <button type="submit" className="text-sm text-red-600 hover:underline">
          Excluir formulário
        </button>
      </form>
    </div>
  );
}
