"use client";

import Link from "next/link";
import { canUseVerified } from "@/lib/entitlements";
import { SOCIAL_LABELS } from "@/lib/page/catalog";
import { SOCIAL_PLATFORMS, type PageDoc, type SocialPlatform } from "@/lib/page/schema";
import { Card, TextArea, TextField, Toggle } from "./fields";

type PanelProps = { doc: PageDoc; onChange: (doc: PageDoc) => void; plan: string };

export function ProfilePanel({ doc, onChange, plan }: PanelProps) {
  const setProfile = (patch: Partial<PageDoc["profile"]>) =>
    onChange({ ...doc, profile: { ...doc.profile, ...patch } });
  const used = new Set(doc.socials.map((social) => social.platform));
  const available = SOCIAL_PLATFORMS.filter((platform) => !used.has(platform));

  return (
    <div className="flex flex-col gap-4">
      <Card title="Perfil">
        <TextField label="Nome" value={doc.profile.name} maxLength={80} onChange={(name) => setProfile({ name })} />
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
        <TextField
          label="WhatsApp flutuante (número com DDD, opcional)"
          type="tel"
          value={doc.profile.floatingWhatsapp}
          maxLength={30}
          placeholder="(11) 99999-9999"
          onChange={(floatingWhatsapp) => setProfile({ floatingWhatsapp })}
        />
        <TextArea label="Bio" value={doc.profile.bio} maxLength={300} onChange={(bio) => setProfile({ bio })} />
        <TextField
          label="Foto (link da imagem)"
          type="url"
          value={doc.profile.avatarUrl}
          placeholder="https://..."
          onChange={(avatarUrl) => setProfile({ avatarUrl })}
        />

        <TextField
          label="Capa (link da imagem, usada nos layouts Com capa, Foto grande e Capa com nome)"
          type="url"
          value={doc.profile.coverUrl}
          placeholder="https://..."
          onChange={(coverUrl) => setProfile({ coverUrl })}
        />

        <TextField
          label="Capa em vídeo (link .mp4, opcional — toca no lugar da imagem)"
          type="url"
          value={doc.profile.coverVideo}
          placeholder="https://... .mp4"
          onChange={(coverVideo) => setProfile({ coverVideo })}
        />
        {doc.profile.coverVideo ? (
          <p className="-mt-2 text-xs text-stone-500">
            O vídeo toca sozinho, sem som e em loop. A imagem de capa acima é usada como pôster enquanto ele carrega. Para voltar à
            foto, apague este link.
          </p>
        ) : null}
      </Card>

      <Card title="Redes sociais">
        {doc.socials.map((social, index) => (
          <div key={social.platform} className="flex items-end gap-2">
            <div className="flex-1">
              <TextField
                label={SOCIAL_LABELS[social.platform]}
                value={social.url}
                placeholder={social.platform === "email" ? "voce@exemplo.com" : social.platform === "whatsapp" ? "+55 11 99999-9999" : "https://..."}
                onChange={(url) =>
                  onChange({ ...doc, socials: doc.socials.map((s, i) => (i === index ? { ...s, url } : s)) })
                }
              />
            </div>
            <button
              type="button"
              onClick={() => onChange({ ...doc, socials: doc.socials.filter((_, i) => i !== index) })}
              className="pb-2.5 text-sm text-red-600"
            >
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
      </Card>
    </div>
  );
}
