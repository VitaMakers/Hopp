"use client";

import Link from "next/link";
import { canHideBrand } from "@/lib/entitlements";
import { APP_NAME } from "@/lib/env";
import type { PageDoc } from "@/lib/page/schema";
import { Card } from "./fields";
import type { DocChange } from "./types";

// The Virtú.bio buttons around the published page. Every page shows them;
// Profissional can switch them off here.
export function BrandPanel({ doc, onChange, plan }: { doc: PageDoc; onChange: DocChange; plan: string }) {
  const allowed = canHideBrand(plan);
  const shown = !(allowed && doc.hideBrand);
  return (
    <Card title={`Marca ${APP_NAME} na página`}>
      <p className="text-sm text-stone-600">
        O logo e o botão de compartilhar no topo, e o convite “Crie seu link” no rodapé da página publicada.
      </p>
      <label className={`flex items-center justify-between gap-4 rounded-[10px] border border-[#E5E2DA] px-4 py-3 ${allowed ? "cursor-pointer" : "opacity-60"}`}>
        <span className="text-sm font-medium text-stone-800">Mostrar a marca {APP_NAME}</span>
        <span className="relative inline-flex shrink-0">
          <input
            type="checkbox"
            role="switch"
            className="peer sr-only"
            checked={shown}
            disabled={!allowed}
            onChange={(e) => onChange((d) => ({ ...d, hideBrand: !e.target.checked }))}
          />
          <span className="h-6 w-11 rounded-full bg-stone-300 transition-colors peer-checked:bg-stone-900 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-600 peer-focus-visible:ring-offset-2" />
          <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
        </span>
      </label>
      {allowed ? (
        <p className="text-xs text-stone-600">Vale depois de publicar.</p>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-[#F3F2EE] px-4 py-3">
          <p className="text-sm text-stone-700">Tirar a marca é do plano Profissional.</p>
          <Link href="/dashboard/plans" className="inline-flex h-9 items-center rounded-[9px] bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
            Ver o Profissional
          </Link>
        </div>
      )}
    </Card>
  );
}
