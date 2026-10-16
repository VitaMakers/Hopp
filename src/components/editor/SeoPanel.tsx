"use client";

import type { PageDoc } from "@/lib/page/schema";
import { Card, TextArea, TextField } from "./fields";

export function SeoPanel({
  doc,
  onChange,
  handle,
}: {
  doc: PageDoc;
  onChange: (doc: PageDoc) => void;
  handle: string;
}) {
  const setSeo = (patch: Partial<PageDoc["seo"]>) => onChange({ ...doc, seo: { ...doc.seo, ...patch } });
  return (
    <Card title="Google e redes sociais">
      <p className="text-sm text-stone-600">
        Como a página <strong>/{handle}</strong> aparece no Google e quando alguém compartilha o link. Em branco,
        usamos o seu nome e a bio.
      </p>
      <TextField label="Título" value={doc.seo.title} maxLength={70} placeholder={doc.profile.name} onChange={(title) => setSeo({ title })} />
      <TextArea
        label="Descrição"
        value={doc.seo.description}
        maxLength={160}
        placeholder={doc.profile.bio}
        onChange={(description) => setSeo({ description })}
      />
    </Card>
  );
}
