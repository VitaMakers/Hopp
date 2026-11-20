"use client";

import Link from "next/link";
import { canUseIntegrations } from "@/lib/entitlements";
import type { PageDoc } from "@/lib/page/schema";
import { Card } from "./fields";
import type { DocChange } from "./types";

type Key = keyof PageDoc["integrations"];

const SERVICES: { key: Key; name: string; what: string; where: string; example: string; valid: RegExp }[] = [
  { key: "metaPixel", name: "Pixel do Meta", what: "Anuncie no Facebook e no Instagram para quem visitou a página.", where: "Gerenciador de Eventos do Meta, em Fontes de dados. É o número do pixel.", example: "1234567890123456", valid: /^\d{10,20}$/ },
  { key: "tiktokPixel", name: "Pixel do TikTok", what: "Anuncie no TikTok para quem visitou a página.", where: "TikTok Ads, em Ferramentas, Eventos. É o código do pixel.", example: "C4ABCDE1FGHIJ2KLMNOP", valid: /^[A-Z0-9]{15,30}$/ },
  { key: "googleAnalytics", name: "Google Analytics", what: "Veja as visitas nos relatórios do Google.", where: "Google Analytics, em Administrador, Fluxos de dados. Começa com G-.", example: "G-AB12CD34EF", valid: /^G-[A-Z0-9]{6,14}$/ },
  { key: "clarity", name: "Microsoft Clarity", what: "Gravação das visitas e mapa de calor, sem custo.", where: "Clarity, em Configurações, Visão geral. É a ID do projeto.", example: "abcd1234ef", valid: /^[a-z0-9]{8,14}$/ },
];

// The owner's own accounts on other services. Each field takes only the id;
// the page loads that service with it once the page is published.
export function IntegrationsPanel({ doc, onChange, plan }: { doc: PageDoc; onChange: DocChange; plan: string }) {
  const allowed = canUseIntegrations(plan);
  const set = (key: Key, raw: string) => {
    // Ids never have spaces or symbols; pasted extras are dropped.
    const value = raw.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40);
    onChange((d) => ({ ...d, integrations: { ...d.integrations, [key]: value } }));
  };

  return (
    <Card title="Integrações">
      <p className="text-sm text-stone-600">Ligue a página às suas contas de anúncios e de análise. Cole só o código de cada serviço; ele passa a valer depois de publicar.</p>
      <p className="text-[13px] text-stone-600">
        Ao conectar um pixel, você é responsável por informar os visitantes da sua página.{" "}
        <Link href="/termos" target="_blank" className="underline underline-offset-2">
          Termos de Uso
        </Link>
      </p>
      {!allowed ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-[#F3F2EE] px-4 py-3">
          <p className="text-sm text-stone-700">Disponível no plano Profissional.</p>
          <Link href="/dashboard/plans" className="inline-flex h-9 items-center rounded-[9px] bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
            Ver o Profissional
          </Link>
        </div>
      ) : null}
      <div className={`flex flex-col gap-5 ${allowed ? "" : "pointer-events-none opacity-55"}`} aria-disabled={!allowed}>
        {SERVICES.map((s) => {
          const value = doc.integrations[s.key];
          const state = !value ? "empty" : s.valid.test(value) ? "ok" : "bad";
          return (
            <div key={s.key} className="flex flex-col gap-1.5">
              <label htmlFor={`int-${s.key}`} className="flex items-baseline justify-between gap-3 text-sm font-medium text-stone-800">
                {s.name}
                {state === "ok" ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2F6B3A]">
                    <span className="h-[7px] w-[7px] rounded-full bg-[#2F9E4F]" />
                    Conectado
                  </span>
                ) : null}
              </label>
              <p className="-mt-0.5 text-[13px] text-stone-600">{s.what}</p>
              <input
                id={`int-${s.key}`}
                value={value}
                onChange={(e) => set(s.key, e.target.value)}
                placeholder={`Ex.: ${s.example}`}
                disabled={!allowed}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className={`h-11 w-full rounded-[10px] border bg-white px-3 font-mono text-[13px] text-stone-900 outline-none transition-colors placeholder:font-sans placeholder:text-stone-500 focus:border-stone-900 ${state === "bad" ? "border-red-600" : "border-[#E5E2DA]"}`}
              />
              <p className={`text-xs ${state === "bad" ? "text-red-700" : "text-stone-600"}`}>
                {state === "bad" ? `Este código não parece certo. O formato é como ${s.example}.` : `Onde achar: ${s.where}`}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
