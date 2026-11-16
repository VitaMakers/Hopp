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
import { BLOCK_CATALOG, blockSummary, createBlock } from "@/lib/page/catalog";
import type { Block, BlockType, PageDoc } from "@/lib/page/schema";
import { BlockFields } from "./BlockFields";
import { ProfileHeader } from "./ProfileHeader";
import { ThemePanel } from "./ThemePanel";

type BlockStats = { views: number; clicks: Record<string, number> };
type PanelProps = {
  doc: PageDoc;
  onChange: (doc: PageDoc) => void;
  focus?: { id: string; n: number } | null;
  stats?: BlockStats;
  plan?: string;
  onActive?: (id: string | null) => void;
};

// Block picker, grouped like a store. Each block gets a friendly glyph.
const BLOCK_ICON: Record<BlockType, string> = {
  link: "🔗",
  heading: "🔠",
  text: "📝",
  youtube: "▶️",
  spotify: "🎵",
  faq: "❓",
  countdown: "⏳",
  subscribe: "✉️",
  form: "🧾",
  whatsapp: "💬",
  image: "🖼️",
  product: "🛍️",
  map: "📍",
  contact: "👤",
  stats: "📊",
  gallery: "🏞️",
  videos: "🎬",
  schedule: "📅",
};
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
  const [adding, setAdding] = useState(false);

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
    setBlocks([block, ...doc.blocks]);
    setOpenId(block.id);
    setAdding(false);
  }

  // Move a block one position up or down. Simpler than dragging, and works on
  // touch — the main way people reorder on the phone.
  function move(id: string, dir: -1 | 1) {
    const from = doc.blocks.findIndex((b) => b.id === id);
    const to = from + dir;
    if (from < 0 || to < 0 || to >= doc.blocks.length) return;
    setBlocks(arrayMove(doc.blocks, from, to));
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

  return (
    <div className="flex flex-col gap-3">
      <ProfileHeader doc={doc} onChange={onChange} plan={plan} />
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-stone-400">Blocos</p>
      <button type="button" onClick={() => setAdding(true)} className="btn-primary self-start">
        + Adicionar bloco
      </button>
      {adding ? <BlockPicker onPick={add} onClose={() => setAdding(false)} /> : null}

      {doc.blocks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
          Sua página ainda não tem blocos.
        </p>
      ) : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={doc.blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
          {doc.blocks.map((block, index) => (
            <SortableBlock
              key={block.id}
              block={block}
              premium={doc.theme.premium}
              open={openId === block.id}
              onToggleOpen={() => setOpenId(openId === block.id ? null : block.id)}
              onChange={(next) => setBlocks(doc.blocks.map((item) => (item.id === next.id ? next : item)))}
              onRemove={() => remove(block.id)}
              onDuplicate={() => duplicate(block.id)}
              onMoveUp={() => move(block.id, -1)}
              onMoveDown={() => move(block.id, 1)}
              isFirst={index === 0}
              isLast={index === doc.blocks.length - 1}
              stats={stats}
            />
          ))}
        </SortableContext>
      </DndContext>

      {doc.blocks.length > 0 ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="self-start rounded-lg px-3 py-2 text-sm font-semibold text-stone-600 ring-1 ring-stone-300 transition hover:ring-stone-900"
        >
          + Adicionar outro bloco
        </button>
      ) : null}

      {/* Appearance (model parts + colors) lives here too — only the header is separate. */}
      <div className="mt-2">
        <ThemePanel doc={doc} onChange={onChange} focus={focus} onActive={onActive} />
      </div>
    </div>
  );
}

function BlockPicker({ onPick, onClose }: { onPick: (type: BlockType) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");
  const q = norm(query.trim());

  const match = (type: BlockType) =>
    !q || norm(BLOCK_CATALOG[type].label).includes(q) || norm(BLOCK_CATALOG[type].description).includes(q);
  const groups = BLOCK_CATEGORIES.map((group) => ({
    ...group,
    types: group.types.filter((type) => (cat === "all" || cat === group.id) && match(type)),
  })).filter((group) => group.types.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button type="button" aria-label="Fechar" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-t-2xl bg-white shadow-2xl sm:max-h-[80vh] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-stone-100 p-4">
          <h2 className="text-lg font-bold">Adicionar bloco</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700" aria-label="Fechar">
            ✕
          </button>
        </div>
        <div className="flex flex-col gap-3 border-b border-stone-100 p-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar blocos (ex.: galeria, whatsapp, agenda…)"
            className="field"
            autoFocus
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCat("all")}
              className={`rounded-full px-3 py-1 text-sm ring-1 ${cat === "all" ? "bg-stone-900 text-white ring-stone-900" : "text-stone-600 ring-stone-300"}`}
            >
              Todos
            </button>
            {BLOCK_CATEGORIES.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setCat(group.id)}
                className={`rounded-full px-3 py-1 text-sm ring-1 ${cat === group.id ? "bg-stone-900 text-white ring-stone-900" : "text-stone-600 ring-stone-300"}`}
              >
                {group.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {groups.length === 0 ? (
            <p className="py-10 text-center text-sm text-stone-500">Nenhum bloco encontrado.</p>
          ) : (
            <div className="flex flex-col gap-5">
              {groups.map((group) => (
                <div key={group.id}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">{group.label}</p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {group.types.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => onPick(type)}
                        className="flex items-start gap-3 rounded-xl p-3 text-left ring-1 ring-stone-200 transition hover:ring-blue-400"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-lg">
                          {BLOCK_ICON[type]}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium">{BLOCK_CATALOG[type].label}</span>
                          <span className="block text-xs text-stone-500">{BLOCK_CATALOG[type].description}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  stats,
}: {
  block: Block;
  premium: PageDoc["theme"]["premium"];
  open: boolean;
  onToggleOpen: () => void;
  onChange: (block: Block) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  stats?: BlockStats;
}) {
  const blockClicks = stats?.clicks[block.id] ?? 0;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });
  return (
    <div
      ref={setNodeRef}
      id={`blk-${block.id}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`scroll-mt-24 rounded-xl bg-white ring-1 transition ${open ? "ring-2 ring-blue-500" : "ring-stone-200"} ${isDragging ? "z-10 shadow-lg" : ""}`}
    >
      <div className="flex items-center gap-2 p-3">
        <div className="flex flex-col">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            aria-label="Mover para cima"
            className="px-1 text-sm leading-none text-stone-400 enabled:hover:text-stone-900 disabled:opacity-30"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            aria-label="Mover para baixo"
            className="px-1 text-sm leading-none text-stone-400 enabled:hover:text-stone-900 disabled:opacity-30"
          >
            ▼
          </button>
        </div>
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Arrastar para reordenar"
          className="hidden cursor-grab touch-none px-1 text-stone-400 active:cursor-grabbing sm:block"
        >
          ⠿
        </button>
        <button type="button" onClick={onToggleOpen} className="min-w-0 flex-1 text-left">
          <span className="block text-xs uppercase tracking-wide text-stone-400">
            {BLOCK_CATALOG[block.type].label}
          </span>
          <span className={`block truncate ${block.enabled ? "" : "text-stone-400 line-through"}`}>
            {blockSummary(block)}
          </span>
          {stats ? (
            <span className="mt-0.5 block text-xs text-stone-400">
              {fmtN(stats.views)} {stats.views === 1 ? "visualização" : "visualizações"}
              {blockClicks > 0 ? ` · ${fmtN(blockClicks)} ${blockClicks === 1 ? "clique" : "cliques"}` : ""}
            </span>
          ) : null}
        </button>
        <label className="flex items-center gap-1 text-xs text-stone-500">
          <input
            type="checkbox"
            checked={block.enabled}
            onChange={(event) => onChange({ ...block, enabled: event.target.checked })}
          />
          Visível
        </label>
        <button
          type="button"
          onClick={onDuplicate}
          aria-label="Duplicar bloco"
          title="Duplicar"
          className="rounded-md px-1.5 py-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-900"
        >
          ⧉
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Excluir bloco"
          title="Excluir"
          className="rounded-md px-1.5 py-1 text-stone-400 transition hover:bg-red-50 hover:text-red-600"
        >
          🗑
        </button>
      </div>
      {open ? (
        <div className="border-t border-stone-100 p-4">
          <BlockFields block={block} premium={premium} onChange={onChange} />
          <div className="mt-4 flex items-center gap-4">
            <button type="button" onClick={onDuplicate} className="text-sm font-medium text-stone-600 hover:text-stone-900">
              Duplicar bloco
            </button>
            <button type="button" onClick={onRemove} className="text-sm text-red-600">
              Excluir bloco
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
