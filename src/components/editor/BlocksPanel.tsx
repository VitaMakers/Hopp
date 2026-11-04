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
import { BLOCK_CATALOG, blockSummary, createBlock } from "@/lib/page/catalog";
import type { Block, BlockType, PageDoc } from "@/lib/page/schema";
import { BlockFields } from "./BlockFields";
import { PageSections } from "./PageSections";

type BlockStats = { views: number; clicks: Record<string, number> };
type PanelProps = { doc: PageDoc; onChange: (doc: PageDoc) => void; focus?: { id: string; n: number } | null; stats?: BlockStats; plan?: string };

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

export function BlocksPanel({ doc, onChange, focus, stats, plan = "" }: PanelProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

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

  return (
    <div className="flex flex-col gap-3">
      <PageSections doc={doc} onChange={onChange} plan={plan} />
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
          {doc.blocks.map((block) => (
            <SortableBlock
              key={block.id}
              block={block}
              premium={doc.theme.premium}
              open={openId === block.id}
              onToggleOpen={() => setOpenId(openId === block.id ? null : block.id)}
              onChange={(next) => setBlocks(doc.blocks.map((item) => (item.id === next.id ? next : item)))}
              onRemove={() => setBlocks(doc.blocks.filter((item) => item.id !== block.id))}
              stats={stats}
            />
          ))}
        </SortableContext>
      </DndContext>
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
  stats,
}: {
  block: Block;
  premium: PageDoc["theme"]["premium"];
  open: boolean;
  onToggleOpen: () => void;
  onChange: (block: Block) => void;
  onRemove: () => void;
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
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Arrastar para reordenar"
          className="cursor-grab touch-none px-1 text-stone-400 active:cursor-grabbing"
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
      </div>
      {open ? (
        <div className="border-t border-stone-100 p-4">
          <BlockFields block={block} premium={premium} onChange={onChange} />
          <button type="button" onClick={onRemove} className="mt-4 text-sm text-red-600">
            Excluir bloco
          </button>
        </div>
      ) : null}
    </div>
  );
}
