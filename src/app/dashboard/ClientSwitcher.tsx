"use client";

import Link from "next/link";
import { useState } from "react";
import type { Client } from "./context";
import { selectClient } from "./clientes/actions";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function ClientSwitcher({ clients, currentId }: { clients: Client[]; currentId: string }) {
  const [open, setOpen] = useState(false);
  const current = clients.find((c) => c.id === currentId) ?? clients[0];
  // With a single client there is nothing to switch; keep the header clean.
  if (clients.length <= 1) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm font-medium hover:border-stone-400"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-[10px] font-semibold text-white">
          {initials(current.display_name || current.handle)}
        </span>
        <span className="max-w-[9rem] truncate">{current.display_name || current.handle}</span>
        <span className="text-stone-400">▾</span>
      </button>

      {open ? (
        <>
          <button type="button" aria-label="Fechar" className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-40 mt-1 w-64 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
            <p className="px-3 pt-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Clientes</p>
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
                      {selected ? <span className="text-stone-900">✓</span> : null}
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
