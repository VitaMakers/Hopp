"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { createShortLink, type LinkFormState } from "../actions";

const SOURCES = ["Instagram", "TikTok", "Facebook", "YouTube", "WhatsApp", "Google", "E-mail", "Outro"];

function slug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

// Builds a clean short link that hides the utm parameters behind a /l/ code, so
// the owner shares a tidy URL instead of a long one with ?utm_source=...
export function CampaignLinkForm({ base, handle }: { base: string; handle: string }) {
  const bioUrl = `${base}/${handle}`;
  const [state, action, pending] = useActionState<LinkFormState, FormData>(createShortLink, {});
  const [source, setSource] = useState("Instagram");
  const [campaign, setCampaign] = useState("");
  const [dest, setDest] = useState(bioUrl);
  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Auto-suggest the code from the campaign name until the user edits it.
  const autoCode = useMemo(() => slug(campaign) || slug(source), [campaign, source]);
  const finalCode = codeTouched ? code : autoCode;

  const target = useMemo(() => {
    const s = source === "Outro" ? "outro" : source.toLowerCase();
    const params = new URLSearchParams({ utm_source: s, utm_medium: "social" });
    if (campaign.trim()) params.set("utm_campaign", slug(campaign));
    return `${dest}${dest.includes("?") ? "&" : "?"}${params.toString()}`;
  }, [source, campaign, dest]);

  useEffect(() => {
    if (state.ok) {
      setCampaign("");
      setCode("");
      setCodeTouched(false);
    }
  }, [state]);

  const cleanLink = `${base.replace(/^https?:\/\//, "")}/l/${finalCode || "..."}`;

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4 rounded-xl bg-white p-4 ring-1 ring-stone-200">
      <div>
        <h2 className="font-semibold">Criar link de campanha</h2>
        <p className="text-sm text-stone-500">Gere um link limpo para anúncios e posts. Dá para saber de onde veio cada visita, sem URL feia.</p>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-stone-700">De onde você vai divulgar?</p>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSource(s)}
              className={`rounded-lg px-3 py-1.5 text-sm ring-1 ${source === s ? "bg-blue-600 text-white ring-blue-600" : "ring-stone-300 hover:ring-stone-400"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
          Nome da campanha
          <input value={campaign} onChange={(e) => setCampaign(e.target.value)} maxLength={60} placeholder="promo-black-friday" className="field" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
          Destino (para onde leva)
          <input value={dest} onChange={(e) => setDest(e.target.value)} type="url" className="field" />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
        Código do link curto
        <div className="flex items-center rounded-lg ring-1 ring-stone-300">
          <span className="pl-3 text-xs text-stone-500">{base.replace(/^https?:\/\//, "")}/l/</span>
          <input
            value={finalCode}
            onChange={(e) => {
              setCodeTouched(true);
              setCode(e.target.value);
            }}
            required
            maxLength={40}
            className="w-full bg-transparent px-1 py-2.5 outline-none"
          />
        </div>
      </label>

      {/* What createShortLink reads. */}
      <input type="hidden" name="code" value={finalCode} />
      <input type="hidden" name="title" value={campaign ? `${campaign} (${source})` : source} />
      <input type="hidden" name="target" value={target} />

      <div className="rounded-lg bg-stone-50 p-3 text-sm ring-1 ring-stone-100">
        <p className="font-medium text-stone-800">
          Link para compartilhar: <span className="text-blue-600">{cleanLink}</span>
        </p>
        <p className="mt-1 break-all text-xs text-stone-500">Por trás, leva para: {target}</p>
      </div>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-emerald-700">Link de campanha criado! Veja na lista abaixo.</p> : null}

      <button type="submit" disabled={pending || !campaign.trim()} className="btn-primary self-start">
        {pending ? "Criando..." : "Criar link de campanha"}
      </button>
    </form>
  );
}
