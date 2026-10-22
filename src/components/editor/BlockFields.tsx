"use client";

import type { Block } from "@/lib/page/schema";

// Small inline choice used by the block style pickers.
function Options<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Record<T, string>; onChange: (value: T) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-stone-700">{label}</p>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(options) as T[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-lg px-3 py-1.5 text-sm ring-1 ${value === option ? "bg-stone-900 text-white ring-stone-900" : "ring-stone-300"}`}
          >
            {options[option]}
          </button>
        ))}
      </div>
    </div>
  );
}
import { TextArea, TextField, Toggle } from "./fields";

// datetime-local works in local time without seconds or zone; the document
// stores an ISO instant.
function toLocalInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

// Premium designs read the label, subtitle and button text of every link,
// whatever its display; the regular theme only uses them on banners and cards.
export function BlockFields({ block, premium = "", onChange }: { block: Block; premium?: string; onChange: (block: Block) => void }) {
  switch (block.type) {
    case "link":
      return (
        <div className="flex flex-col gap-3">
          <Options
            label="Aparência"
            value={block.display}
            options={{ button: "Botão", banner: "Banner com imagem", card: "Cartão" }}
            onChange={(display) => onChange({ ...block, display })}
          />
          <TextField label={block.display === "button" ? "Texto do botão" : "Título"} value={block.title} maxLength={120} onChange={(title) => onChange({ ...block, title })} />
          {block.display !== "button" || premium ? (
            <>
              <TextField label="Etiqueta (ex.: CURSOS)" value={block.label} maxLength={40} onChange={(label) => onChange({ ...block, label })} />
              <TextField label="Subtítulo" value={block.subtitle} maxLength={200} onChange={(subtitle) => onChange({ ...block, subtitle })} />
            </>
          ) : null}
          {block.display === "banner" || premium ? (
            <TextField label="Texto do botão do banner" value={block.buttonText} maxLength={40} placeholder="Saiba mais" onChange={(buttonText) => onChange({ ...block, buttonText })} />
          ) : null}
          {block.display !== "button" || premium ? (
            <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
              Cor da etiqueta
              <input
                type="color"
                value={block.accent || "#3b6ef5"}
                onChange={(event) => onChange({ ...block, accent: event.target.value })}
                className="h-8 w-14 cursor-pointer rounded ring-1 ring-stone-300"
              />
              {block.accent ? (
                <button type="button" onClick={() => onChange({ ...block, accent: "" })} className="text-xs text-stone-500 underline">
                  usar a cor de destaque
                </button>
              ) : null}
            </label>
          ) : null}
          <TextField label="Endereço" type="url" value={block.url} maxLength={2000} placeholder="https://..." onChange={(url) => onChange({ ...block, url })} />
          <TextField
            label={block.display === "banner" ? "Imagem de fundo do banner (link)" : "Miniatura (link da imagem, opcional)"}
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
      return (
        <div className="flex flex-col gap-3">
          <TextField label="Título" value={block.text} maxLength={120} onChange={(text) => onChange({ ...block, text })} />
          <Options
            label="Estilo"
            value={block.style}
            options={{ plain: "Simples", divider: "Com linhas", section: "Seção", display: "Grande", badge: "Selo" }}
            onChange={(style) => onChange({ ...block, style })}
          />
        </div>
      );
    case "text":
      return (
        <div className="flex flex-col gap-3">
          <Options
            label="Estilo"
            value={block.style}
            options={{ plain: "Parágrafo", quote: "Destaque", footer: "Rodapé" }}
            onChange={(style) => onChange({ ...block, style })}
          />
          {block.style === "quote" ? (
            <TextField label="Frase em destaque" value={block.title} maxLength={200} onChange={(title) => onChange({ ...block, title })} />
          ) : null}
          <TextArea label="Texto" value={block.text} maxLength={4000} onChange={(text) => onChange({ ...block, text })} />
        </div>
      );
    case "stats":
      return (
        <div className="flex flex-col gap-3">
          {block.items.map((item, index) => {
            const setItem = (patch: Partial<typeof item>) =>
              onChange({ ...block, items: block.items.map((it, i) => (i === index ? { ...it, ...patch } : it)) });
            return (
              <div key={index} className="flex items-end gap-2">
                <div className="w-28">
                  <TextField label="Número" value={item.value} maxLength={20} onChange={(value) => setItem({ value })} />
                </div>
                <div className="flex-1">
                  <TextField label="Descrição" value={item.label} maxLength={60} onChange={(label) => setItem({ label })} />
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ ...block, items: block.items.filter((_, i) => i !== index) })}
                  className="pb-2.5 text-xs text-red-600"
                >
                  Remover
                </button>
              </div>
            );
          })}
          {block.items.length < 6 ? (
            <button
              type="button"
              onClick={() => onChange({ ...block, items: [...block.items, { value: "", label: "" }] })}
              className="self-start text-sm underline"
            >
              + Adicionar número
            </button>
          ) : null}
        </div>
      );
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
          <TextField label="Etiqueta (opcional, ex.: CURSO)" value={block.label} maxLength={40} onChange={(label) => onChange({ ...block, label })} />
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
    case "gallery":
      return (
        <div className="flex flex-col gap-3">
          <TextField label="Título (opcional)" value={block.title} maxLength={120} onChange={(title) => onChange({ ...block, title })} />
          <Options
            label="Formato"
            value={block.display}
            options={{ grid: "Grade", carousel: "Carrossel" }}
            onChange={(display) => onChange({ ...block, display })}
          />
          {block.items.map((item, index) => {
            const setItem = (patch: Partial<typeof item>) =>
              onChange({ ...block, items: block.items.map((it, i) => (i === index ? { ...it, ...patch } : it)) });
            return (
              <div key={index} className="flex flex-col gap-2 rounded-lg bg-stone-50 p-3">
                <TextField label={`Foto ${index + 1} (link)`} type="url" value={item.imageUrl} maxLength={1000} placeholder="https://..." onChange={(imageUrl) => setItem({ imageUrl })} />
                <TextField label="Abrir este link ao clicar (opcional)" type="url" value={item.url} maxLength={2000} placeholder="https://..." onChange={(url) => setItem({ url })} />
                <button
                  type="button"
                  onClick={() => onChange({ ...block, items: block.items.filter((_, i) => i !== index) })}
                  className="self-start text-xs text-red-600"
                >
                  Remover foto
                </button>
              </div>
            );
          })}
          {block.items.length < 9 ? (
            <button
              type="button"
              onClick={() => onChange({ ...block, items: [...block.items, { imageUrl: "", url: "" }] })}
              className="self-start text-sm underline"
            >
              + Adicionar foto
            </button>
          ) : null}
        </div>
      );
    case "videos":
      return (
        <div className="flex flex-col gap-3">
          <TextField label="Título (opcional)" value={block.title} maxLength={120} onChange={(title) => onChange({ ...block, title })} />
          <Options
            label="Formato"
            value={block.display}
            options={{ grid: "Grade", carousel: "Carrossel" }}
            onChange={(display) => onChange({ ...block, display })}
          />
          {block.items.map((item, index) => {
            const setItem = (patch: Partial<typeof item>) =>
              onChange({ ...block, items: block.items.map((it, i) => (i === index ? { ...it, ...patch } : it)) });
            return (
              <div key={index} className="flex flex-col gap-2 rounded-lg bg-stone-50 p-3">
                <TextField label={`Vídeo ${index + 1} (link .mp4)`} type="url" value={item.url} maxLength={1000} placeholder="https://... .mp4" onChange={(url) => setItem({ url })} />
                <TextField label="Imagem de capa do vídeo (opcional)" type="url" value={item.poster} maxLength={1000} placeholder="https://..." onChange={(poster) => setItem({ poster })} />
                <button
                  type="button"
                  onClick={() => onChange({ ...block, items: block.items.filter((_, i) => i !== index) })}
                  className="self-start text-xs text-red-600"
                >
                  Remover vídeo
                </button>
              </div>
            );
          })}
          {block.items.length < 9 ? (
            <button
              type="button"
              onClick={() => onChange({ ...block, items: [...block.items, { url: "", poster: "" }] })}
              className="self-start text-sm underline"
            >
              + Adicionar vídeo
            </button>
          ) : null}
        </div>
      );
  }
}
