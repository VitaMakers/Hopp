"use client";

import Link from "next/link";
import { useState } from "react";
import { canUseVerified } from "@/lib/entitlements";
import { SOCIAL_LABELS } from "@/lib/page/catalog";
import { imageSrc } from "@/lib/page/links";
import { SOCIAL_PLATFORMS, type PageDoc, type SocialPlatform } from "@/lib/page/schema";
import { SocialIcon } from "@/components/page-view/SocialIcon";
import { TextArea, TextField, Toggle } from "./fields";
import { UploadButton } from "./UploadButton";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

// The editable header card at the top of the Página view: shows the profile
// summary and, on "Editar", opens every field in place (photo, bio, socials,
// cover, logo) so the whole header is 100% editable without leaving the card.
export function ProfileHeader({ doc, onChange, plan }: { doc: PageDoc; onChange: (doc: PageDoc) => void; plan: string }) {
  const [editing, setEditing] = useState(false);
  const { profile, socials } = doc;
  const avatar = imageSrc(profile.avatarUrl);
  const setProfile = (patch: Partial<PageDoc["profile"]>) => onChange({ ...doc, profile: { ...doc.profile, ...patch } });
  const used = new Set(socials.map((s) => s.platform));
  const available = SOCIAL_PLATFORMS.filter((p) => !used.has(p));

  return (
    <div className="w-full rounded-2xl bg-white p-4 ring-1 ring-stone-200">
      <div className="flex items-start gap-3">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-stone-900 text-lg font-semibold text-white">
            {initials(profile.name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-stone-900">{profile.name || "Seu nome"}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-stone-500">
            {profile.bio || "Escreva uma bio curta sobre você ou seu negócio."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 transition ${editing ? "bg-stone-900 text-white ring-stone-900" : "text-stone-600 ring-stone-200 hover:text-blue-600 hover:ring-blue-300"}`}
        >
          {editing ? "Concluir" : "Editar"}
        </button>
      </div>

      {!editing ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {socials.map((social, index) => (
            <span key={index} className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-700">
              <SocialIcon platform={social.platform} className="h-[18px] w-[18px]" />
            </span>
          ))}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex h-9 items-center gap-1 rounded-full border border-dashed border-stone-300 px-3 text-xs font-medium text-stone-500 hover:border-stone-400"
          >
            {socials.length ? "+ rede social" : "+ Adicionar redes sociais"}
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4 border-t border-stone-100 pt-4">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Perfil</p>
            <TextField label="Nome" value={profile.name} maxLength={80} onChange={(name) => setProfile({ name })} />
            <TextArea label="Bio" value={profile.bio} maxLength={300} onChange={(bio) => setProfile({ bio })} />
            <TextField label="Foto (envie do seu dispositivo ou cole um link)" type="url" value={profile.avatarUrl} placeholder="https://..." onChange={(avatarUrl) => setProfile({ avatarUrl })} />
            <UploadButton label="Enviar foto" onUploaded={(avatarUrl) => setProfile({ avatarUrl })} />
            <TextField
              label="WhatsApp flutuante (número com DDD, opcional)"
              type="tel"
              value={profile.floatingWhatsapp}
              maxLength={30}
              placeholder="(11) 99999-9999"
              onChange={(floatingWhatsapp) => setProfile({ floatingWhatsapp })}
            />
            {canUseVerified(plan) ? (
              <Toggle label="Mostrar selo de verificado" checked={profile.verified} onChange={(verified) => setProfile({ verified })} />
            ) : (
              <p className="flex items-center gap-1.5 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500 ring-1 ring-stone-200">
                🔒 Selo de verificado — disponível no{" "}
                <Link href="/dashboard/plans" className="font-semibold text-stone-700 underline">
                  plano Profissional
                </Link>
                .
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-stone-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Redes sociais</p>
            {socials.map((social, index) => (
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

          <div className="flex flex-col gap-3 border-t border-stone-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Capa</p>
            <TextField label="Capa (envie do seu dispositivo ou cole um link)" type="url" value={profile.coverUrl} placeholder="https://..." onChange={(coverUrl) => setProfile({ coverUrl })} />
            <UploadButton label="Enviar capa" onUploaded={(coverUrl) => setProfile({ coverUrl })} />
            <TextField
              label="Capa em vídeo (link .mp4, opcional — toca no lugar da imagem)"
              type="url"
              value={profile.coverVideo}
              placeholder="https://... .mp4"
              onChange={(coverVideo) => setProfile({ coverVideo })}
            />
            <TextField label="Logo (opcional — aparece em alguns layouts)" type="url" value={profile.logo} placeholder="https://..." onChange={(logo) => setProfile({ logo })} />
            <UploadButton label="Enviar logo" onUploaded={(logo) => setProfile({ logo })} />
          </div>

          <button type="button" onClick={() => setEditing(false)} className="self-start rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white">
            Concluir
          </button>
        </div>
      )}
    </div>
  );
}
