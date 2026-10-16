"use client";

import { SOCIAL_LABELS } from "@/lib/page/catalog";
import { SOCIAL_PLATFORMS, type PageDoc, type SocialPlatform } from "@/lib/page/schema";
import { Card, TextArea, TextField, Toggle } from "./fields";

type PanelProps = { doc: PageDoc; onChange: (doc: PageDoc) => void };

export function ProfilePanel({ doc, onChange }: PanelProps) {
  const setProfile = (patch: Partial<PageDoc["profile"]>) =>
    onChange({ ...doc, profile: { ...doc.profile, ...patch } });
  const used = new Set(doc.socials.map((social) => social.platform));
  const available = SOCIAL_PLATFORMS.filter((platform) => !used.has(platform));

  return (
    <div className="flex flex-col gap-4">
      <Card title="Perfil">
        <TextField label="Nome" value={doc.profile.name} maxLength={80} onChange={(name) => setProfile({ name })} />
        <Toggle label="Mostrar selo de verificado" checked={doc.profile.verified} onChange={(verified) => setProfile({ verified })} />
        <TextArea label="Bio" value={doc.profile.bio} maxLength={300} onChange={(bio) => setProfile({ bio })} />
        <TextField
          label="Foto (link da imagem)"
          type="url"
          value={doc.profile.avatarUrl}
          placeholder="https://..."
          onChange={(avatarUrl) => setProfile({ avatarUrl })}
        />
        <TextField
          label="Capa (link da imagem, usada no layout Com capa)"
          type="url"
          value={doc.profile.coverUrl}
          placeholder="https://..."
          onChange={(coverUrl) => setProfile({ coverUrl })}
        />
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
