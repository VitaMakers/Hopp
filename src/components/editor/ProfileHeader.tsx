"use client";

import Link from "next/link";
import { useState } from "react";
import { canUseVerified } from "@/lib/entitlements";
import { SOCIAL_LABELS } from "@/lib/page/catalog";
import { imageSrc } from "@/lib/page/links";
import { SOCIAL_PLATFORMS, type PageDoc, type SocialPlatform } from "@/lib/page/schema";
import { SocialIcon } from "@/components/page-view/SocialIcon";
import { TextArea, TextField, Toggle } from "./fields";
import { UploadButton, useImageUpload } from "./UploadButton";

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
  const [showLinks, setShowLinks] = useState(false);
  const { profile, socials } = doc;
  const avatar = imageSrc(profile.avatarUrl);
  const setProfile = (patch: Partial<PageDoc["profile"]>) => onChange({ ...doc, profile: { ...doc.profile, ...patch } });
  const avatarUpload = useImageUpload((avatarUrl) => setProfile({ avatarUrl }));
  const used = new Set(socials.map((s) => s.platform));
  const available = SOCIAL_PLATFORMS.filter((p) => !used.has(p));

  return (
    <div className="w-full rounded-2xl bg-white p-4 ring-1 ring-stone-200">
      <div className="flex items-start gap-3">
        <div className="flex shrink-0 flex-col items-center gap-1">
          <button
            type="button"
            onClick={avatarUpload.open}
            disabled={avatarUpload.busy}
            aria-label="Enviar foto ou logo"
            title="Clique para enviar a foto/logo"
            className="group relative h-16 w-16 overflow-hidden rounded-full ring-1 ring-stone-200"
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-stone-900 text-lg font-semibold text-white">
                {initials(profile.name)}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
              {avatarUpload.busy ? "..." : "📷 Trocar"}
            </span>
          </button>
          <label className="flex items-center gap-1 text-[11px] text-stone-500" title="Mostrar a foto/logo na página">
            <input type="checkbox" checked={!profile.hideAvatar} onChange={(e) => setProfile({ hideAvatar: !e.target.checked })} />
            Mostrar
          </label>
          <input ref={avatarUpload.inputRef} type="file" accept="image/*" className="sr-only" onChange={avatarUpload.handle} />
          {avatarUpload.error ? <p className="max-w-[88px] text-center text-[10px] leading-tight text-red-600">{avatarUpload.error}</p> : null}
        </div>
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
            <p className="-mt-1 text-xs text-stone-500">A capa aparece nos layouts com foto (escolha em Aparência → Layout).</p>
            <div className="flex gap-2">
              {([["image", "Imagem"], ["carousel", "Carrossel"], ["video", "Vídeo"]] as const).map(([val, lbl]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setProfile({ coverType: val })}
                  className={`rounded-lg px-3 py-1.5 text-sm ring-1 ${profile.coverType === val ? "bg-stone-900 text-white ring-stone-900" : "text-stone-600 ring-stone-300"}`}
                >
                  {lbl}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 rounded-lg bg-stone-50 p-2.5">
              <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
                Tamanho da capa
                <input type="range" min={120} max={520} step={10} value={profile.coverHeight} onChange={(e) => setProfile({ coverHeight: Number(e.target.value) })} />
                <span className="text-xs text-stone-500">{profile.coverHeight}px</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-stone-700">Bordas:</span>
                {([["true", "Arredondadas"], ["false", "Retas"]] as const).map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setProfile({ coverRounded: v === "true" })}
                    className={`rounded-lg px-3 py-1 text-sm ring-1 ${String(profile.coverRounded) === v ? "bg-stone-900 text-white ring-stone-900" : "text-stone-600 ring-stone-300"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <Toggle label="Sombra para disfarçar a borda (funde com o fundo)" checked={profile.coverShade} onChange={(coverShade) => setProfile({ coverShade })} />
            </div>

            {profile.coverType === "image" ? (
              <>
                <TextField label="Imagem da capa (link ou envie)" type="url" value={profile.coverUrl} placeholder="https://..." onChange={(coverUrl) => setProfile({ coverUrl })} />
                <UploadButton label="Enviar capa" onUploaded={(coverUrl) => setProfile({ coverUrl })} />
                <p className="-mt-1 text-xs text-stone-500">Tamanho recomendado: 1080 × 1350 px (retrato).</p>
              </>
            ) : profile.coverType === "carousel" ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-stone-500">Passam sozinhas. Recomendado: 1080 × 1350 px.</p>
                  <label className="flex shrink-0 items-center gap-1 text-xs text-stone-500">
                    <input type="checkbox" checked={showLinks} onChange={(e) => setShowLinks(e.target.checked)} />
                    mostrar links
                  </label>
                </div>
                {profile.coverImages.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-stone-50 p-2">
                    {imageSrc(url) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageSrc(url) as string} alt="" className="h-11 w-11 shrink-0 rounded object-cover" />
                    ) : (
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-stone-200 text-xs font-semibold text-stone-500">{i + 1}</span>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      {showLinks ? (
                        <TextField label="" type="url" value={url} placeholder="https://..." onChange={(v) => setProfile({ coverImages: profile.coverImages.map((x, j) => (j === i ? v : x)) })} />
                      ) : null}
                      <UploadButton label={url ? "Trocar imagem" : "Enviar imagem"} onUploaded={(v) => setProfile({ coverImages: profile.coverImages.map((x, j) => (j === i ? v : x)) })} />
                    </div>
                    <button type="button" onClick={() => setProfile({ coverImages: profile.coverImages.filter((_, j) => j !== i) })} className="shrink-0 text-xs text-red-500">
                      Remover
                    </button>
                  </div>
                ))}
                {profile.coverImages.length < 8 ? (
                  <button type="button" onClick={() => setProfile({ coverImages: [...profile.coverImages, ""] })} className="self-start rounded-lg border border-dashed border-stone-300 px-3 py-1.5 text-sm text-stone-600">
                    + Adicionar imagem
                  </button>
                ) : null}
                <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
                  Tempo de cada imagem (segundos)
                  <input type="number" min={1} max={30} value={profile.coverSeconds} onChange={(e) => setProfile({ coverSeconds: Math.min(30, Math.max(1, Number(e.target.value) || 4)) })} className="field w-24" />
                </label>
              </>
            ) : (
              <>
                <p className="text-xs text-stone-500">Vídeos que tocam sem som, em loop. Com 2+, vão trocando. Cole o link .mp4.</p>
                {profile.coverVideos.map((url, i) => (
                  <div key={i} className="flex items-end gap-2 rounded-lg bg-stone-50 p-2.5">
                    <div className="flex-1">
                      <TextField label={`Vídeo ${i + 1} (.mp4)`} type="url" value={url} placeholder="https://... .mp4" onChange={(v) => setProfile({ coverVideos: profile.coverVideos.map((x, j) => (j === i ? v : x)) })} />
                    </div>
                    <button type="button" onClick={() => setProfile({ coverVideos: profile.coverVideos.filter((_, j) => j !== i) })} className="pb-2.5 text-xs text-red-500">
                      Remover
                    </button>
                  </div>
                ))}
                {profile.coverVideos.length < 8 ? (
                  <button type="button" onClick={() => setProfile({ coverVideos: [...profile.coverVideos, ""] })} className="self-start rounded-lg border border-dashed border-stone-300 px-3 py-1.5 text-sm text-stone-600">
                    + Adicionar vídeo
                  </button>
                ) : null}
                <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
                  Tempo de cada vídeo (segundos)
                  <input type="number" min={1} max={30} value={profile.coverSeconds} onChange={(e) => setProfile({ coverSeconds: Math.min(30, Math.max(1, Number(e.target.value) || 4)) })} className="field w-24" />
                </label>
              </>
            )}

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
