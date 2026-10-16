"use client";

import type { Block } from "@/lib/page/schema";
import { TextArea, TextField, Toggle } from "./fields";

// datetime-local works in local time without seconds or zone; the document
// stores an ISO instant.
function toLocalInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function BlockFields({ block, onChange }: { block: Block; onChange: (block: Block) => void }) {
  switch (block.type) {
    case "link":
      return (
        <div className="flex flex-col gap-3">
          <TextField label="Texto do botão" value={block.title} maxLength={120} onChange={(title) => onChange({ ...block, title })} />
          <TextField label="Endereço" type="url" value={block.url} maxLength={2000} placeholder="https://..." onChange={(url) => onChange({ ...block, url })} />
          <TextField
            label="Miniatura (link da imagem, opcional)"
            type="url"
            value={block.imageUrl}
            maxLength={1000}
            placeholder="https://..."
            onChange={(imageUrl) => onChange({ ...block, imageUrl })}
          />
          <Toggle label="Destacar (o botão balança de tempos em tempos)" checked={block.highlight} onChange={(highlight) => onChange({ ...block, highlight })} />
        </div>
      );
    case "heading":
      return <TextField label="Título" value={block.text} maxLength={120} onChange={(text) => onChange({ ...block, text })} />;
    case "text":
      return <TextArea label="Texto" value={block.text} maxLength={4000} onChange={(text) => onChange({ ...block, text })} />;
    case "youtube":
      return (
        <TextField
          label="Link do vídeo"
          value={block.url}
          placeholder="https://www.youtube.com/watch?v=..."
          onChange={(url) => onChange({ ...block, url })}
        />
      );
    case "spotify":
      return (
        <TextField
          label="Link do Spotify"
          value={block.url}
          placeholder="https://open.spotify.com/..."
          onChange={(url) => onChange({ ...block, url })}
        />
      );
    case "faq":
      return (
        <div className="flex flex-col gap-3">
          <TextField label="Título" value={block.title} maxLength={120} onChange={(title) => onChange({ ...block, title })} />
          {block.items.map((item, index) => {
            const setItem = (patch: Partial<typeof item>) =>
              onChange({ ...block, items: block.items.map((it, i) => (i === index ? { ...it, ...patch } : it)) });
            return (
              <div key={index} className="flex flex-col gap-2 rounded-lg bg-stone-50 p-3">
                <TextField label={`Pergunta ${index + 1}`} value={item.question} maxLength={300} onChange={(question) => setItem({ question })} />
                <TextArea label="Resposta" value={item.answer} maxLength={2000} onChange={(answer) => setItem({ answer })} />
                <button
                  type="button"
                  onClick={() => onChange({ ...block, items: block.items.filter((_, i) => i !== index) })}
                  className="self-start text-xs text-red-600"
                >
                  Remover pergunta
                </button>
              </div>
            );
          })}
          {block.items.length < 30 ? (
            <button
              type="button"
              onClick={() => onChange({ ...block, items: [...block.items, { question: "", answer: "" }] })}
              className="self-start text-sm underline"
            >
              + Adicionar pergunta
            </button>
          ) : null}
        </div>
      );
    case "countdown":
      return (
        <div className="flex flex-col gap-3">
          <TextField label="Título" value={block.title} maxLength={120} onChange={(title) => onChange({ ...block, title })} />
          <TextField
            label="Termina em"
            type="datetime-local"
            value={toLocalInput(block.endsAt)}
            onChange={(value) => {
              const date = new Date(value);
              if (!Number.isNaN(date.getTime())) onChange({ ...block, endsAt: date.toISOString() });
            }}
          />
        </div>
      );
    case "subscribe":
      return (
        <div className="flex flex-col gap-3">
          <TextField label="Título" value={block.title} maxLength={120} onChange={(title) => onChange({ ...block, title })} />
          <TextField label="Texto do botão" value={block.buttonText} maxLength={40} onChange={(buttonText) => onChange({ ...block, buttonText })} />
          <TextField
            label="Mensagem de agradecimento"
            value={block.thankYouMessage}
            maxLength={300}
            onChange={(thankYouMessage) => onChange({ ...block, thankYouMessage })}
          />
          <Toggle label="Pedir também o WhatsApp" checked={block.collectPhone} onChange={(collectPhone) => onChange({ ...block, collectPhone })} />
          <p className="text-xs text-stone-500">Os contatos aparecem em Contatos, no menu do painel.</p>
        </div>
      );
    case "whatsapp":
      return (
        <div className="flex flex-col gap-3">
          <TextField label="Número com DDD" type="tel" value={block.phone} maxLength={30} placeholder="(11) 99999-9999" onChange={(phone) => onChange({ ...block, phone })} />
          <TextArea label="Mensagem que já vem escrita" value={block.message} maxLength={500} onChange={(message) => onChange({ ...block, message })} />
          <TextField label="Texto do botão" value={block.buttonText} maxLength={60} onChange={(buttonText) => onChange({ ...block, buttonText })} />
        </div>
      );
    case "image":
      return (
        <div className="flex flex-col gap-3">
          <TextField label="Imagem (link)" type="url" value={block.imageUrl} maxLength={1000} placeholder="https://..." onChange={(imageUrl) => onChange({ ...block, imageUrl })} />
          <TextField label="Descrição da imagem" value={block.alt} maxLength={200} onChange={(alt) => onChange({ ...block, alt })} />
          <TextField label="Abrir este link ao clicar (opcional)" type="url" value={block.url} maxLength={2000} placeholder="https://..." onChange={(url) => onChange({ ...block, url })} />
        </div>
      );
    case "product":
      return (
        <div className="flex flex-col gap-3">
          <TextField label="Nome do produto" value={block.title} maxLength={120} onChange={(title) => onChange({ ...block, title })} />
          <TextField label="Preço" value={block.price} maxLength={40} placeholder="R$ 49,90" onChange={(price) => onChange({ ...block, price })} />
          <TextArea label="Descrição" value={block.description} maxLength={500} onChange={(description) => onChange({ ...block, description })} />
          <TextField label="Foto (link da imagem)" type="url" value={block.imageUrl} maxLength={1000} placeholder="https://..." onChange={(imageUrl) => onChange({ ...block, imageUrl })} />
          <TextField label="Texto do botão" value={block.buttonText} maxLength={40} onChange={(buttonText) => onChange({ ...block, buttonText })} />
          <TextField
            label="Link de pagamento"
            type="url"
            value={block.url}
            maxLength={2000}
            placeholder="https://... (Mercado Pago, Hotmart, Stripe...)"
            onChange={(url) => onChange({ ...block, url })}
          />
        </div>
      );
    case "map":
      return (
        <div className="flex flex-col gap-3">
          <TextField label="Título" value={block.title} maxLength={120} onChange={(title) => onChange({ ...block, title })} />
          <TextField label="Endereço" value={block.address} maxLength={300} placeholder="Av. Paulista, 1000 - São Paulo" onChange={(address) => onChange({ ...block, address })} />
        </div>
      );
    case "contact":
      return (
        <div className="flex flex-col gap-3">
          <TextField label="Nome" value={block.name} maxLength={80} onChange={(name) => onChange({ ...block, name })} />
          <TextField label="Empresa (opcional)" value={block.company} maxLength={80} onChange={(company) => onChange({ ...block, company })} />
          <TextField label="Telefone" type="tel" value={block.phone} maxLength={30} placeholder="+55 11 99999-9999" onChange={(phone) => onChange({ ...block, phone })} />
          <TextField label="E-mail" type="email" value={block.email} maxLength={120} onChange={(email) => onChange({ ...block, email })} />
          <TextField label="Texto do botão" value={block.buttonText} maxLength={40} onChange={(buttonText) => onChange({ ...block, buttonText })} />
        </div>
      );
  }
}
