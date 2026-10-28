"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { UploadButton } from "@/components/editor/UploadButton";
import { imageSrc } from "@/lib/page/links";
import type { Block } from "@/lib/page/schema";
import { CopyLink } from "../CopyLink";
import { deleteForm, saveFormConfig } from "../actions";

type FormConfig = Extract<Block, { type: "form" }>;
type Field = FormConfig["fields"][number];
type FieldType = Field["type"];
type Status = "saved" | "dirty" | "saving" | "error";

type PaletteItem = { type: FieldType; label: string; icon: string };

// Básico palette, grouped like the WhatsForm builder.
const BASICO: { group: string; items: PaletteItem[] }[] = [
  {
    group: "Perguntas",
    items: [
      { type: "text", label: "Entrada de Texto", icon: "T" },
      { type: "radio", label: "Múltipla escolha", icon: "◉" },
      { type: "checkbox", label: "Caixas de seleção", icon: "☑" },
      { type: "select", label: "Suspenso", icon: "▾" },
      { type: "number", label: "Número", icon: "#" },
      { type: "rating", label: "Avaliação", icon: "★" },
      { type: "date", label: "Data", icon: "▦" },
    ],
  },
  {
    group: "Contato",
    items: [
      { type: "email", label: "E-mail", icon: "@" },
      { type: "phone", label: "Telefone", icon: "☏" },
    ],
  },
  {
    group: "Exibição",
    items: [
      { type: "header", label: "Título", icon: "¶" },
      { type: "image", label: "Imagem", icon: "▣" },
      { type: "video", label: "Vídeo", icon: "▷" },
    ],
  },
];
const TYPE_LABEL = Object.fromEntries(BASICO.flatMap((g) => g.items).map((i) => [i.type, i.label])) as Record<FieldType, string>;
const ALL_TYPES = BASICO.flatMap((g) => g.items);

function newField(type: FieldType): Field {
  const base = { type, required: false, placeholder: "", mediaUrl: "", options: [] as string[] };
  switch (type) {
    case "radio":
      return { ...base, label: "Escolha uma opção", options: ["Opção 1", "Opção 2"] };
    case "checkbox":
      return { ...base, label: "Escolha uma ou mais opções", options: ["Opção 1", "Opção 2"] };
    case "select":
      return { ...base, label: "Escolha uma opção no menu", options: ["Opção 1", "Opção 2"] };
    case "number":
      return { ...base, label: "Digite um número", placeholder: "0" };
    case "rating":
      return { ...base, label: "Avalie sua experiência" };
    case "date":
      return { ...base, label: "Escolha uma data" };
    case "email":
      return { ...base, label: "Digite seu e-mail" };
    case "phone":
      return { ...base, label: "Digite seu telefone" };
    case "header":
      return { ...base, label: "Adicione o título aqui" };
    case "image":
      return { ...base, label: "" };
    case "video":
      return { ...base, label: "" };
    default:
      return { ...base, label: "Digite uma pergunta" };
  }
}

export function FormBuilder({ id, code, initialConfig }: { id: string; code: string; initialConfig: FormConfig }) {
  const [config, setConfig] = useState<FormConfig>(initialConfig);
  const [status, setStatus] = useState<Status>("saved");
  const [showSettings, setShowSettings] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setStatus("dirty");
    const t = setTimeout(async () => {
      setStatus("saving");
      const r = await saveFormConfig(id, config);
      setStatus(r.ok ? "saved" : "error");
    }, 1000);
    return () => clearTimeout(t);
  }, [config, id]);

  const label: Record<Status, string> = { saved: "Salvo", dirty: "Não salvo", saving: "Salvando...", error: "Erro" };

  const addField = (type: FieldType) => setConfig((c) => ({ ...c, fields: [...c.fields, newField(type)] }));
  const updateField = (i: number, patch: Partial<Field>) =>
    setConfig((c) => ({ ...c, fields: c.fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)) }));
  const removeField = (i: number) => setConfig((c) => ({ ...c, fields: c.fields.filter((_, idx) => idx !== i) }));
  const duplicate = (i: number) =>
    setConfig((c) => {
      const fields = [...c.fields];
      fields.splice(i + 1, 0, { ...c.fields[i] });
      return { ...c, fields };
    });
  const move = (i: number, dir: -1 | 1) =>
    setConfig((c) => {
      const j = i + dir;
      if (j < 0 || j >= c.fields.length) return c;
      const fields = [...c.fields];
      [fields[i], fields[j]] = [fields[j], fields[i]];
      return { ...c, fields };
    });

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/formularios" className="text-sm text-stone-500 hover:text-stone-900">
            ← Formulários
          </Link>
          <span className="text-xs text-stone-400">{label[status]}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <a href={`/f/${code}`} target="_blank" rel="noreferrer" className="rounded-lg px-3 py-1.5 ring-1 ring-stone-300 hover:ring-stone-900">
            Antevisão
          </a>
          <Link href={`/dashboard/formularios/${id}/respostas`} className="rounded-lg px-3 py-1.5 ring-1 ring-stone-300 hover:ring-stone-900">
            Respostas
          </Link>
          <button type="button" onClick={() => setShowSettings((s) => !s)} className="rounded-lg px-3 py-1.5 ring-1 ring-stone-300 hover:ring-stone-900">
            Definições
          </button>
        </div>
      </div>

      {showSettings ? <Settings config={config} setConfig={setConfig} code={code} /> : null}

      <div className="grid gap-4 lg:grid-cols-[210px_minmax(0,1fr)_340px]">
        {/* Left palette */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Adicionar perguntas</p>
          <div className="flex flex-col gap-3">
            {BASICO.map((g) => (
              <div key={g.group} className="flex flex-col gap-1">
                <p className="px-1 text-[10px] font-semibold uppercase tracking-wide text-stone-400">{g.group}</p>
                {g.items.map((p) => (
                  <button
                    key={p.type}
                    type="button"
                    onClick={() => addField(p.type)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-stone-700 ring-1 ring-stone-200 transition hover:bg-stone-50 hover:ring-stone-900"
                  >
                    <span className="flex h-5 w-5 items-center justify-center text-xs text-stone-400">{p.icon}</span>
                    {p.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>

        {/* Center: field editors */}
        <main className="flex flex-col gap-3">
          {config.fields.length === 0 ? (
            <p className="rounded-xl bg-stone-50 p-6 text-center text-sm text-stone-500 ring-1 ring-stone-200">
              Clique num tipo de campo à esquerda para adicionar a primeira pergunta.
            </p>
          ) : (
            config.fields.map((f, i) => (
              <div key={i} className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-stone-400">{TYPE_LABEL[f.type] ?? f.type}</span>
                  <div className="flex items-center gap-1.5 text-stone-400">
                    <button type="button" title="Mover para cima" onClick={() => move(i, -1)} disabled={i === 0} className="px-1 hover:text-stone-900 disabled:opacity-30">
                      ↑
                    </button>
                    <button type="button" title="Mover para baixo" onClick={() => move(i, 1)} disabled={i === config.fields.length - 1} className="px-1 hover:text-stone-900 disabled:opacity-30">
                      ↓
                    </button>
                    <button type="button" title="Duplicar" onClick={() => duplicate(i)} className="px-1 hover:text-stone-900">
                      ⧉
                    </button>
                    <button type="button" title="Excluir" onClick={() => removeField(i)} className="px-1 hover:text-red-600">
                      ✕
                    </button>
                  </div>
                </div>
                <input
                  value={f.label}
                  onChange={(e) => updateField(i, { label: e.target.value })}
                  placeholder={f.type === "header" ? "Texto do título" : "Escreva a pergunta"}
                  className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm font-medium outline-none focus:border-stone-400"
                />
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <select
                    value={f.type}
                    onChange={(e) => updateField(i, { type: e.target.value as FieldType })}
                    className="rounded-md border border-stone-200 px-2 py-1.5 text-xs outline-none focus:border-stone-400"
                  >
                    {ALL_TYPES.map((p) => (
                      <option key={p.type} value={p.type}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  {f.type !== "header" && f.type !== "image" && f.type !== "video" ? (
                    <label className="flex items-center gap-1.5 text-xs text-stone-600">
                      <input type="checkbox" checked={f.required} onChange={(e) => updateField(i, { required: e.target.checked })} />
                      Obrigatório
                    </label>
                  ) : null}
                </div>
                {f.type === "radio" || f.type === "checkbox" || f.type === "select" ? (
                  <textarea
                    value={f.options.join("\n")}
                    onChange={(e) => updateField(i, { options: e.target.value.split("\n").map((o) => o.trim()).filter(Boolean).slice(0, 20) })}
                    rows={3}
                    placeholder="Uma opção por linha"
                    className="mt-2 w-full rounded-md border border-stone-200 px-3 py-2 text-xs outline-none focus:border-stone-400"
                  />
                ) : f.type === "image" ? (
                  <div className="mt-2 flex flex-col gap-2">
                    <input
                      value={f.mediaUrl}
                      onChange={(e) => updateField(i, { mediaUrl: e.target.value })}
                      placeholder="Link da imagem (https://...)"
                      className="w-full rounded-md border border-stone-200 px-3 py-2 text-xs outline-none focus:border-stone-400"
                    />
                    <UploadButton label="Enviar imagem" onUploaded={(mediaUrl) => updateField(i, { mediaUrl })} />
                  </div>
                ) : f.type === "video" ? (
                  <input
                    value={f.mediaUrl}
                    onChange={(e) => updateField(i, { mediaUrl: e.target.value })}
                    placeholder="Link do YouTube (https://youtube.com/...)"
                    className="mt-2 w-full rounded-md border border-stone-200 px-3 py-2 text-xs outline-none focus:border-stone-400"
                  />
                ) : f.type === "rating" || f.type === "header" ? null : (
                  <input
                    value={f.placeholder}
                    onChange={(e) => updateField(i, { placeholder: e.target.value })}
                    placeholder="Texto de dica (placeholder) — opcional"
                    className="mt-2 w-full rounded-md border border-stone-200 px-3 py-2 text-xs outline-none focus:border-stone-400"
                  />
                )}
              </div>
            ))
          )}

          <form
            action={deleteForm.bind(null, id)}
            onSubmit={(e) => {
              if (!window.confirm("Excluir este formulário e todas as respostas? Não dá para desfazer.")) e.preventDefault();
            }}
            className="pt-2"
          >
            <button type="submit" className="text-sm text-red-600 hover:underline">
              Excluir formulário
            </button>
          </form>
        </main>

        {/* Right: live preview */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Prévia</p>
          <Preview config={config} />
        </aside>
      </div>
    </div>
  );
}

function Settings({ config, setConfig, code }: { config: FormConfig; setConfig: (c: FormConfig) => void; code: string }) {
  const set = (patch: Partial<FormConfig>) => setConfig({ ...config, ...patch });
  const field = "w-full rounded-md border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400";
  return (
    <div className="grid gap-3 rounded-xl bg-white p-4 ring-1 ring-stone-200 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <p className="mb-1 text-xs font-medium text-stone-500">Link do formulário</p>
        <CopyLink code={code} />
      </div>
      <div className="sm:col-span-2">
        <p className="mb-1 text-xs font-medium text-stone-500">Logo / imagem do topo</p>
        <input value={config.logoUrl} onChange={(e) => set({ logoUrl: e.target.value })} placeholder="https://..." className={field} />
        <div className="mt-2">
          <UploadButton label="Enviar logo" onUploaded={(logoUrl) => set({ logoUrl })} />
        </div>
      </div>
      <label className="text-xs text-stone-500">
        Título (opcional)
        <input value={config.title} onChange={(e) => set({ title: e.target.value })} className={`${field} mt-1`} />
      </label>
      <label className="text-xs text-stone-500">
        WhatsApp que recebe
        <input value={config.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} placeholder="(11) 99999-9999" className={`${field} mt-1`} />
      </label>
      <label className="text-xs text-stone-500">
        Texto do botão
        <input value={config.buttonText} onChange={(e) => set({ buttonText: e.target.value })} className={`${field} mt-1`} />
      </label>
      <label className="text-xs text-stone-500">
        Mensagem de agradecimento
        <input value={config.thankYouMessage} onChange={(e) => set({ thankYouMessage: e.target.value })} className={`${field} mt-1`} />
      </label>
      <label className="text-xs text-stone-500 sm:col-span-2">
        Introdução (opcional)
        <textarea value={config.intro} onChange={(e) => set({ intro: e.target.value })} rows={2} className={`${field} mt-1`} />
      </label>
    </div>
  );
}

function Preview({ config }: { config: FormConfig }) {
  const logo = imageSrc(config.logoUrl);
  const input = "w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-[13px] text-stone-400";
  return (
    <div className="rounded-xl bg-[#f2f2f2] p-3">
      <div className="mx-auto w-full rounded-lg bg-white px-5 py-6 shadow-sm">
        <div className="flex flex-col gap-4">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="mx-auto mb-1 max-h-16 w-auto object-contain" />
          ) : null}
          {config.title ? <p className="text-sm font-semibold text-stone-900">{config.title}</p> : null}
          {config.fields.map((f, i) => {
            if (f.type === "header") return <p key={i} className="text-sm font-bold text-stone-900">{f.label}</p>;
            if (f.type === "image") {
              const m = imageSrc(f.mediaUrl);
              // eslint-disable-next-line @next/next/no-img-element
              return m ? <img key={i} src={m} alt="" className="w-full rounded-md" /> : <div key={i} className="flex h-20 items-center justify-center rounded-md bg-stone-100 text-[11px] text-stone-400">Imagem</div>;
            }
            if (f.type === "video")
              return <div key={i} className="flex aspect-video items-center justify-center rounded-md bg-stone-100 text-[11px] text-stone-400">Vídeo</div>;
            return (
              <div key={i} className="flex flex-col gap-1">
                <span className="text-[11px] text-stone-500">
                  {f.required ? "* " : ""}
                  {f.label}
                </span>
                {f.type === "rating" ? (
                  <div className="text-lg text-stone-300">★★★★★</div>
                ) : f.type === "radio" || f.type === "checkbox" ? (
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-stone-600">
                    {f.options.map((o, oi) => (
                      <span key={oi} className="flex items-center gap-1">
                        <span className={f.type === "radio" ? "inline-block h-2.5 w-2.5 rounded-full ring-1 ring-stone-400" : "inline-block h-2.5 w-2.5 rounded-sm ring-1 ring-stone-400"} />
                        {o}
                      </span>
                    ))}
                  </div>
                ) : f.type === "textarea" ? (
                  <div className={`${input} h-10`} />
                ) : (
                  <div className={input}>{f.placeholder || " "}</div>
                )}
              </div>
            );
          })}
          <div className="mt-1 rounded-md bg-stone-900 py-2 text-center text-xs font-semibold text-white">{config.buttonText || "Enviar"}</div>
        </div>
      </div>
    </div>
  );
}
