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
const ALL_TYPES = BASICO.flatMap((g) => g.items);
const TYPE_LABEL = Object.fromEntries(ALL_TYPES.map((i) => [i.type, i.label])) as Record<FieldType, string>;
const isChoice = (t: FieldType) => t === "radio" || t === "checkbox" || t === "select";

function newField(type: FieldType): Field {
  const base = { type, required: false, placeholder: "", mediaUrl: "", description: "", allowOther: false, datePickerMode: "date" as const, options: [] as string[] };
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
    case "video":
      return { ...base, label: "" };
    default:
      return { ...base, label: "Digite uma pergunta" };
  }
}

export function FormBuilder({ id, code, initialConfig }: { id: string; code: string; initialConfig: FormConfig }) {
  const [config, setConfig] = useState<FormConfig>(initialConfig);
  const [status, setStatus] = useState<Status>("saved");
  const [selected, setSelected] = useState<number | null>(null);
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

  function addField(type: FieldType) {
    setConfig((c) => ({ ...c, fields: [...c.fields, newField(type)] }));
    setSelected(config.fields.length);
  }
  const updateField = (i: number, patch: Partial<Field>) =>
    setConfig((c) => ({ ...c, fields: c.fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)) }));
  function removeField(i: number) {
    setConfig((c) => ({ ...c, fields: c.fields.filter((_, idx) => idx !== i) }));
    setSelected(null);
  }
  function duplicate(i: number) {
    setConfig((c) => {
      const fields = [...c.fields];
      fields.splice(i + 1, 0, { ...c.fields[i] });
      return { ...c, fields };
    });
    setSelected(i + 1);
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= config.fields.length) return;
    setConfig((c) => {
      const fields = [...c.fields];
      [fields[i], fields[j]] = [fields[j], fields[i]];
      return { ...c, fields };
    });
    setSelected(j);
  }

  const sel = selected != null ? config.fields[selected] : null;

  return (
    <div className="flex flex-col gap-4">
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
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[210px_minmax(0,1fr)_320px]">
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

        {/* Center canvas */}
        <main>
          <div className="rounded-xl bg-[#f2f2f2] p-4">
            <div className="mx-auto w-full max-w-md rounded-lg bg-white px-5 py-7 shadow-sm">
              <div className="flex flex-col gap-4">
                <FormHeaderPreview config={config} />
                {config.fields.length === 0 ? (
                  <p className="py-8 text-center text-sm text-stone-400">Clique num tipo de campo à esquerda para começar.</p>
                ) : (
                  config.fields.map((f, i) => (
                    <div
                      key={i}
                      onClick={() => setSelected(i)}
                      className={`relative cursor-pointer rounded-lg p-2 ring-2 transition ${selected === i ? "ring-emerald-500" : "ring-transparent hover:ring-stone-200"}`}
                    >
                      {selected === i ? (
                        <div className="absolute right-1 top-1 z-10 flex items-center gap-0.5 rounded-md bg-white px-1 shadow ring-1 ring-stone-200">
                          <IconBtn title="Subir" onClick={(e) => { e.stopPropagation(); move(i, -1); }} disabled={i === 0}>↑</IconBtn>
                          <IconBtn title="Descer" onClick={(e) => { e.stopPropagation(); move(i, 1); }} disabled={i === config.fields.length - 1}>↓</IconBtn>
                          <IconBtn title="Duplicar" onClick={(e) => { e.stopPropagation(); duplicate(i); }}>⧉</IconBtn>
                          <IconBtn title="Excluir" onClick={(e) => { e.stopPropagation(); removeField(i); }} danger>✕</IconBtn>
                        </div>
                      ) : null}
                      <FieldPreview field={f} />
                    </div>
                  ))
                )}
                <div className="mt-1 rounded-md bg-[#25D366] py-2 text-center text-xs font-semibold text-white">{config.buttonText || "Enviar"}</div>
              </div>
            </div>
          </div>
          <form
            action={deleteForm.bind(null, id)}
            onSubmit={(e) => {
              if (!window.confirm("Excluir este formulário e todas as respostas? Não dá para desfazer.")) e.preventDefault();
            }}
            className="pt-3"
          >
            <button type="submit" className="text-sm text-red-600 hover:underline">
              Excluir formulário
            </button>
          </form>
        </main>

        {/* Right editor / settings */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          {sel && selected != null ? (
            <FieldEditor field={sel} onChange={(patch) => updateField(selected, patch)} onClose={() => setSelected(null)} />
          ) : (
            <FormSettings config={config} setConfig={setConfig} code={code} />
          )}
        </aside>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, disabled, danger, title }: { children: React.ReactNode; onClick: (e: React.MouseEvent) => void; disabled?: boolean; danger?: boolean; title?: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`px-1.5 py-0.5 text-xs ${danger ? "text-stone-400 hover:text-red-600" : "text-stone-400 hover:text-stone-900"} disabled:opacity-30`}
    >
      {children}
    </button>
  );
}

function FormHeaderPreview({ config }: { config: FormConfig }) {
  const logo = imageSrc(config.logoUrl);
  return (
    <>
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="mx-auto mb-1 max-h-16 w-auto object-contain" />
      ) : null}
      {config.title ? <p className="text-sm font-semibold text-stone-900">{config.title}</p> : null}
      {config.intro ? <p className="text-xs text-stone-500">{config.intro}</p> : null}
    </>
  );
}

function FieldPreview({ field: f }: { field: Field }) {
  const input = "w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-[13px] text-stone-400";
  if (f.type === "header") return <p className="text-sm font-bold text-stone-900">{f.label || "Título"}</p>;
  if (f.type === "image") {
    const m = imageSrc(f.mediaUrl);
    // eslint-disable-next-line @next/next/no-img-element
    return m ? <img src={m} alt="" className="w-full rounded-md" /> : <div className="flex h-20 items-center justify-center rounded-md bg-stone-100 text-[11px] text-stone-400">Imagem</div>;
  }
  if (f.type === "video") return <div className="flex aspect-video items-center justify-center rounded-md bg-stone-100 text-[11px] text-stone-400">Vídeo</div>;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px] text-stone-500">
        {f.required ? <span className="text-red-500">* </span> : null}
        {f.label}
      </span>
      {f.description ? <span className="text-[11px] text-stone-400">{f.description}</span> : null}
      {f.type === "rating" ? (
        <div className="text-lg text-stone-300">★★★★★</div>
      ) : f.type === "radio" || f.type === "checkbox" ? (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-stone-600">
          {[...f.options, ...(f.allowOther ? ["Outro"] : [])].map((o, oi) => (
            <span key={oi} className="flex items-center gap-1">
              <span className={f.type === "radio" ? "inline-block h-2.5 w-2.5 rounded-full ring-1 ring-stone-400" : "inline-block h-2.5 w-2.5 rounded-sm ring-1 ring-stone-400"} />
              {o}
            </span>
          ))}
        </div>
      ) : f.type === "textarea" ? (
        <div className={`${input} h-10`} />
      ) : f.type === "date" ? (
        <div className="flex gap-2">
          <div className={`${input} flex-1`}>Selecionar data</div>
          {f.datePickerMode === "datetime" ? <div className={`${input} flex-1`}>Hora</div> : null}
        </div>
      ) : (
        <div className={input}>{f.placeholder || " "}</div>
      )}
    </div>
  );
}

function FieldEditor({ field: f, onChange, onClose }: { field: Field; onChange: (patch: Partial<Field>) => void; onClose: () => void }) {
  const input = "w-full rounded-md border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400";
  const setOption = (i: number, v: string) => onChange({ options: f.options.map((o, idx) => (idx === i ? v : o)) });
  const addOption = () => onChange({ options: [...f.options, `Opção ${f.options.length + 1}`] });
  const removeOption = (i: number) => onChange({ options: f.options.filter((_, idx) => idx !== i) });

  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold">Editar {TYPE_LABEL[f.type] ?? f.type}</p>
        <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-900">
          ✕
        </button>
      </div>

      <label className="block text-xs text-stone-500">
        {f.type === "header" ? "Texto do título" : "Título"}
        <input value={f.label} onChange={(e) => onChange({ label: e.target.value })} className={`${input} mt-1`} />
      </label>

      {f.type !== "header" && f.type !== "image" && f.type !== "video" ? (
        <label className="mt-3 block text-xs text-stone-500">
          Legenda (opcional)
          <textarea value={f.description} onChange={(e) => onChange({ description: e.target.value })} rows={2} placeholder="Adicione um texto de descrição aqui" className={`${input} mt-1`} />
        </label>
      ) : null}

      {f.type === "image" ? (
        <div className="mt-3 flex flex-col gap-2">
          <input value={f.mediaUrl} onChange={(e) => onChange({ mediaUrl: e.target.value })} placeholder="Link da imagem (https://...)" className={input} />
          <UploadButton label="Enviar imagem" onUploaded={(mediaUrl) => onChange({ mediaUrl })} />
        </div>
      ) : null}
      {f.type === "video" ? (
        <label className="mt-3 block text-xs text-stone-500">
          Link do vídeo (YouTube)
          <input value={f.mediaUrl} onChange={(e) => onChange({ mediaUrl: e.target.value })} placeholder="https://youtube.com/watch?v=..." className={`${input} mt-1`} />
        </label>
      ) : null}

      {!isChoice(f.type) && !["header", "image", "video", "rating", "date"].includes(f.type) ? (
        <label className="mt-3 block text-xs text-stone-500">
          Espaço reservado (placeholder)
          <input value={f.placeholder} onChange={(e) => onChange({ placeholder: e.target.value })} className={`${input} mt-1`} />
        </label>
      ) : null}

      {f.type === "date" ? (
        <label className="mt-3 block text-xs text-stone-500">
          Formato
          <select value={f.datePickerMode} onChange={(e) => onChange({ datePickerMode: e.target.value as "date" | "datetime" })} className={`${input} mt-1`}>
            <option value="date">Só data</option>
            <option value="datetime">Data e hora</option>
          </select>
        </label>
      ) : null}

      {isChoice(f.type) ? (
        <div className="mt-3">
          <p className="mb-1 text-xs text-stone-500">Opções</p>
          <div className="flex flex-col gap-1.5">
            {f.options.map((o, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <input value={o} onChange={(e) => setOption(i, e.target.value)} className={`${input} flex-1`} />
                <button type="button" onClick={() => removeOption(i)} className="px-1.5 text-stone-400 hover:text-red-600">
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addOption} className="mt-2 text-sm text-stone-600 hover:underline">
            + Adicionar
          </button>
          {f.type === "radio" || f.type === "checkbox" ? (
            <label className="mt-3 flex items-center justify-between text-xs text-stone-600">
              Adicionar opção &apos;Outra&apos;
              <input type="checkbox" checked={f.allowOther} onChange={(e) => onChange({ allowOther: e.target.checked })} />
            </label>
          ) : null}
        </div>
      ) : null}

      {f.type !== "header" && f.type !== "image" && f.type !== "video" ? (
        <label className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-sm text-stone-700">
          Obrigatório
          <input type="checkbox" checked={f.required} onChange={(e) => onChange({ required: e.target.checked })} />
        </label>
      ) : null}
    </div>
  );
}

function FormSettings({ config, setConfig, code }: { config: FormConfig; setConfig: (c: FormConfig) => void; code: string }) {
  const set = (patch: Partial<FormConfig>) => setConfig({ ...config, ...patch });
  const field = "w-full rounded-md border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400";
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-stone-200">
      <p className="font-semibold">Definições do formulário</p>
      <p className="text-[11px] text-stone-400">Clique num campo no centro para editá-lo.</p>
      <div>
        <p className="mb-1 text-xs font-medium text-stone-500">Link</p>
        <CopyLink code={code} />
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-stone-500">Logo do topo</p>
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
      <label className="text-xs text-stone-500">
        Introdução (opcional)
        <textarea value={config.intro} onChange={(e) => set({ intro: e.target.value })} rows={2} className={`${field} mt-1`} />
      </label>
    </div>
  );
}
