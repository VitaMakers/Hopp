"use client";

import Link from "next/link";
import { useState } from "react";
import type { Client } from "./context";
import { PLAN_LABEL, normalizePlan } from "@/lib/plans";
import { selectClient } from "./clientes/actions";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function ClientSwitcher({
  clients,
  currentId,
  variant = "pill",
}: {
  clients: Client[];
  currentId: string;
  // "sidebar": full-width card at the top of the menu; "pill": compact button.
  variant?: "pill" | "sidebar";
}) {
  const [open, setOpen] = useState(false);
  const current = clients.find((c) => c.id === currentId) ?? clients[0];
  if (!current) return null;
  const sidebar = variant === "sidebar";

  return (
    <div className="relative">
      {sidebar ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center gap-2.5 rounded-xl border border-[#E5E2DA] bg-white p-2 text-left transition-colors hover:border-stone-400"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-stone-900 text-[11px] font-semibold text-white">
            {initials(current.display_name || current.handle)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{current.display_name || current.handle}</span>
            <span className="block text-xs text-stone-600">{PLAN_LABEL[normalizePlan(current.plan)]}</span>
          </span>
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-stone-500" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m7 15 5 5 5-5M7 9l5-5 5 5" />
          </svg>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex h-9 items-center gap-2 rounded-[10px] border border-[#E5E2DA] bg-white pl-1.5 pr-2.5 text-sm font-semibold transition-colors hover:border-stone-400"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-stone-900 text-[10px] font-semibold text-white">
            {initials(current.display_name || current.handle)}
          </span>
          <span className="max-w-[9rem] truncate">{current.display_name || current.handle}</span>
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-stone-500" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      )}

      {open ? (
        <>
          <button type="button" aria-label="Fechar" className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} />
          <div
            className={`absolute top-full z-40 mt-1 overflow-hidden rounded-xl border border-[#E5E2DA] bg-white shadow-[0_12px_32px_-8px_rgba(25,26,61,0.25)] ${
              sidebar ? "left-0 w-full min-w-60" : "left-0 w-64"
            }`}
          >
            <p className="px-3 pt-3 text-[11px] font-semibold text-stone-500">Clientes</p>
            <div className="max-h-72 overflow-y-auto py-1">
              {clients.map((client) => {
                const selected = client.id === current.id;
                return (
                  <form key={client.id} action={selectClient.bind(null, client.id)}>
                    <button
                      type="submit"
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-stone-50 ${selected ? "font-semibold" : ""}`}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-900 text-[10px] font-semibold text-white">
                        {initials(client.display_name || client.handle)}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{client.display_name || client.handle}</span>
                      {selected ? (
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-stone-900" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-label="Selecionado">
                          <path d="m5 12 5 5 9-10" />
                        </svg>
                      ) : null}
                    </button>
                  </form>
                );
              })}
            </div>
            <div className="border-t border-stone-100">
              <Link href="/dashboard/clientes" className="block px-3 py-2 text-sm text-stone-600 hover:bg-stone-50" onClick={() => setOpen(false)}>
                Ver todos os clientes
              </Link>
              <Link href="/dashboard/clientes/novo" className="block px-3 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50" onClick={() => setOpen(false)}>
                + Adicionar cliente
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
