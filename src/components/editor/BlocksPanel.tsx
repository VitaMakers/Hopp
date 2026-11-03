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
import type { Block, BlockType, PageDoc, Theme } from "@/lib/page/schema";
import { BlockFields } from "./BlockFields";
import { getPremiumSections, PremiumSectionBody, premiumSectionSummary } from "./PremiumSections";

type PanelProps = { doc: PageDoc; onChange: (doc: PageDoc) => void; focus?: { id: string; n: number } | null };

export function BlocksPanel({ doc, onChange, focus }: PanelProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const premium = doc.theme.premium;
  const sections = premium ? getPremiumSections(premium as Exclude<Theme["premium"], "">) : [];

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
      {premium ? (
        <div className="flex flex-col gap-3">
          {/* Scroll target used when a premium area is clicked in the preview. */}
          <div id="blk-premium:__group" className="scroll-mt-24" />
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Partes do modelo</p>
            <button
              type="button"
              onClick={() => onChange({ ...doc, theme: { ...doc.theme, premium: "" } })}
              className="text-xs text-stone-500 underline"
            >
              Sair do modelo
            </button>
          </div>
          {sections.map((section) => (
            <PremiumSectionCard
              key={section.id}
              id={section.id}
              label={section.label}
              summary={premiumSectionSummary(section.id, doc)}
              open={openId === section.id}
              onToggleOpen={() => setOpenId(openId === section.id ? null : section.id)}
              doc={doc}
              onChange={onChange}
            />
          ))}
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-stone-400">Produtos e links</p>
        </div>
      ) : null}
      <button type="button" onClick={() => setAdding(!adding)} className="btn-primary self-start">
        + Adicionar bloco
      </button>
      {adding ? (
        <div className="grid gap-2 rounded-xl bg-white p-3 ring-1 ring-stone-200 sm:grid-cols-2">
          {(Object.keys(BLOCK_CATALOG) as BlockType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => add(type)}
              className="rounded-lg p-3 text-left hover:bg-stone-100"
            >
              <span className="block font-medium">{BLOCK_CATALOG[type].label}</span>
              <span className="block text-xs text-stone-500">{BLOCK_CATALOG[type].description}</span>
            </button>
          ))}
        </div>
      ) : null}

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
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

function PremiumSectionCard({
  id,
  label,
  summary,
  open,
  onToggleOpen,
  doc,
  onChange,
}: {
  id: string;
  label: string;
  summary: string;
  open: boolean;
  onToggleOpen: () => void;
  doc: PageDoc;
  onChange: (doc: PageDoc) => void;
}) {
  return (
    <div
      id={`blk-${id}`}
      className={`scroll-mt-24 rounded-xl bg-white ring-1 transition ${open ? "ring-2 ring-blue-500" : "ring-stone-200"}`}
    >
      <button type="button" onClick={onToggleOpen} className="flex w-full items-center gap-2 p-3 text-left">
        <span className="min-w-0 flex-1">
          <span className="block text-xs uppercase tracking-wide text-stone-400">Parte do modelo</span>
          <span className="block truncate font-medium">{label}</span>
          {summary ? <span className="block truncate text-xs text-stone-500">{summary}</span> : null}
        </span>
        <span className="text-stone-400">{open ? "▾" : "▸"}</span>
      </button>
      {open ? (
        <div className="border-t border-stone-100 p-4">
          <PremiumSectionBody id={id} doc={doc} onChange={onChange} />
        </div>
      ) : null}
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
}: {
  block: Block;
  premium: PageDoc["theme"]["premium"];
  open: boolean;
  onToggleOpen: () => void;
  onChange: (block: Block) => void;
  onRemove: () => void;
}) {
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
