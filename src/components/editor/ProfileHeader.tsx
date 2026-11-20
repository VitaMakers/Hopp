"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { canUseVerified } from "@/lib/entitlements";
import { SOCIAL_LABELS } from "@/lib/page/catalog";
import { imageSrc } from "@/lib/page/links";
import { SOCIAL_PLATFORMS, type PageDoc, type SocialPlatform } from "@/lib/page/schema";
import { TextArea, TextField, Toggle } from "./fields";
import { UploadButton, useImageUpload } from "./UploadButton";
import { applyPatch, type DocChange, type Patch } from "./types";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

// The editable header card at the top of the Página view: shows the profile
// summary and, on "Editar", opens every field in place (photo, bio, socials,
// cover, logo) so the whole header is 100% editable without leaving the card.
export function ProfileHeader({ doc, onChange, plan }: { doc: PageDoc; onChange: DocChange; plan: string }) {
  const [editing, setEditing] = useState<false | "perfil" | "capa">(false);
  const [showLinks, setShowLinks] = useState(false);
  const { profile, socials } = doc;
  const avatar = imageSrc(profile.avatarUrl);
  // Premium designs draw their own cover: only the cover photo applies there.
  const isPremium = !!doc.theme.premium;
  // Always applied to the latest profile (see DocChange).
  const setProfile = (patch: Patch<PageDoc["profile"]>) => onChange((d) => ({ ...d, profile: applyPatch(d.profile, patch) }));
  const avatarUpload = useImageUpload((avatarUrl) => setProfile({ avatarUrl }));
  const used = new Set(socials.map((s) => s.platform));
  const available = SOCIAL_PLATFORMS.filter((p) => !used.has(p));

  // Opening from the "Capa" card lands on the cover fields.
  useEffect(() => {
    if (editing !== "capa") return;
    const timer = window.setTimeout(() => document.getElementById("perfil-capa")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    return () => window.clearTimeout(timer);
  }, [editing]);

  const cover = imageSrc(profile.coverUrl) || imageSrc(profile.coverImages?.find((item) => item.url)?.url ?? "");
  const coverLabel = isPremium
    ? "Foto do topo do modelo"
    : profile.coverType === "video"
      ? "Vídeo"
      : profile.coverType === "carousel"
        ? "Fotos que trocam sozinhas"
        : cover
          ? `Foto, formato ${profile.coverFormat === "horizontal" ? "horizontal" : profile.coverFormat === "full" ? "tela cheia" : "vertical"}`
          : "Sem capa";
  const editButton = "h-9 shrink-0 rounded-[9px] border border-[#E5E2DA] bg-white px-3.5 text-[13px] font-semibold text-stone-900 transition-colors hover:border-stone-400";
  const face = avatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatar} alt="" className="h-full w-full object-cover" />
  ) : (
    <span className="flex h-full w-full items-center justify-center bg-stone-900 text-[13px] font-semibold text-white">{initials(profile.name)}</span>
  );

  if (!editing) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-[14px] border border-[#E5E2DA] bg-white p-3.5">
          <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full">{face}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold lg:hidden">Topo da página</span>
            <span className="hidden truncate text-[15px] font-semibold lg:block">{profile.name || "Seu nome"}</span>
            <span className="block truncate text-[13px] text-stone-600 lg:hidden">Foto, nome, bio, capa e redes</span>
            <span className="hidden truncate text-[13px] text-stone-600 lg:block">Foto, nome, bio e redes</span>
          </span>
          <button type="button" onClick={() => setEditing("perfil")} className={editButton}>
            Editar
          </button>
        </div>
        <div className="hidden items-center gap-3 rounded-[14px] border border-[#E5E2DA] bg-white p-3.5 lg:flex">
          <span className="h-11 w-11 shrink-0 overflow-hidden rounded-[9px] bg-[#F3F2EE]">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className="h-full w-full object-cover" />
            ) : null}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold">Capa</span>
            <span className="block truncate text-[13px] text-stone-600">{coverLabel}</span>
          </span>
          <button type="button" onClick={() => setEditing("capa")} className={editButton}>
            Editar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-[14px] border border-stone-900 bg-white p-3.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={avatarUpload.open}
          disabled={avatarUpload.busy}
          aria-label="Enviar foto ou logo"
          title="Clique para enviar a foto ou o logo"
          className="h-11 w-11 shrink-0 overflow-hidden rounded-full transition-opacity hover:opacity-80"
        >
          {face}
        </button>
        <input ref={avatarUpload.inputRef} type="file" accept="image/*" className="sr-only" onChange={avatarUpload.handle} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold">{profile.name || "Seu nome"}</span>
          <span className="block truncate text-[13px] text-stone-600">{avatarUpload.error ?? (avatarUpload.busy ? "Enviando a foto..." : "Foto, nome, bio, capa e redes")}</span>
        </span>
        <button type="button" onClick={() => setEditing(false)} className="h-9 shrink-0 rounded-[9px] bg-stone-900 px-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-stone-800">
          Concluir
        </button>
      </div>

        <div className="mt-4 flex flex-col gap-4 border-t border-stone-100 pt-4">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-stone-500">Perfil</p>
            <TextField label="Nome" value={profile.name} maxLength={80} onChange={(name) => setProfile({ name })} />
            <Toggle label="Mostrar o nome na página" checked={!profile.hideName} onChange={(on) => setProfile({ hideName: !on })} />
            <TextArea label="Bio" value={profile.bio} maxLength={300} onChange={(bio) => setProfile({ bio })} />
            <TextField label="Foto (envie do seu dispositivo ou cole um link)" type="url" value={profile.avatarUrl} placeholder="https://..." onChange={(avatarUrl) => setProfile({ avatarUrl })} />
            <UploadButton label="Enviar foto" onUploaded={(avatarUrl) => setProfile({ avatarUrl })} />
            <Toggle label="Mostrar a foto na página" checked={!profile.hideAvatar} onChange={(on) => setProfile({ hideAvatar: !on })} />
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
                Selo verificado: disponível no{" "}
                <Link href="/dashboard/plans" className="font-semibold text-stone-700 underline">
                  plano Profissional
                </Link>
                .
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-stone-100 pt-4">
            <p className="text-xs font-semibold text-stone-500">Redes sociais</p>
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

          <div id="perfil-capa" className="flex scroll-mt-4 flex-col gap-3 border-t border-stone-100 pt-4">
            <p className="text-xs font-semibold text-stone-500">Capa</p>
            <p className="-mt-1 text-xs text-stone-500">
              {isPremium
                ? "Neste modelo, a foto de capa entra no topo. O enquadramento e as fotos que trocam sozinhas ficam em Partes do modelo, logo abaixo."
                : "A capa aparece nos layouts com foto (escolha em Personalizar → Layout, mais abaixo)."}
            </p>
            {isPremium ? null : (
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
            )}

            {isPremium ? null : (
            <div className="flex flex-col gap-2 rounded-lg bg-stone-50 p-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-stone-700">Formato:</span>
                {([["horizontal", "Horizontal"], ["vertical", "Vertical"], ["full", "Tela cheia"]] as const).map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setProfile({ coverFormat: v })}
                    className={`rounded-lg px-3 py-1 text-sm ring-1 ${profile.coverFormat === v ? "bg-stone-900 text-white ring-stone-900" : "text-stone-600 ring-stone-300"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <p className="-mt-1 text-xs text-stone-500">O formato vale igual no celular e no computador. Arraste a imagem (abaixo) para escolher a parte que aparece.</p>
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
            )}

            {isPremium || profile.coverType === "image" ? (
              <>
                <TextField label="Imagem da capa (link ou envie)" type="url" value={profile.coverUrl} placeholder="https://..." onChange={(coverUrl) => setProfile({ coverUrl })} />
                <UploadButton label="Enviar capa" onUploaded={(coverUrl) => setProfile({ coverUrl })} />
                {!isPremium && imageSrc(profile.coverUrl) ? (
                  <CoverPositioner url={profile.coverUrl} format={profile.coverFormat} x={profile.coverPosX} y={profile.coverPosY} onChange={(x, y) => setProfile({ coverPosX: x, coverPosY: y })} />
                ) : null}
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
                {profile.coverImages.map((img, i) => (
                  <div key={i} className="flex flex-col gap-2 rounded-lg bg-stone-50 p-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-stone-500">Imagem {i + 1}</span>
                      <div className="ml-auto flex items-center gap-2">
                        <UploadButton label={img.url ? "Trocar" : "Enviar"} onUploaded={(v) => setProfile((p) => ({ coverImages: p.coverImages.map((it, j) => (j === i ? { ...it, url: v } : it)) }))} />
                        <button type="button" onClick={() => setProfile({ coverImages: profile.coverImages.filter((_, j) => j !== i) })} className="shrink-0 text-xs text-red-500">
                          Remover
                        </button>
                      </div>
                    </div>
                    {imageSrc(img.url) ? (
                      <CoverPositioner url={img.url} format={profile.coverFormat} x={img.x} y={img.y} onChange={(x, y) => setProfile({ coverImages: profile.coverImages.map((it, j) => (j === i ? { ...it, x, y } : it)) })} />
                    ) : null}
                    {showLinks ? (
                      <TextField label="" type="url" value={img.url} placeholder="https://..." onChange={(v) => setProfile({ coverImages: profile.coverImages.map((it, j) => (j === i ? { ...it, url: v } : it)) })} />
                    ) : null}
                  </div>
                ))}
                {profile.coverImages.length < 8 ? (
                  <button type="button" onClick={() => setProfile({ coverImages: [...profile.coverImages, { url: "", x: 50, y: 50 }] })} className="self-start rounded-lg border border-dashed border-stone-300 px-3 py-1.5 text-sm text-stone-600">
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
    </div>
  );
}

// A compact 3×3 picker for the focal point of a cover image (object-position).
// The middle dot centres it; corners/edges pull the framing that way.
const POS_ASPECT: Record<string, string> = { horizontal: "16 / 9", vertical: "4 / 5", full: "2 / 3" };

// Shows the cover at the chosen format and lets the owner DRAG the image to
// choose which part shows (sets object-position). No buttons — just drag.
function CoverPositioner({ url, format, x, y, onChange }: { url: string; format: string; x: number; y: number; onChange: (x: number, y: number) => void }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const src = imageSrc(url);
  if (!src) return null;
  const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
  const down = (e: React.PointerEvent) => {
    drag.current = { px: e.clientX, py: e.clientY, x, y };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* capture not supported — move events still fire while inside the box */
    }
  };
  const move = (e: React.PointerEvent) => {
    if (!drag.current || !boxRef.current) return;
    const r = boxRef.current.getBoundingClientRect();
    const dx = ((e.clientX - drag.current.px) / r.width) * 100;
    const dy = ((e.clientY - drag.current.py) / r.height) * 100;
    // Drag the image down → reveal its top → object-position Y decreases.
    onChange(clamp(drag.current.x - dx), clamp(drag.current.y - dy));
  };
  const up = () => {
    drag.current = null;
  };
  return (
    <div
      ref={boxRef}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      className="relative w-full max-w-[280px] cursor-grab touch-none select-none overflow-hidden rounded-xl ring-1 ring-stone-300 active:cursor-grabbing"
      style={{ aspectRatio: POS_ASPECT[format] ?? "4 / 5" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full object-cover" style={{ objectPosition: `${x}% ${y}%` }} />
      <span className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 rounded bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white">
        arraste para posicionar
      </span>
    </div>
  );
}
