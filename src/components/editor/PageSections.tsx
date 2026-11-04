"use client";

import Link from "next/link";
import { useState } from "react";
import { canUseVerified } from "@/lib/entitlements";
import { SOCIAL_LABELS } from "@/lib/page/catalog";
import { SOCIAL_PLATFORMS, type PageDoc, type SocialPlatform } from "@/lib/page/schema";
import { TextArea, TextField, Toggle } from "./fields";
import { UploadButton } from "./UploadButton";

// The "Página" view header: the profile/header and the cover, each as a
// collapsible card above the blocks — mirroring Hopp's "Cabeçalho" / "Seção de
// Capa" sections. Edits the same profile/socials as before.
function CollapseCard({
  title,
  summary,
  defaultOpen,
  children,
}: {
  title: string;
  summary: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className={`rounded-xl bg-white ring-1 transition ${open ? "ring-2 ring-blue-500" : "ring-stone-200"}`}>
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 p-3 text-left">
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{title}</span>
          <span className="block truncate text-xs text-stone-500">{summary}</span>
        </span>
        <span className="text-stone-400">{open ? "▾" : "▸"}</span>
      </button>
      {open ? <div className="flex flex-col gap-3 border-t border-stone-100 p-4">{children}</div> : null}
    </div>
  );
}

export function PageSections({ doc, onChange, plan }: { doc: PageDoc; onChange: (doc: PageDoc) => void; plan: string }) {
  const setProfile = (patch: Partial<PageDoc["profile"]>) => onChange({ ...doc, profile: { ...doc.profile, ...patch } });
  const used = new Set(doc.socials.map((s) => s.platform));
  const available = SOCIAL_PLATFORMS.filter((p) => !used.has(p));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Cabeçalho e capa</p>

      <CollapseCard title="Cabeçalho e perfil" summary="Nome, bio, foto e redes sociais" defaultOpen>
        <TextField label="Nome" value={doc.profile.name} maxLength={80} onChange={(name) => setProfile({ name })} />
        <TextArea label="Bio" value={doc.profile.bio} maxLength={300} onChange={(bio) => setProfile({ bio })} />
        <TextField label="Foto (envie do seu dispositivo ou cole um link)" type="url" value={doc.profile.avatarUrl} placeholder="https://..." onChange={(avatarUrl) => setProfile({ avatarUrl })} />
        <UploadButton label="Enviar foto" onUploaded={(avatarUrl) => setProfile({ avatarUrl })} />
        <TextField
          label="WhatsApp flutuante (número com DDD, opcional)"
          type="tel"
          value={doc.profile.floatingWhatsapp}
          maxLength={30}
          placeholder="(11) 99999-9999"
          onChange={(floatingWhatsapp) => setProfile({ floatingWhatsapp })}
        />
        {canUseVerified(plan) ? (
          <Toggle label="Mostrar selo de verificado" checked={doc.profile.verified} onChange={(verified) => setProfile({ verified })} />
        ) : (
          <p className="flex items-center gap-1.5 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500 ring-1 ring-stone-200">
            🔒 Selo de verificado — disponível no{" "}
            <Link href="/dashboard/plans" className="font-semibold text-stone-700 underline">
              plano Profissional
            </Link>
            .
          </p>
        )}

        <div className="mt-1 border-t border-stone-100 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Redes sociais</p>
          <div className="flex flex-col gap-2">
            {doc.socials.map((social, index) => (
              <div key={social.platform} className="flex items-end gap-2">
                <div className="flex-1">
                  <TextField
                    label={SOCIAL_LABELS[social.platform]}
                    value={social.url}
                    placeholder={social.platform === "email" ? "voce@exemplo.com" : social.platform === "whatsapp" ? "+55 11 99999-9999" : "https://..."}
                    onChange={(url) => onChange({ ...doc, socials: doc.socials.map((s, i) => (i === index ? { ...s, url } : s)) })}
                  />
                </div>
                <button type="button" onClick={() => onChange({ ...doc, socials: doc.socials.filter((_, i) => i !== index) })} className="pb-2.5 text-sm text-red-600">
                  Remover
                </button>
              </div>
            ))}
            {available.length > 0 ? (
              <select
                value=""
                onChange={(event) => {
                  const platform = event.target.value as SocialPlatform;
                  if (platform) onChange({ ...doc, socials: [...doc.socials, { platform, url: "" }] });
                }}
                className="field self-start"
              >
                <option value="">+ Adicionar rede</option>
                {available.map((platform) => (
                  <option key={platform} value={platform}>
                    {SOCIAL_LABELS[platform]}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        </div>
      </CollapseCard>

      <CollapseCard title="Capa" summary="Imagem ou vídeo de capa e logo">
        <TextField label="Capa (envie do seu dispositivo ou cole um link)" type="url" value={doc.profile.coverUrl} placeholder="https://..." onChange={(coverUrl) => setProfile({ coverUrl })} />
        <UploadButton label="Enviar capa" onUploaded={(coverUrl) => setProfile({ coverUrl })} />
        <TextField
          label="Capa em vídeo (link .mp4, opcional — toca no lugar da imagem)"
          type="url"
          value={doc.profile.coverVideo}
          placeholder="https://... .mp4"
          onChange={(coverVideo) => setProfile({ coverVideo })}
        />
        {doc.profile.coverVideo ? (
          <p className="-mt-2 text-xs text-stone-500">
            O vídeo toca sozinho, sem som e em loop. A imagem de capa acima é usada como pôster enquanto ele carrega. Para voltar à foto, apague este link.
          </p>
        ) : null}
        <TextField label="Logo (opcional — aparece em alguns layouts)" type="url" value={doc.profile.logo} placeholder="https://..." onChange={(logo) => setProfile({ logo })} />
        <UploadButton label="Enviar logo" onUploaded={(logo) => setProfile({ logo })} />
      </CollapseCard>

      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-stone-400">Blocos</p>
    </div>
  );
}
