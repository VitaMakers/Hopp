"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { nanoid } from "nanoid";
import { canUseForms } from "@/lib/entitlements";
import { BLOCK_CATALOG, blockSummary, createBlock } from "@/lib/page/catalog";
import type { Block, BlockType, PageDoc } from "@/lib/page/schema";
import { BlockFields } from "./BlockFields";
import { ProfileHeader } from "./ProfileHeader";
import { BlockIcon } from "./BlockIcon";
import { PremiumColorsCard, PremiumSectionsEditor } from "./PremiumSections";
import type { BlockChange, DocChange } from "./types";

type BlockStats = { views: number; clicks: Record<string, number> };
type PanelProps = {
  doc: PageDoc;
  onChange: DocChange;
  focus?: { id: string; n: number } | null;
  stats?: BlockStats;
  plan?: string;
  onActive?: (id: string | null) => void;
};

// Block picker, grouped like a store.
const BLOCK_CATEGORIES: { id: string; label: string; types: BlockType[] }[] = [
  { id: "links", label: "Links", types: ["link"] },
  { id: "midia", label: "Mídia", types: ["image", "gallery", "videos", "youtube", "spotify"] },
  { id: "conteudo", label: "Conteúdo", types: ["heading", "text", "stats", "faq", "countdown"] },
  { id: "contato", label: "Contato e formulários", types: ["whatsapp", "form", "subscribe", "contact", "map"] },
  { id: "loja", label: "Loja e agenda", types: ["product", "schedule"] },
];
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const fmtN = (n: number) => new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export function BlocksPanel({ doc, onChange, focus, stats, plan = "", onActive }: PanelProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  // Where the picker was opened from: the top button adds at the top, the
  // bottom one ("Adicionar outro bloco") adds at the end, next to where you are.
  const [adding, setAdding] = useState<false | "top" | "end">(false);

  // Tell the editor which block is open, so the preview highlights it in green.
  useEffect(() => {
    onActive?.(openId);
    return () => onActive?.(null);
  }, [openId, onActive]);

  // When a block is clicked in the preview, open it here and scroll to it.
  useEffect(() => {
    if (!focus) return;
    setOpenId(focus.id);
    const timer = window.setTimeout(() => {
      document.getElementById(`blk-${focus.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [focus]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const setBlocks = (blocks: Block[]) => onChange({ ...doc, blocks });

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = doc.blocks.findIndex((block) => block.id === active.id);
    const to = doc.blocks.findIndex((block) => block.id === over.id);
    setBlocks(arrayMove(doc.blocks, from, to));
  }

  function add(type: BlockType) {
    const block = createBlock(type);
    setBlocks(adding === "end" ? [...doc.blocks, block] : [block, ...doc.blocks]);
    setOpenId(block.id);
    setAdding(false);
  }

  // Duplicate a block right below the original (a copy with a fresh id), then
  // open it — the fastest way to make a second button/card like one you have.
  function duplicate(id: string) {
    const i = doc.blocks.findIndex((b) => b.id === id);
    if (i < 0) return;
    const copy = { ...doc.blocks[i], id: nanoid(10) } as Block;
    const next = [...doc.blocks];
    next.splice(i + 1, 0, copy);
    setBlocks(next);
    setOpenId(copy.id);
  }

  // Remove a block, asking first so a tap never deletes content by accident.
  function remove(id: string) {
    if (typeof window !== "undefined" && !window.confirm("Excluir este bloco?")) return;
    setBlocks(doc.blocks.filter((item) => item.id !== id));
  }

  if (adding) {
    return <BlockPicker plan={plan} onPick={add} onClose={() => setAdding(false)} />;
  }

  return (
    <div className="flex flex-col gap-3.5">
      <h2 className="hidden font-display text-[24px] font-bold tracking-[-0.02em] lg:block">Conteúdo</h2>
      <ProfileHeader doc={doc} onChange={onChange} plan={plan} />

      {doc.theme.premium ? <PremiumColorsCard doc={doc} onChange={onChange} plan={plan} /> : null}

      {doc.theme.premium ? <PremiumSectionsEditor doc={doc} onChange={onChange} focus={focus} onActive={onActive} plan={plan} /> : null}

      <div className="mt-2 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">Blocos</h2>
        <button
          type="button"
          onClick={() => setAdding("top")}
          className="inline-flex h-[34px] items-center gap-1.5 rounded-[9px] bg-stone-900 px-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-stone-800"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>
            Adicionar<span className="hidden lg:inline"> bloco</span>
          </span>
        </button>
      </div>

      {doc.blocks.length === 0 ? (
        <button
          type="button"
          onClick={() => setAdding("top")}
          className="rounded-xl border border-dashed border-[#D9D6CE] p-6 text-center text-sm text-stone-600 transition-colors hover:border-stone-400"
        >
          Sua página ainda não tem blocos. Comece por um link, o WhatsApp ou o mapa.
        </button>
      ) : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={doc.blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {doc.blocks.map((block) => (
              <SortableBlock
                key={block.id}
                block={block}
                premium={doc.theme.premium}
                open={openId === block.id}
                onToggleOpen={() => setOpenId(openId === block.id ? null : block.id)}
                onChange={(next) =>
                  // Applied to the latest blocks, so an upload finishing late
                  // doesn't undo edits made meanwhile.
                  onChange((d) => ({
                    ...d,
                    blocks: d.blocks.map((item) => (item.id === block.id ? (typeof next === "function" ? next(item) : next) : item)),
                  }))
                }
                onRemove={() => remove(block.id)}
                onDuplicate={() => duplicate(block.id)}
                stats={stats}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {doc.blocks.length > 0 ? (
        <p className="text-xs text-stone-600">Arraste pelos pontinhos para mudar a ordem. A chave esconde o bloco sem apagar.</p>
      ) : null}
    </div>
  );
}

function BlockPicker({ plan, onPick, onClose }: { plan: string; onPick: (type: BlockType) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");
  const q = norm(query.trim());
  const formsAllowed = canUseForms(plan);

  const match = (type: BlockType) =>
    !q || norm(BLOCK_CATALOG[type].label).includes(q) || norm(BLOCK_CATALOG[type].description).includes(q);
  const groups = BLOCK_CATEGORIES.map((group) => ({
    ...group,
    types: group.types.filter((type) => (cat === "all" || cat === group.id) && match(type)),
  })).filter((group) => group.types.length > 0);

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Voltar para os blocos"
          className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-[#E5E2DA] text-stone-700 transition-colors hover:border-stone-400"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">Adicionar bloco</h2>
      </div>
      <label className="flex h-[42px] items-center gap-2 rounded-[10px] border border-[#D9D6CE] px-3 text-stone-600 focus-within:border-stone-900">
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span className="sr-only">Buscar bloco</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busque: galeria, WhatsApp, agenda…"
          className="min-w-0 flex-1 bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-500"
          autoFocus
        />
      </label>
      <div className="flex flex-wrap gap-1.5">
        {[{ id: "all", label: "Todos" }, ...BLOCK_CATEGORIES].map((group) => (
          <button
            key={group.id}
            type="button"
            aria-pressed={cat === group.id}
            onClick={() => setCat(group.id)}
            className={`h-[30px] rounded-full border px-3 text-[13px] font-medium transition-colors ${
              cat === group.id ? "border-stone-900 bg-stone-900 text-white" : "border-[#E5E2DA] bg-white text-stone-700 hover:border-stone-400"
            }`}
          >
            {group.label}
          </button>
        ))}
      </div>
      {groups.length === 0 ? (
        <p className="py-10 text-center text-sm text-stone-600">Nenhum bloco com esse nome. Tente outra palavra.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <div key={group.id}>
              <h3 className="mb-1 text-[13px] font-semibold text-stone-600">{group.label}</h3>
              <ul>
                {group.types.map((type) => {
                  const locked = type === "form" && !formsAllowed;
                  return (
                    <li key={type}>
                      <button
                        type="button"
                        disabled={locked}
                        onClick={() => onPick(type)}
                        className="flex w-full items-center gap-3 border-b border-[#EFEDE7] px-1.5 py-2.5 text-left transition-colors hover:bg-[#F6F5F1] disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] ${locked ? "bg-[#F3F2EE] text-stone-500" : "bg-[#EDEDF8] text-stone-900"}`}>
                          <BlockIcon type={type} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 text-sm font-semibold">
                            {BLOCK_CATALOG[type].label}
                            {locked ? (
                              <span className="rounded-full border border-[#D9D6EE] px-1.5 text-[11px] font-semibold text-stone-700">Profissional</span>
                            ) : null}
                          </span>
                          <span className="block text-[13px] text-stone-600">
                            {locked ? "Formulários próprios são do plano Profissional." : BLOCK_CATALOG[type].description}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SortableBlock({
  block,
  premium,
  open,
  onToggleOpen,
  onChange,
  onRemove,
  onDuplicate,
  stats,
}: {
  block: Block;
  premium: PageDoc["theme"]["premium"];
  open: boolean;
  onToggleOpen: () => void;
  onChange: BlockChange;
  onRemove: () => void;
  onDuplicate: () => void;
  stats?: BlockStats;
}) {
  const blockClicks = stats?.clicks[block.id] ?? 0;
  const [menu, setMenu] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });
  return (
    <div
      ref={setNodeRef}
      id={`blk-${block.id}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`scroll-mt-24 rounded-[13px] border bg-white transition-colors ${open ? "border-stone-900" : "border-[#E5E2DA]"} ${
        block.enabled ? "" : "bg-[#FAF9F6]"
      } ${isDragging ? "z-10 shadow-[0_12px_32px_-8px_rgba(25,26,61,0.3)]" : ""}`}
    >
      <div className="flex items-center gap-2.5 py-3 pl-3 pr-3 lg:pl-2 lg:pr-1.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Segure e arraste para mudar a ordem"
          title="Segure e arraste para mudar a ordem"
          className="cursor-grab touch-none rounded-md p-1 text-[#B9B6C9] hover:text-stone-600 active:cursor-grabbing"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
            <circle cx="9" cy="6" r="1.6" />
            <circle cx="15" cy="6" r="1.6" />
            <circle cx="9" cy="12" r="1.6" />
            <circle cx="15" cy="12" r="1.6" />
            <circle cx="9" cy="18" r="1.6" />
            <circle cx="15" cy="18" r="1.6" />
          </svg>
        </button>
        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-[#F3F2EE] text-stone-700">
          <BlockIcon type={block.type} />
        </span>
        <button type="button" onClick={onToggleOpen} aria-expanded={open} className="min-w-0 flex-1 text-left">
          <span className={`block truncate text-sm font-semibold ${block.enabled ? "text-stone-900" : "text-stone-600"}`}>{blockSummary(block)}</span>
          <span className="block truncate text-xs text-stone-600">
            {!block.enabled
              ? "Escondido da página"
              : stats
                ? `${fmtN(blockClicks)} ${blockClicks === 1 ? "clique" : "cliques"}`
                : BLOCK_CATALOG[block.type].label}
            {block.enabled && stats ? <span className="hidden lg:inline"> em 30 dias</span> : null}
          </span>
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={block.enabled}
          aria-label="Mostrar na página"
          onClick={() => onChange({ ...block, enabled: !block.enabled })}
          className={`flex h-[22px] w-[38px] shrink-0 items-center rounded-full p-0.5 transition-colors ${block.enabled ? "justify-end bg-stone-900" : "justify-start bg-[#D9D6CE]"}`}
        >
          <span className="h-[18px] w-[18px] rounded-full bg-white" />
        </button>
        <div className="relative hidden lg:block">
          <button
            type="button"
            onClick={() => setMenu((v) => !v)}
            aria-label="Mais opções do bloco"
            aria-expanded={menu}
            className="flex h-8 w-7 items-center justify-center rounded-md text-stone-600 transition-colors hover:bg-[#F3F2EE] hover:text-stone-900"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
              <circle cx="12" cy="5" r="1.7" />
              <circle cx="12" cy="12" r="1.7" />
              <circle cx="12" cy="19" r="1.7" />
            </svg>
          </button>
          {menu ? (
            <>
              <button type="button" aria-label="Fechar" className="fixed inset-0 z-30 cursor-default" onClick={() => setMenu(false)} />
              <div className="absolute right-0 top-full z-40 mt-1 w-40 overflow-hidden rounded-[10px] border border-[#E5E2DA] bg-white py-1 shadow-[0_12px_32px_-8px_rgba(25,26,61,0.25)]">
                {(
                  [
                    ["Editar", onToggleOpen, "text-stone-900"],
                    ["Duplicar", onDuplicate, "text-stone-900"],
                    ["Excluir", onRemove, "text-red-700"],
                  ] as const
                ).map(([label, run, tone]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setMenu(false);
                      run();
                    }}
                    className={`block w-full px-3 py-2 text-left text-sm font-medium hover:bg-[#F3F2EE] ${tone}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
      {open ? (
        <div className="border-t border-[#EFEDE7] p-4">
          <BlockFields block={block} premium={premium} onChange={onChange} />
          <div className="mt-4 flex items-center gap-4 border-t border-[#EFEDE7] pt-3">
            <button type="button" onClick={onDuplicate} className="text-sm font-semibold text-stone-700 hover:text-stone-900">
              Duplicar
            </button>
            <button type="button" onClick={onRemove} className="text-sm font-semibold text-red-700 hover:text-red-800">
              Excluir
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
