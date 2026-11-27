"use client";

import { useEffect, useState, type ReactNode } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { imageSrc } from "@/lib/page/links";
import { SITE_DESIGNS, type PageDoc, type Theme } from "@/lib/page/schema";
import { canHideBrand } from "@/lib/entitlements";
import { ListField, TextArea, TextField, Toggle } from "./fields";
import { UploadButton } from "./UploadButton";
import { VideoUploadButton } from "./VideoUploadButton";
import { applyPatch, type DocChange, type Patch } from "./types";

// Premium designs keep their content in doc.premium / doc.theme / doc.profile
// (not in blocks). This module exposes that same editing — unchanged — as a
// list of "sections", so the Blocos tab can show each one as its own card.
// Nothing here changes how a page renders or is saved; it only groups the
// existing fields so they live next to the real blocks.

type Design = Exclude<Theme["premium"], "">;

export type PremiumSection = { id: string; label: string };

const STORE_SECTIONS: PremiumSection[] = [
  { id: "premium:hero", label: "Destaque (carrossel)" },
  { id: "premium:promo", label: "Cartão de oferta" },
  { id: "premium:feature", label: "Cartão de novidade" },
  { id: "premium:size", label: "Cartão de tamanho" },
  { id: "premium:nav", label: "Rodapé (links)" },
];

// The "site" family (landing-style models): the same parts for every design.
const SITE_SECTIONS: PremiumSection[] = [
  { id: "premium:hero", label: "Capa e chamada" },
  { id: "premium:stats", label: "Números" },
  { id: "premium:nav", label: "Categorias e faixa" },
  { id: "premium:text", label: "Sobre e depoimento" },
  { id: "premium:catalog", label: "Vitrine (produtos e serviços)" },
  { id: "premium:feature", label: "Destaque / oferta" },
  { id: "premium:links", label: "Lista de links" },
  { id: "premium:hours", label: "Horários" },
  { id: "premium:promo", label: "Chamada final" },
];
const isSite = (design: string) => (SITE_DESIGNS as readonly string[]).includes(design);

const COLORS: PremiumSection = { id: "premium:colors", label: "Cores do modelo" };

// The ordered sections shown for each premium design.
export function getPremiumSections(design: Design): PremiumSection[] {
  switch (design) {
    case "authority":
      return [COLORS, { id: "premium:text", label: "Rodapé" }];
    case "spotlight":
      return [
        COLORS,
        { id: "premium:header", label: "Topo e logo" },
        { id: "premium:site", label: "Botão do site" },
        { id: "premium:cover", label: "Posição da foto" },
        { id: "premium:legal", label: "Links legais" },
      ];
    case "ecosystem":
      return [
        COLORS,
        { id: "premium:header", label: "Topo e logo" },
        { id: "premium:cover", label: "Posição da foto" },
        { id: "premium:text", label: "Textos da seção" },
      ];
    case "catalog":
      return [COLORS, { id: "premium:text", label: "Título e contato" }];
    case "experience":
      return [COLORS, { id: "premium:text", label: "Logo, frases e abas" }];
    case "casa":
      // Casa draws only the cover and its texts (including the opening hours).
      return [COLORS, { id: "premium:hero", label: "Capa / topo" }, { id: "premium:text", label: "Textos do restaurante" }];
    case "bistro":
    case "bar":
      // Ordered to match the restaurant layout top-to-bottom in the preview.
      // These designs have no size card, so it isn't offered.
      return [
        COLORS,
        { id: "premium:hero", label: "Capa / topo" },
        { id: "premium:feature", label: "Chamada de pedido" },
        { id: "premium:text", label: design === "bar" ? "Textos do bar" : "Textos do restaurante" },
        { id: "premium:nav", label: "Atalhos / rodapé" },
        { id: "premium:promo", label: "Cartão de oferta" },
      ];
    case "clinic":
      // Health professional: every part is its own card, hideable and draggable.
      return [
        COLORS,
        { id: "premium:hero", label: "Capa e identificação" },
        { id: "premium:site", label: "Sobre mim e contatos" },
        { id: "premium:stats", label: "Números" },
        { id: "premium:hours", label: "Dias de atendimento" },
        { id: "premium:promo", label: "Botão de agendar" },
        { id: "premium:text", label: "Serviços" },
        { id: "premium:feature", label: "Endereço e links" },
      ];
    case "menu":
      // Menu draws only a cover, the dish list (product blocks), a reserve
      // button and the footer links — it has no feature/size cards.
      return [
        COLORS,
        { id: "premium:hero", label: "Capa / topo" },
        { id: "premium:promo", label: "Tarja e botão de reserva" },
        { id: "premium:nav", label: "Rodapé (links)" },
      ];
    default:
      if (isSite(design)) return [COLORS, ...SITE_SECTIONS];
      // store, lookbook, mosaic, dropz, promo
      return [COLORS, ...STORE_SECTIONS];
  }
}

// Parts each design can actually hide — the page render checks
// premium.hiddenParts for exactly these ids, so the "Visível" switch only
// shows where turning a part off really removes it.
const HIDEABLE: Record<string, string[]> = {
  store: ["premium:promo", "premium:feature", "premium:size", "premium:nav"],
  lookbook: ["premium:promo", "premium:feature", "premium:nav"],
  mosaic: ["premium:promo", "premium:nav"],
  dropz: ["premium:promo", "premium:nav"],
  promo: ["premium:nav"],
  menu: ["premium:hero", "premium:promo", "premium:nav"],
  bar: ["premium:hero", "premium:promo", "premium:nav", "premium:feature", "premium:text"],
  bistro: ["premium:hero", "premium:feature", "premium:text", "premium:nav"],
  casa: ["premium:hero", "premium:text"],
  clinic: ["premium:hero", "premium:site", "premium:stats", "premium:hours", "premium:promo", "premium:text", "premium:feature"],
};

for (const design of SITE_DESIGNS) HIDEABLE[design] = SITE_SECTIONS.map((sec) => sec.id);

// Designs whose page render reads premium.partOrder, so their parts can be
// dragged to reorder in the editor. Others keep their fixed layout.
const REORDERABLE_DESIGNS: string[] = ["bar", "clinic", ...SITE_DESIGNS];

// A short line shown under the card title while it is collapsed.
export function premiumSectionSummary(id: string, doc: PageDoc): string {
  const p = doc.premium;
  if (isSite(doc.theme.premium)) {
    const count = (type: string) => doc.blocks.filter((b) => b.type === type && b.enabled).length;
    switch (id) {
      case "premium:hero":
        return p.heading.split("\n")[0] || "Foto, título e botões";
      case "premium:stats": {
        const items = doc.blocks.find((b) => b.type === "stats")?.items ?? [];
        return items.length ? items.map((i) => i.value).filter(Boolean).join(" · ") : "Sem números";
      }
      case "premium:nav":
        return [...p.navLinks.map((n) => n.label), ...p.benefits].filter(Boolean).slice(0, 4).join(" · ") || "Vazio";
      case "premium:text":
        return p.aboutTitle || p.about.slice(0, 50) || "Vazio";
      case "premium:catalog":
        return `${p.catalogTitle.split("\n")[0] || "Vitrine"} · ${count("product")} itens`;
      case "premium:feature":
        return p.featureTitle || p.promoDiscount || "Vazio";
      case "premium:links":
        return `${p.linksTitle.split("\n")[0] || "Links"} · ${count("link")} itens`;
      case "premium:hours":
        return p.hours.length ? `${p.hours.length} ${p.hours.length === 1 ? "horário" : "horários"}` : "Nenhum horário";
      case "premium:promo":
        return p.ctaTitle.split("\n")[0] || p.ctaButton || "Vazio";
      default:
        return "";
    }
  }
  if (doc.theme.premium === "clinic") {
    switch (id) {
      case "premium:hero":
        return [p.credential, p.tagline].filter(Boolean).join(" · ") || "Foto, registro e especialidade";
      case "premium:site":
        return p.siteLabel || "Botão e ícones de contato";
      case "premium:stats": {
        const items = doc.blocks.find((b) => b.type === "stats")?.items ?? [];
        return items.length ? items.map((i) => i.value).filter(Boolean).join(" · ") : "Sem números";
      }
      case "premium:hours":
        return p.hours.length ? `${p.hours.length} ${p.hours.length === 1 ? "dia" : "dias"}` : "Nenhum dia";
      case "premium:promo":
        return p.promoButton || "Sem botão";
      case "premium:text": {
        const n = doc.blocks.filter((b) => b.type === "product").length;
        return `${n} ${n === 1 ? "serviço" : "serviços"}`;
      }
      case "premium:feature":
        return p.featureLabel || p.featureTitle || "Endereço, links e botão final";
    }
  }
  switch (id) {
    case "premium:colors":
      return "Fundo, texto e destaque";
    case "premium:hero":
      return p.heroType === "video"
        ? `Vídeo · ${p.heroVideos.filter(Boolean).length}`
        : `${p.heroSlides.length} ${p.heroSlides.length === 1 ? "slide" : "slides"}`;
    case "premium:promo":
      // The Bar shows only the orange bar text, so its summary skips the discount.
      if (doc.theme.premium === "bar") return p.promoBadge || "Tarja laranja";
      return [p.promoBadge, p.promoDiscount].filter(Boolean).join(" · ") || "Cupom e desconto";
    case "premium:feature":
      return p.featureTitle || p.featureLabel || "Novidade";
    case "premium:size":
      return p.sizeTitle || "Tamanhos";
    case "premium:nav":
      return `${p.navLinks.length} ${p.navLinks.length === 1 ? "link" : "links"}`;
    case "premium:header":
      return { logo: "Logo", name: "Nome", none: "Nada" }[p.header];
    case "premium:site":
      return p.siteLabel || "Botão do site";
    case "premium:cover":
      return "Enquadramento da foto";
    case "premium:legal":
      return "Privacidade e termos";
    case "premium:text":
      return "Textos do modelo";
    default:
      return "";
  }
}

function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Record<T, string>;
  onChange: (value: T) => void;
}) {
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

function ColorInputs({ doc, setTheme }: { doc: PageDoc; setTheme: (patch: Partial<Theme>) => void }) {
  const design = doc.theme.premium as Design;
  const colors: [keyof Theme, string][] = [
    ["background", "Fundo"],
    ["text", "Texto"],
    ["accent", "Destaque"],
  ];
  const palettes = design === "clinic" ? CLINIC_PALETTES : [];
  return (
    <div className="flex flex-col gap-3">
      {palettes.length ? (
        <div>
          <p className="mb-1.5 text-sm font-medium text-stone-700">Paletas prontas</p>
          <div className="flex flex-wrap gap-2">
            {palettes.map((palette) => {
              const active = doc.theme.background === palette.background && doc.theme.text === palette.text && doc.theme.accent === palette.accent;
              return (
                <button
                  key={palette.name}
                  type="button"
                  onClick={() => setTheme({ background: palette.background, text: palette.text, accent: palette.accent })}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm ring-1 ${active ? "ring-2 ring-stone-900" : "ring-stone-300"}`}
                >
                  <span className="flex overflow-hidden rounded-full ring-1 ring-black/10">
                    <span className="h-4 w-3" style={{ background: palette.background }} />
                    <span className="h-4 w-3" style={{ background: palette.accent }} />
                    <span className="h-4 w-3" style={{ background: palette.text }} />
                  </span>
                  {palette.name}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs text-stone-500">Toque numa paleta ou ajuste cada cor abaixo.</p>
        </div>
      ) : null}
      <div className="grid grid-cols-3 gap-3">
        {colors
          .filter(([key]) => design !== "authority" || key !== "accent")
          .map(([key, label]) => (
            <label key={String(key)} className="flex flex-col gap-1 text-sm font-medium text-stone-700">
              {label}
              <input
                type="color"
                value={String(doc.theme[key])}
                onChange={(event) => setTheme({ [key]: event.target.value })}
                className="h-10 w-full cursor-pointer rounded-lg ring-1 ring-stone-300"
              />
            </label>
          ))}
      </div>
    </div>
  );
}

// One-tap colour sets for the clinic model (background, text and accent).
const CLINIC_PALETTES = [
  { name: "Azul", background: "#dfe9ee", text: "#0b3147", accent: "#5aa7bf" },
  { name: "Verde", background: "#e3ede6", text: "#12392b", accent: "#5fae8b" },
  { name: "Rosa", background: "#f3e4e6", text: "#4a1f2c", accent: "#d98a9c" },
  { name: "Lilás", background: "#e9e5f3", text: "#2b2350", accent: "#9484d6" },
  { name: "Areia", background: "#efe8dd", text: "#3b2f22", accent: "#c8a26b" },
  { name: "Escuro", background: "#0f1c24", text: "#eaf3f7", accent: "#5aa7bf" },
];

function CoverPosition({ doc, setPremium }: { doc: PageDoc; setPremium: (patch: Patch<PageDoc["premium"]>) => void }) {
  const coverSrc = imageSrc(doc.profile.coverUrl);
  const coverPos = `${doc.premium.coverX}% ${doc.premium.coverY}%`;
  return (
    <div className="grid grid-cols-2 gap-3">
      <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
        Posição da foto (horizontal)
        <input type="range" min={0} max={100} value={doc.premium.coverX} onChange={(event) => setPremium({ coverX: Number(event.target.value) })} />
        <div className="mt-1 aspect-video w-full overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-200">
          {coverSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSrc} alt="" className="h-full w-full object-cover" style={{ objectPosition: coverPos }} />
          ) : (
            <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-stone-400">Defina a capa em Perfil</div>
          )}
        </div>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
        Posição da foto (vertical)
        <input type="range" min={0} max={100} value={doc.premium.coverY} onChange={(event) => setPremium({ coverY: Number(event.target.value) })} />
        <div className="mt-1 aspect-[3/4] w-full overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-200">
          {coverSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSrc} alt="" className="h-full w-full object-cover" style={{ objectPosition: coverPos }} />
          ) : (
            <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-stone-400">Defina a capa em Perfil</div>
          )}
        </div>
      </label>
    </div>
  );
}

function HeroFields({ doc, setPremium, design }: { doc: PageDoc; setPremium: (patch: Patch<PageDoc["premium"]>) => void; design?: Design }) {
  const p = doc.premium;
  // The Bar cover only draws the photo and its title — it has no corner badge
  // and no product/price card over the image. Hide those fields here so the
  // editor shows only what this model actually uses.
  const simpleCover = design === "bar";
  const slides = p.heroSlides;
  const setSlide = (index: number, patch: Partial<(typeof slides)[number]>) =>
    setPremium((cur) => ({ heroSlides: cur.heroSlides.map((slide, i) => (i === index ? { ...slide, ...patch } : slide)) }));
  const addSlide = () =>
    setPremium({ heroSlides: [...slides, { imageUrl: "", headline: "", productLabel: "NA TELA", productName: "", priceFrom: "", price: "", url: "" }] });
  const removeSlide = (index: number) => setPremium({ heroSlides: slides.filter((_, i) => i !== index) });
  const videos = p.heroVideos;
  const setVideo = (index: number, url: string) => setPremium({ heroVideos: videos.map((v, i) => (i === index ? url : v)) });
  const addVideo = () => setPremium({ heroVideos: [...videos, ""] });
  const removeVideo = (index: number) => setPremium({ heroVideos: videos.filter((_, i) => i !== index) });
  const isVideo = p.heroType === "video";
  return (
    <div className="flex flex-col gap-3">
      <Choice
        label="Tipo de capa"
        value={p.heroType}
        options={{ image: "Imagem / Carrossel", video: "Vídeo" }}
        onChange={(heroType) => setPremium({ heroType })}
      />
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
          Altura da capa
          <input
            type="range"
            min={0}
            max={620}
            step={1}
            value={p.coverHeight}
            onChange={(e) => setPremium({ coverHeight: Number(e.target.value) })}
          />
          <span className="text-xs text-stone-500">{p.coverHeight ? `${p.coverHeight}px` : "Automático (padrão)"}</span>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
          {isVideo ? "Tempo de cada vídeo (segundos)" : "Tempo de cada imagem (segundos)"}
          <input
            type="number"
            min={1}
            max={30}
            value={p.heroSeconds}
            onChange={(e) => setPremium({ heroSeconds: Math.min(30, Math.max(1, Number(e.target.value) || 4)) })}
            className="field"
          />
          <span className="text-xs text-stone-500">
            {isVideo ? "Com 2+ vídeos, a capa alterna entre eles." : "Com 2+ imagens, a capa vira um carrossel automático."}
          </span>
        </label>
      </div>
      {simpleCover ? (
        <Toggle label="Cantos de baixo da capa arredondados" checked={!p.heroSquareBottom} onChange={(on) => setPremium({ heroSquareBottom: !on })} />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Texto do selo (canto superior)" value={p.heroPill} maxLength={40} onChange={(heroPill) => setPremium({ heroPill })} />
          <TextField label="Link do selo" type="url" value={p.heroPillUrl} maxLength={2000} onChange={(heroPillUrl) => setPremium({ heroPillUrl })} />
        </div>
      )}

      {isVideo ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-stone-700">Vídeos da capa</p>
          <p className="-mt-1 text-xs text-stone-500">Suba da sua biblioteca (o vídeo é encurtado e fica leve) ou cole um link .mp4. Com mais de um, eles vão trocando no tempo acima. Tocam sem som e em loop.</p>
          {videos.map((url, index) => (
            <div key={index} className="flex flex-col gap-2 rounded-lg bg-stone-50 p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-stone-700">Vídeo {index + 1}</span>
                <button type="button" onClick={() => removeVideo(index)} className="text-xs text-red-500">
                  Remover
                </button>
              </div>
              {url ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video src={url} muted playsInline preload="metadata" className="h-28 w-auto max-w-full rounded-md bg-black object-contain" />
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <VideoUploadButton label={url ? "Trocar vídeo" : "Enviar da biblioteca"} onUploaded={(v) => setVideo(index, v)} />
                <span className="text-xs text-stone-400">ou</span>
                <input type="url" value={url} placeholder="colar link .mp4" onChange={(e) => setVideo(index, e.target.value)} className="field min-w-[150px] flex-1" />
              </div>
            </div>
          ))}
          {videos.length < 8 ? (
            <button type="button" onClick={addVideo} className="self-start rounded-lg border border-dashed border-stone-300 px-3 py-1.5 text-sm text-stone-600">
              + Adicionar vídeo
            </button>
          ) : null}
        </div>
      ) : (
        <PositionControls doc={doc} setPremium={setPremium} />
      )}

      {isVideo ? null : slides.map((slide, index) => (
        <div key={index} className="flex flex-col gap-2 rounded-lg bg-stone-50 p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Slide {index + 1}</span>
            <button type="button" onClick={() => removeSlide(index)} className="text-xs text-red-500">
              Remover
            </button>
          </div>
          <TextField label="Imagem (link)" type="url" value={slide.imageUrl} placeholder="https://..." onChange={(imageUrl) => setSlide(index, { imageUrl })} />
          <UploadButton label="Enviar imagem" onUploaded={(imageUrl) => setSlide(index, { imageUrl })} />
          <TextField label="Título (use Enter para quebrar a linha)" value={slide.headline} maxLength={80} onChange={(headline) => setSlide(index, { headline })} />
          {simpleCover ? null : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <TextField label="Rótulo do produto" value={slide.productLabel} maxLength={20} onChange={(productLabel) => setSlide(index, { productLabel })} />
                <TextField label="Nome do produto" value={slide.productName} maxLength={60} onChange={(productName) => setSlide(index, { productName })} />
                <TextField label="Preço de (riscado)" value={slide.priceFrom} maxLength={20} onChange={(priceFrom) => setSlide(index, { priceFrom })} />
                <TextField label="Preço por" value={slide.price} maxLength={20} onChange={(price) => setSlide(index, { price })} />
              </div>
              <TextField label="Link do produto" type="url" value={slide.url} maxLength={2000} onChange={(url) => setSlide(index, { url })} />
            </>
          )}
        </div>
      ))}
      {!isVideo && slides.length < 6 ? (
        <button type="button" onClick={addSlide} className="self-start rounded-lg border border-dashed border-stone-300 px-3 py-1.5 text-sm text-stone-600">
          + Adicionar slide
        </button>
      ) : null}
    </div>
  );
}

// Framing of the cover image (object-position), as two sliders.
function PositionControls({ doc, setPremium }: { doc: PageDoc; setPremium: (patch: Patch<PageDoc["premium"]>) => void }) {
  const p = doc.premium;
  return (
    <div className="rounded-lg bg-stone-50 p-2.5">
      <p className="mb-1 text-sm font-medium text-stone-700">Posição da imagem</p>
      <p className="mb-2 text-xs text-stone-500">Ajuste qual parte da foto aparece na capa.</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-stone-600">
          Horizontal
          <input type="range" min={0} max={100} value={p.heroPosX} onChange={(e) => setPremium({ heroPosX: Number(e.target.value) })} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-stone-600">
          Vertical
          <input type="range" min={0} max={100} value={p.heroPosY} onChange={(e) => setPremium({ heroPosY: Number(e.target.value) })} />
        </label>
      </div>
    </div>
  );
}

// Comma-separated list <-> string[] helper.
function PromoFields({ doc, setPremium, design }: { doc: PageDoc; setPremium: (patch: Patch<PageDoc["premium"]>) => void; design?: Design }) {
  const p = doc.premium;
  // The Bar draws only the orange bar (tarja) and the orange button + its link.
  // It has no discount, coupon code, benefits list, or separate note here (the
  // hours are edited in "Textos do bar"), so those fields are hidden for it.
  if (design === "bar") {
    return (
      <div className="flex flex-col gap-3">
        <TextField label="Tarja laranja (ex.: NOVIDADE — CONHEÇA O MENU AUTORAL)" value={p.promoBadge} maxLength={80} onChange={(promoBadge) => setPremium({ promoBadge })} />
        <TextField label="Texto do botão laranja (embaixo)" value={p.promoButton} maxLength={30} onChange={(promoButton) => setPremium({ promoButton })} />
        <TextField label="Link da tarja e do botão" type="url" value={p.promoUrl} maxLength={2000} onChange={(promoUrl) => setPremium({ promoUrl })} />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Selo / tarja" value={p.promoBadge} maxLength={80} onChange={(promoBadge) => setPremium({ promoBadge })} />
        <TextField label="Desconto (ex.: 15% OFF)" value={p.promoDiscount} maxLength={20} onChange={(promoDiscount) => setPremium({ promoDiscount })} />
        <TextField label="Texto do botão" value={p.promoButton} maxLength={30} onChange={(promoButton) => setPremium({ promoButton })} />
        <TextField label="Código do cupom (ao tocar, copia)" value={p.promoCode} maxLength={30} onChange={(promoCode) => setPremium({ promoCode })} />
      </div>
      <TextField label="Observação" value={p.promoNote} maxLength={80} onChange={(promoNote) => setPremium({ promoNote })} />
      <TextField label="Link do botão (usado só se não houver cupom)" type="url" value={p.promoUrl} maxLength={2000} onChange={(promoUrl) => setPremium({ promoUrl })} />
      <ListField label="Vantagens (separe por vírgula, até 4)" value={p.benefits} max={4} itemMax={30} onChange={(benefits) => setPremium({ benefits })} />
    </div>
  );
}

function FeatureFields({ doc, setPremium, design }: { doc: PageDoc; setPremium: (patch: Patch<PageDoc["premium"]>) => void; design?: Design }) {
  const p = doc.premium;
  // The Bar only draws the ambience photo and its label here — no title, link,
  // tags or colors. Show just those two fields for this model.
  const photoOnly = design === "bar";
  return (
    <div className="flex flex-col gap-3">
      {photoOnly ? (
        <TextField label="Rótulo sobre a foto (ex.: BOA COMIDA)" value={p.featureLabel} maxLength={30} onChange={(featureLabel) => setPremium({ featureLabel })} />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Rótulo" value={p.featureLabel} maxLength={30} onChange={(featureLabel) => setPremium({ featureLabel })} />
          <TextField label="Título" value={p.featureTitle} maxLength={40} onChange={(featureTitle) => setPremium({ featureTitle })} />
        </div>
      )}
      <TextField label="Imagem (link)" type="url" value={p.featureImageUrl} placeholder="https://..." onChange={(featureImageUrl) => setPremium({ featureImageUrl })} />
      <UploadButton label="Enviar imagem" onUploaded={(featureImageUrl) => setPremium({ featureImageUrl })} />
      {photoOnly ? null : (
        <>
          <TextField label="Link" type="url" value={p.featureUrl} maxLength={2000} onChange={(featureUrl) => setPremium({ featureUrl })} />
          <ListField label="Etiquetas (separe por vírgula, até 5)" value={p.featureTags} max={5} itemMax={20} onChange={(featureTags) => setPremium({ featureTags })} />
          <ListField label="Cores em destaque (hex, separe por vírgula)" value={p.featureColors} max={8} itemMax={20} onChange={(featureColors) => setPremium({ featureColors })} />
        </>
      )}
    </div>
  );
}

function SizeFields({ doc, setPremium }: { doc: PageDoc; setPremium: (patch: Patch<PageDoc["premium"]>) => void }) {
  const p = doc.premium;
  return (
    <div className="flex flex-col gap-3">
      <TextField label="Título" value={p.sizeTitle} maxLength={60} onChange={(sizeTitle) => setPremium({ sizeTitle })} />
      <div className="grid grid-cols-2 gap-3">
        <ListField label="Tamanhos (separe por vírgula)" value={p.sizes} max={10} itemMax={6} onChange={(sizes) => setPremium({ sizes })} />
        <TextField label="Tamanho em destaque" value={p.sizeActive} maxLength={6} onChange={(sizeActive) => setPremium({ sizeActive })} />
      </div>
      <TextField label="Imagem (link, opcional)" type="url" value={p.sizeImageUrl} placeholder="https://..." onChange={(sizeImageUrl) => setPremium({ sizeImageUrl })} />
      <UploadButton label="Enviar imagem" onUploaded={(sizeImageUrl) => setPremium({ sizeImageUrl })} />
    </div>
  );
}

function NavFields({ doc, setPremium, plan }: { doc: PageDoc; setPremium: (patch: Patch<PageDoc["premium"]>) => void; plan?: string }) {
  const nav = doc.premium.navLinks;
  const canHideFooter = canHideBrand(plan);
  const setNav = (index: number, patch: Partial<(typeof nav)[number]>) =>
    setPremium({ navLinks: nav.map((item, i) => (i === index ? { ...item, ...patch } : item)) });
  return (
    <div className="flex flex-col gap-3">
      {nav.map((item, index) => (
        <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
          <TextField label="Nome" value={item.label} maxLength={20} onChange={(label) => setNav(index, { label })} />
          <TextField label="Link" type="url" value={item.url} maxLength={2000} onChange={(url) => setNav(index, { url })} />
          <button type="button" onClick={() => setPremium({ navLinks: nav.filter((_, i) => i !== index) })} className="pb-2 text-xs text-red-500">
            ✕
          </button>
        </div>
      ))}
      {nav.length < 6 ? (
        <button
          type="button"
          onClick={() => setPremium({ navLinks: [...nav, { label: "", url: "" }] })}
          className="self-start rounded-lg border border-dashed border-stone-300 px-3 py-1.5 text-sm text-stone-600"
        >
          + Adicionar link
        </button>
      ) : null}
      <div className="mt-1 border-t border-stone-100 pt-3">
        {canHideFooter ? (
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-stone-800">Mostrar o nome e o © no rodapé</span>
            <span className="relative inline-flex shrink-0">
              <input type="checkbox" role="switch" className="peer sr-only" checked={!doc.premium.hideFooter} onChange={(e) => setPremium({ hideFooter: !e.target.checked })} />
              <span className="h-6 w-11 rounded-full bg-stone-300 transition-colors peer-checked:bg-stone-900" />
              <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
            </span>
          </label>
        ) : (
          <p className="text-xs text-stone-500">Esconder o nome/© do rodapé é do plano Profissional.</p>
        )}
      </div>
    </div>
  );
}

function TextSection({ doc, onChange, setPremium }: { doc: PageDoc; onChange: DocChange; setPremium: (patch: Patch<PageDoc["premium"]>) => void }) {
  const design = doc.theme.premium as Design;
  const p = doc.premium;
  const setLogo = (logo: string) => onChange((d) => ({ ...d, profile: { ...d.profile, logo } }));
  if (design === "authority") {
    return <TextField label="Nome no rodapé (opcional)" value={p.footer} maxLength={80} onChange={(footer) => setPremium({ footer })} />;
  }
  if (design === "ecosystem") {
    return (
      <div className="flex flex-col gap-3">
        <TextField label="Título da seção" value={p.sectionTitle} maxLength={60} onChange={(sectionTitle) => setPremium({ sectionTitle })} />
        <TextArea label="Frase de destaque" value={p.quote} maxLength={200} onChange={(quote) => setPremium({ quote })} />
        <TextArea label="Texto sobre você" value={p.about} maxLength={1000} onChange={(about) => setPremium({ about })} />
        <p className="text-xs text-stone-500">
          Na aba Blocos: o bloco Números vira os indicadores; links em Cartão viram projetos, em Banner viram a chamada em destaque e em Botão viram o link do site.
        </p>
      </div>
    );
  }
  if (design === "catalog") {
    return (
      <div className="flex flex-col gap-3">
        <TextArea label="Título principal (uma linha por trecho; a última fica em destaque)" value={p.heading} maxLength={240} onChange={(heading) => setPremium({ heading })} />
        <TextField label="Texto do contato" value={p.contactLabel} maxLength={60} onChange={(contactLabel) => setPremium({ contactLabel })} />
        <TextField label="E-mail de contato (opcional)" type="email" value={p.email} maxLength={120} onChange={(email) => setPremium({ email })} />
        <p className="text-xs text-stone-500">O número do WhatsApp fica em Perfil → WhatsApp flutuante.</p>
      </div>
    );
  }
  if (design === "experience") {
    return (
      <div className="flex flex-col gap-3">
        <TextField label="Logo / assinatura (link da imagem) — fica sobre a capa" type="url" value={doc.profile.logo} placeholder="https://..." onChange={setLogo} />
        <TextField label="Frase de posicionamento" value={p.tagline} maxLength={120} onChange={(tagline) => setPremium({ tagline })} />
        <TextField label="Registro / credencial (ex.: CRO 00000)" value={p.credential} maxLength={80} onChange={(credential) => setPremium({ credential })} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Aba 1 (público)" value={p.audienceA} maxLength={40} onChange={(audienceA) => setPremium({ audienceA })} />
          <TextField label="Aba 2 (público)" value={p.audienceB} maxLength={40} onChange={(audienceB) => setPremium({ audienceB })} />
        </div>
        <p className="text-xs text-stone-500">
          A capa (foto ou vídeo) e o WhatsApp ficam em Perfil. Os números vêm do bloco Números. Na aba Blocos, cada bloco pode aparecer para todos, só na Aba 1 ou só na Aba 2.
        </p>
      </div>
    );
  }
  if (design === "bistro") {
    return (
      <div className="flex flex-col gap-3">
        <Toggle label="Mostrar o nome na capa" checked={!p.hideName} onChange={(on) => setPremium({ hideName: !on })} />
        <TextField label="Subtítulo do logo (ex.: RESTAURANTE)" value={p.credential} maxLength={80} onChange={(credential) => setPremium({ credential })} />
        <TextField label="Seção dos pratos — rótulo (ex.: ESCOLHAS DA CASA)" value={p.sectionTitle} maxLength={60} onChange={(sectionTitle) => setPremium({ sectionTitle })} />
        <TextField label="Seção dos pratos — título (ex.: Hoje combina com...)" value={p.heading} maxLength={240} onChange={(heading) => setPremium({ heading })} />
        <TextField label="Título dos atalhos (ex.: Seu momento, do seu jeito.)" value={p.quote} maxLength={200} onChange={(quote) => setPremium({ quote })} />
        <TextField label="Frase sobre a foto do ambiente" value={p.about} maxLength={1000} onChange={(about) => setPremium({ about })} />
        <TextField label="Horário no rodapé (ex.: Terça a domingo · 12h às 23h)" value={p.promoNote} maxLength={80} onChange={(promoNote) => setPremium({ promoNote })} />
        <p className="text-xs text-stone-500">
          A tarja da capa, o botão de pedido, os atalhos (rodapé), a foto do ambiente e os pratos (blocos Produto) você edita nos cards abaixo e nos blocos.
        </p>
      </div>
    );
  }
  if (design === "bar") {
    return (
      <div className="flex flex-col gap-3">
        <Toggle label="Mostrar o nome/logo no topo" checked={!p.hideName} onChange={(on) => setPremium({ hideName: !on })} />
        <TextField label="Texto acima do título da capa (ex.: COZINHA AUTORAL + BAR)" value={p.tagline} maxLength={120} onChange={(tagline) => setPremium({ tagline })} />
        <TextField label="Seção — rótulo (ex.: ESCOLHA SUA EXPERIÊNCIA)" value={p.sectionTitle} maxLength={60} onChange={(sectionTitle) => setPremium({ sectionTitle })} />
        <TextField label="Seção — título (ex.: EXPLORE OS SABORES.)" value={p.heading} maxLength={240} onChange={(heading) => setPremium({ heading })} />
        <TextArea label="Frase grande (uma linha por trecho; a última fica em laranja)" value={p.quote} maxLength={200} onChange={(quote) => setPremium({ quote })} />
        <TextField label="Legenda da frase (ex.: Uma mesa, novas histórias.)" value={p.about} maxLength={1000} onChange={(about) => setPremium({ about })} />
        <TextField label="Chamada do rodapé (ex.: VENHA PARA O ATTO)" value={p.siteLabel} maxLength={40} onChange={(siteLabel) => setPremium({ siteLabel })} />
        <TextField label="Endereço (ex.: Rua do Encontro, 120 · São Paulo)" value={p.credential} maxLength={80} onChange={(credential) => setPremium({ credential })} />
        <TextField label="Horário (ex.: Terça a domingo · 18h às 23h)" value={p.promoNote} maxLength={80} onChange={(promoNote) => setPremium({ promoNote })} />
        <TextField label="Link do botão laranja (Reservar) e do rodapé" type="url" value={p.siteUrl} maxLength={2000} onChange={(siteUrl) => setPremium({ siteUrl })} />
        <p className="text-xs text-stone-500">
          A capa (foto + título), a tarja laranja, os atalhos 01/02/03, a foto do ambiente, o texto do botão e os cartões Cozinha/Bar (blocos Produto) você edita nos cards abaixo e nos blocos.
        </p>
      </div>
    );
  }
  // casa
  return (
    <div className="flex flex-col gap-3">
      <TextField label="Subtítulo do logo (ex.: COZINHA & ENCONTROS)" value={p.credential} maxLength={80} onChange={(credential) => setPremium({ credential })} />
      <TextField label="Frase de boas-vindas (ex.: Escolha como viver seu próximo momento.)" value={p.heading} maxLength={240} onChange={(heading) => setPremium({ heading })} />
      <TextField label="Horário (ex.: Terça a domingo · 12h às 23h)" value={p.promoNote} maxLength={80} onChange={(promoNote) => setPremium({ promoNote })} />
      <p className="text-xs text-stone-500">
        O carrossel da capa (várias imagens + legenda de cada uma) você monta no card &quot;Destaque (carrossel)&quot; abaixo, e os botões (Reserva, iFood, Cardápio, Localização…) na aba Blocos — cada link vira uma linha com ícone automático.
      </p>
    </div>
  );
}

// Editing controls for every part of the "clinic" model. Each card shows only
// the fields that part really draws.
function ClinicFields({ id, doc, onChange, setPremium }: { id: string; doc: PageDoc; onChange: DocChange; setPremium: (patch: Patch<PageDoc["premium"]>) => void }) {
  const p = doc.premium;
  const hint = (text: string) => <p className="text-xs text-stone-500">{text}</p>;
  const addRow = "self-start rounded-lg border border-dashed border-stone-300 px-3 py-1.5 text-sm text-stone-600";

  if (id === "premium:hero") {
    const photo = p.heroSlides[0]?.imageUrl ?? "";
    const setPhoto = (imageUrl: string) =>
      setPremium((cur) => ({
        heroSlides: cur.heroSlides.length
          ? cur.heroSlides.map((slide, i) => (i === 0 ? { ...slide, imageUrl } : slide))
          : [{ imageUrl, headline: "", productLabel: "", productName: "", priceFrom: "", price: "", url: "" }],
      }));
    return (
      <div className="flex flex-col gap-3">
        <TextField label="Foto da capa (link ou envie)" type="url" value={photo} placeholder="https://..." onChange={setPhoto} />
        <UploadButton label="Enviar foto" onUploaded={setPhoto} />
        {hint("Use uma foto sua de frente, de preferência com fundo liso. Ela aparece à direita da capa.")}
        <PositionControls doc={doc} setPremium={setPremium} />
        <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
          Altura da capa
          <input type="range" min={0} max={620} step={1} value={p.coverHeight} onChange={(e) => setPremium({ coverHeight: Number(e.target.value) })} />
          <span className="text-xs text-stone-500">{p.coverHeight ? `${p.coverHeight}px` : "Automático (padrão)"}</span>
        </label>
        <Toggle label="Mostrar o nome na capa" checked={!p.hideName} onChange={(on) => setPremium({ hideName: !on })} />
        <TextField label="Selo de nota (ex.: ★ 4,9)" value={p.heroPill} maxLength={40} onChange={(heroPill) => setPremium({ heroPill })} />
        <TextField label="Registro (ex.: CRM-SP 123456)" value={p.credential} maxLength={80} onChange={(credential) => setPremium({ credential })} />
        <TextField label="Especialidade" value={p.tagline} maxLength={120} onChange={(tagline) => setPremium({ tagline })} />
        {hint("O nome vem do Perfil (card no topo). Campo vazio não aparece na página.")}
      </div>
    );
  }

  if (id === "premium:site") {
    return (
      <div className="flex flex-col gap-3">
        <TextField label="Texto do botão (ex.: Sobre mim)" value={p.siteLabel} maxLength={40} onChange={(siteLabel) => setPremium({ siteLabel })} />
        <TextArea label="Texto que abre ao tocar no botão" value={p.about} maxLength={1000} onChange={(about) => setPremium({ about })} />
        <TextField label="Ou um link para o botão (usado se o texto acima estiver vazio)" type="url" value={p.siteUrl} maxLength={2000} onChange={(siteUrl) => setPremium({ siteUrl })} />
        {hint("Os ícones redondos ao lado são as suas redes e contatos: edite no Perfil (card no topo). Aparecem os 4 primeiros.")}
      </div>
    );
  }

  if (id === "premium:stats") {
    const block = doc.blocks.find((b) => b.type === "stats");
    const items = block?.items ?? [];
    const setItems = (next: { value: string; label: string }[]) =>
      onChange((d) => {
        const existing = d.blocks.find((b) => b.type === "stats");
        if (existing) return { ...d, blocks: d.blocks.map((b) => (b.id === existing.id && b.type === "stats" ? { ...b, enabled: true, items: next } : b)) };
        return { ...d, blocks: [...d.blocks, { id: `stats-${Date.now().toString(36)}`, enabled: true, type: "stats" as const, items: next }] };
      });
    return (
      <div className="flex flex-col gap-3">
        {items.slice(0, 3).map((item, index) => (
          <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
            <TextField label="Número" value={item.value} maxLength={20} onChange={(value) => setItems(items.map((it, i) => (i === index ? { ...it, value } : it)))} />
            <TextField label="Descrição" value={item.label} maxLength={60} onChange={(label) => setItems(items.map((it, i) => (i === index ? { ...it, label } : it)))} />
            <button type="button" onClick={() => setItems(items.filter((_, i) => i !== index))} className="pb-2 text-xs text-red-500">
              ✕
            </button>
          </div>
        ))}
        {items.length < 3 ? (
          <button type="button" onClick={() => setItems([...items, { value: "", label: "" }])} className={addRow}>
            + Adicionar número
          </button>
        ) : null}
        {hint("Até 3 números (ex.: 8 anos · de experiência). Sem nenhum, a faixa não aparece.")}
      </div>
    );
  }

  if (id === "premium:hours") {
    const days = p.hours;
    const setDay = (index: number, patch: Partial<(typeof days)[number]>) => setPremium({ hours: days.map((day, i) => (i === index ? { ...day, ...patch } : day)) });
    return (
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Título" value={p.sectionTitle} maxLength={60} onChange={(sectionTitle) => setPremium({ sectionTitle })} />
          <TextField label="Texto à direita (ex.: 08h às 18h)" value={p.promoNote} maxLength={80} onChange={(promoNote) => setPremium({ promoNote })} />
        </div>
        {days.map((day, index) => (
          <div key={index} className="flex flex-col gap-2 rounded-lg bg-stone-50 p-2.5">
            <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
              <TextField label="Dia" value={day.label} maxLength={12} onChange={(label) => setDay(index, { label })} />
              <TextField label="Horário" value={day.time} maxLength={20} onChange={(time) => setDay(index, { time })} />
              <button type="button" onClick={() => setPremium({ hours: days.filter((_, i) => i !== index) })} className="pb-2 text-xs text-red-500">
                ✕
              </button>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              <Toggle label="Em destaque" checked={day.highlight} onChange={(highlight) => setDay(index, { highlight })} />
              <Toggle label="Fechado (fica apagado)" checked={day.closed} onChange={(closed) => setDay(index, { closed })} />
            </div>
          </div>
        ))}
        {days.length < 7 ? (
          <button type="button" onClick={() => setPremium({ hours: [...days, { label: "", time: "", highlight: false, closed: false }] })} className={addRow}>
            + Adicionar dia
          </button>
        ) : null}
        {hint("É só informativo: o agendamento acontece pelo botão de agendar.")}
      </div>
    );
  }

  if (id === "premium:promo") {
    return (
      <div className="flex flex-col gap-3">
        <TextField label="Texto do botão (ex.: Agendar consulta)" value={p.promoButton} maxLength={30} onChange={(promoButton) => setPremium({ promoButton })} />
        <TextField label="Link do agendamento (WhatsApp, agenda online…)" type="url" value={p.promoUrl} maxLength={2000} onChange={(promoUrl) => setPremium({ promoUrl })} />
        {hint("Para WhatsApp use https://wa.me/55 + DDD + número. O botão do fim da página usa este mesmo link.")}
      </div>
    );
  }

  if (id === "premium:text") {
    return (
      <div className="flex flex-col gap-3">
        <TextArea label="Título (uma linha por trecho; a última fica em negrito)" value={p.heading} maxLength={240} onChange={(heading) => setPremium({ heading })} />
        {hint("Cada serviço é um bloco Produto (em Blocos, logo abaixo): título, preço (opcional), descrição curta e link. Preencher a Etiqueta deixa o cartão em destaque escuro.")}
      </div>
    );
  }

  // premium:feature
  return (
    <div className="flex flex-col gap-3">
      <TextField label="Nome do local (ex.: Clínica Vida — Sala 204)" value={p.featureLabel} maxLength={60} onChange={(featureLabel) => setPremium({ featureLabel })} />
      <TextField label="Endereço" value={p.featureTitle} maxLength={100} onChange={(featureTitle) => setPremium({ featureTitle })} />
      <TextField label="Link do mapa" type="url" value={p.featureUrl} maxLength={2000} onChange={(featureUrl) => setPremium({ featureUrl })} />
      <TextField label="Texto do botão do fim da página (vazio = sem botão)" value={p.contactLabel} maxLength={60} onChange={(contactLabel) => setPremium({ contactLabel })} />
      {hint("Os links desta parte são os blocos Link (em Blocos, logo abaixo).")}
    </div>
  );
}

// Editing controls of the "site" family: one card per part, the same for
// every design of the family. An empty field simply isn't drawn on the page.
function SiteFields({ id, doc, onChange, setPremium }: { id: string; doc: PageDoc; onChange: DocChange; setPremium: (patch: Patch<PageDoc["premium"]>) => void }) {
  const p = doc.premium;
  const hint = (text: string) => <p className="text-xs text-stone-500">{text}</p>;
  const addRow = "self-start rounded-lg border border-dashed border-stone-300 px-3 py-1.5 text-sm text-stone-600";
  const linkHint = hint("Para WhatsApp use https://wa.me/55 + DDD + número.");

  if (id === "premium:hero") {
    const slide = p.heroSlides[0] ?? { imageUrl: "", headline: "", productLabel: "", productName: "", priceFrom: "", price: "", url: "" };
    const setSlide = (patch: Partial<typeof slide>) => setPremium((cur) => ({ heroSlides: cur.heroSlides.length ? cur.heroSlides.map((s, i) => (i === 0 ? { ...s, ...patch } : s)) : [{ ...slide, ...patch }] }));
    return (
      <div className="flex flex-col gap-3">
        <TextField label="Foto da capa (link ou envie)" type="url" value={slide.imageUrl} placeholder="https://..." onChange={(imageUrl) => setSlide({ imageUrl })} />
        <UploadButton label="Enviar foto" onUploaded={(imageUrl) => setSlide({ imageUrl })} />
        <PositionControls doc={doc} setPremium={setPremium} />
        <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
          Altura da capa
          <input type="range" min={0} max={900} step={1} value={p.coverHeight} onChange={(e) => setPremium({ coverHeight: Number(e.target.value) })} />
          <span className="text-xs text-stone-500">{p.coverHeight ? `${p.coverHeight}px` : "Automático (padrão)"}</span>
        </label>
        <Toggle label="Mostrar o nome / marca" checked={!p.hideName} onChange={(on) => setPremium({ hideName: !on })} />
        <TextField label="Linha pequena da marca (ex.: RENTALS, BARBEARIA)" value={p.tagline} maxLength={120} onChange={(tagline) => setPremium({ tagline })} />
        <TextField label="Etiqueta acima do título" value={p.heroPill} maxLength={40} onChange={(heroPill) => setPremium({ heroPill })} />
        <TextArea label="Título (uma linha por trecho; a última fica em destaque)" value={p.heading} maxLength={240} onChange={(heading) => setPremium({ heading })} />
        {hint("O texto abaixo do título é a Bio, e o nome é o do Perfil (card no topo).")}
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Botão principal" value={p.promoButton} maxLength={30} onChange={(promoButton) => setPremium({ promoButton })} />
          <TextField label="Link do botão principal" type="url" value={p.promoUrl} maxLength={2000} onChange={(promoUrl) => setPremium({ promoUrl })} />
          <TextField label="Segundo botão" value={p.siteLabel} maxLength={40} onChange={(siteLabel) => setPremium({ siteLabel })} />
          <TextField label="Link do segundo botão" type="url" value={p.siteUrl} maxLength={2000} onChange={(siteUrl) => setPremium({ siteUrl })} />
        </div>
        {linkHint}
        <p className="text-sm font-medium text-stone-700">Cartão em destaque na capa</p>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Etiqueta" value={slide.productLabel} maxLength={20} onChange={(productLabel) => setSlide({ productLabel })} />
          <TextField label="Preço ou número" value={slide.price} maxLength={20} onChange={(price) => setSlide({ price })} />
        </div>
        <TextField label="Nome" value={slide.productName} maxLength={60} onChange={(productName) => setSlide({ productName })} />
        <TextField label="Link do cartão" type="url" value={slide.url} maxLength={2000} onChange={(url) => setSlide({ url })} />
        {hint("Deixe o nome vazio para não mostrar o cartão.")}
      </div>
    );
  }

  if (id === "premium:stats") {
    const block = doc.blocks.find((b) => b.type === "stats");
    const items = block?.items ?? [];
    const setItems = (next: { value: string; label: string }[]) =>
      onChange((d) => {
        const existing = d.blocks.find((b) => b.type === "stats");
        if (existing) return { ...d, blocks: d.blocks.map((b) => (b.id === existing.id && b.type === "stats" ? { ...b, enabled: true, items: next } : b)) };
        return { ...d, blocks: [...d.blocks, { id: `stats-${Date.now().toString(36)}`, enabled: true, type: "stats" as const, items: next }] };
      });
    return (
      <div className="flex flex-col gap-3">
        {items.slice(0, 4).map((item, index) => (
          <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
            <TextField label="Número" value={item.value} maxLength={20} onChange={(value) => setItems(items.map((it, i) => (i === index ? { ...it, value } : it)))} />
            <TextField label="Descrição" value={item.label} maxLength={60} onChange={(label) => setItems(items.map((it, i) => (i === index ? { ...it, label } : it)))} />
            <button type="button" onClick={() => setItems(items.filter((_, i) => i !== index))} className="pb-2 text-xs text-red-500">
              ✕
            </button>
          </div>
        ))}
        {items.length < 4 ? (
          <button type="button" onClick={() => setItems([...items, { value: "", label: "" }])} className={addRow}>
            + Adicionar número
          </button>
        ) : null}
        {hint("Até 4 números. Sem nenhum, esta parte não aparece.")}
      </div>
    );
  }

  if (id === "premium:nav") {
    const chips = p.navLinks;
    const setChip = (index: number, patch: Partial<(typeof chips)[number]>) => setPremium({ navLinks: chips.map((c, i) => (i === index ? { ...c, ...patch } : c)) });
    return (
      <div className="flex flex-col gap-3">
        <TextField label="Título das categorias" value={p.navTitle} maxLength={60} onChange={(navTitle) => setPremium({ navTitle })} />
        <p className="text-sm font-medium text-stone-700">Categorias (botões pequenos)</p>
        {chips.map((chip, index) => (
          <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
            <TextField label="Nome" value={chip.label} maxLength={20} onChange={(label) => setChip(index, { label })} />
            <TextField label="Link" type="url" value={chip.url} maxLength={2000} onChange={(url) => setChip(index, { url })} />
            <button type="button" onClick={() => setPremium({ navLinks: chips.filter((_, i) => i !== index) })} className="pb-2 text-xs text-red-500">
              ✕
            </button>
          </div>
        ))}
        {chips.length < 6 ? (
          <button type="button" onClick={() => setPremium({ navLinks: [...chips, { label: "", url: "" }] })} className={addRow}>
            + Adicionar categoria
          </button>
        ) : null}
        <ListField label="Faixa de palavras (parceiros, diferenciais…) — separe por vírgula, até 4" value={p.benefits} max={4} itemMax={30} onChange={(benefits) => setPremium({ benefits })} />
      </div>
    );
  }

  if (id === "premium:text") {
    return (
      <div className="flex flex-col gap-3">
        <TextField label="Etiqueta (ex.: Sobre nós)" value={p.sectionTitle} maxLength={60} onChange={(sectionTitle) => setPremium({ sectionTitle })} />
        <TextArea label="Título" value={p.aboutTitle} maxLength={240} onChange={(aboutTitle) => setPremium({ aboutTitle })} />
        <TextArea label="Texto" value={p.about} maxLength={1000} onChange={(about) => setPremium({ about })} />
        <TextField label="Imagem (link ou envie)" type="url" value={p.aboutImageUrl} placeholder="https://..." onChange={(aboutImageUrl) => setPremium({ aboutImageUrl })} />
        <UploadButton label="Enviar imagem" onUploaded={(aboutImageUrl) => setPremium({ aboutImageUrl })} />
        <TextArea label="Depoimento" value={p.quote} maxLength={200} onChange={(quote) => setPremium({ quote })} />
        <TextField label="Quem disse (nome · cargo)" value={p.credential} maxLength={80} onChange={(credential) => setPremium({ credential })} />
      </div>
    );
  }

  if (id === "premium:catalog") {
    return (
      <div className="flex flex-col gap-3">
        <TextField label="Etiqueta" value={p.catalogLabel} maxLength={60} onChange={(catalogLabel) => setPremium({ catalogLabel })} />
        <TextArea label="Título (uma linha por trecho)" value={p.catalogTitle} maxLength={160} onChange={(catalogTitle) => setPremium({ catalogTitle })} />
        {hint("Cada item da vitrine é um bloco Produto (em Blocos, logo abaixo): foto, etiqueta, título, descrição, preço e link. Adicione, apague e arraste por lá.")}
      </div>
    );
  }

  if (id === "premium:feature") {
    return (
      <div className="flex flex-col gap-3">
        <TextField label="Imagem (link ou envie)" type="url" value={p.featureImageUrl} placeholder="https://..." onChange={(featureImageUrl) => setPremium({ featureImageUrl })} />
        <UploadButton label="Enviar imagem" onUploaded={(featureImageUrl) => setPremium({ featureImageUrl })} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Etiqueta pequena" value={p.promoBadge} maxLength={80} onChange={(promoBadge) => setPremium({ promoBadge })} />
          <TextField label="Número grande (ex.: 20% Off)" value={p.promoDiscount} maxLength={20} onChange={(promoDiscount) => setPremium({ promoDiscount })} />
        </div>
        <TextField label="Linha acima do título" value={p.featureLabel} maxLength={60} onChange={(featureLabel) => setPremium({ featureLabel })} />
        <TextArea label="Título" value={p.featureTitle} maxLength={100} onChange={(featureTitle) => setPremium({ featureTitle })} />
        <TextField label="Texto" value={p.promoNote} maxLength={80} onChange={(promoNote) => setPremium({ promoNote })} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Texto do botão" value={p.contactLabel} maxLength={60} onChange={(contactLabel) => setPremium({ contactLabel })} />
          <TextField label="Link" type="url" value={p.featureUrl} maxLength={2000} onChange={(featureUrl) => setPremium({ featureUrl })} />
        </div>
      </div>
    );
  }

  if (id === "premium:links") {
    return (
      <div className="flex flex-col gap-3">
        <TextField label="Etiqueta" value={p.linksLabel} maxLength={60} onChange={(linksLabel) => setPremium({ linksLabel })} />
        <TextArea label="Título (uma linha por trecho)" value={p.linksTitle} maxLength={160} onChange={(linksTitle) => setPremium({ linksTitle })} />
        {hint("Cada linha da lista é um bloco Link (em Blocos, logo abaixo): título, subtítulo, etiqueta, imagem e link.")}
      </div>
    );
  }

  if (id === "premium:hours") {
    const days = p.hours;
    const setDay = (index: number, patch: Partial<(typeof days)[number]>) => setPremium({ hours: days.map((day, i) => (i === index ? { ...day, ...patch } : day)) });
    return (
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Título" value={p.hoursTitle} maxLength={80} onChange={(hoursTitle) => setPremium({ hoursTitle })} />
          <TextField label="Texto ao lado" value={p.hoursNote} maxLength={80} onChange={(hoursNote) => setPremium({ hoursNote })} />
        </div>
        {days.map((day, index) => (
          <div key={index} className="flex flex-col gap-2 rounded-lg bg-stone-50 p-2.5">
            <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
              <TextField label="Dia ou horário" value={day.label} maxLength={12} onChange={(label) => setDay(index, { label })} />
              <TextField label="Detalhe" value={day.time} maxLength={20} onChange={(time) => setDay(index, { time })} />
              <button type="button" onClick={() => setPremium({ hours: days.filter((_, i) => i !== index) })} className="pb-2 text-xs text-red-500">
                ✕
              </button>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              <Toggle label="Em destaque" checked={day.highlight} onChange={(highlight) => setDay(index, { highlight })} />
              <Toggle label="Fechado (fica apagado)" checked={day.closed} onChange={(closed) => setDay(index, { closed })} />
            </div>
          </div>
        ))}
        {days.length < 7 ? (
          <button type="button" onClick={() => setPremium({ hours: [...days, { label: "", time: "", highlight: false, closed: false }] })} className={addRow}>
            + Adicionar horário
          </button>
        ) : null}
        {hint("É só informativo. Sem nenhum horário, esta parte não aparece.")}
      </div>
    );
  }

  // premium:promo — the closing call
  return (
    <div className="flex flex-col gap-3">
      <TextArea label="Título" value={p.ctaTitle} maxLength={160} onChange={(ctaTitle) => setPremium({ ctaTitle })} />
      <TextArea label="Texto" value={p.ctaText} maxLength={300} onChange={(ctaText) => setPremium({ ctaText })} />
      <TextField label="Texto do botão" value={p.ctaButton} maxLength={40} onChange={(ctaButton) => setPremium({ ctaButton })} />
      {hint("O botão usa o mesmo link do botão principal da capa.")}
      <TextField label="Texto do rodapé (vazio = nome e ano)" value={p.footer} maxLength={80} onChange={(footer) => setPremium({ footer })} />
    </div>
  );
}

// Renders the editing controls for one premium section. Reuses exactly the
// fields that used to live in the Aparência tab, so behavior is unchanged.
export function PremiumSectionBody({ id, doc, onChange, plan }: { id: string; doc: PageDoc; onChange: DocChange; plan?: string }) {
  const design = doc.theme.premium as Design;
  const setTheme = (patch: Patch<Theme>) => onChange((d) => ({ ...d, theme: applyPatch(d.theme, patch) }));
  const setPremium = (patch: Patch<PageDoc["premium"]>) => onChange((d) => ({ ...d, premium: applyPatch(d.premium, patch) }));

  if (isSite(design) && id !== "premium:colors") return <SiteFields id={id} doc={doc} onChange={onChange} setPremium={setPremium} />;
  if (design === "clinic" && id !== "premium:colors") return <ClinicFields id={id} doc={doc} onChange={onChange} setPremium={setPremium} />;
  switch (id) {
    case "premium:colors":
      return <ColorInputs doc={doc} setTheme={setTheme} />;
    case "premium:hero":
      return <HeroFields doc={doc} setPremium={setPremium} design={design} />;
    case "premium:promo":
      return <PromoFields doc={doc} setPremium={setPremium} design={design} />;
    case "premium:feature":
      return <FeatureFields doc={doc} setPremium={setPremium} design={design} />;
    case "premium:size":
      return <SizeFields doc={doc} setPremium={setPremium} />;
    case "premium:nav":
      return <NavFields doc={doc} setPremium={setPremium} plan={plan} />;
    case "premium:cover":
      return <CoverPosition doc={doc} setPremium={setPremium} />;
    case "premium:text":
      return <TextSection doc={doc} onChange={onChange} setPremium={setPremium} />;
    case "premium:header":
      return (
        <div className="flex flex-col gap-3">
          <Choice
            label="Topo da página"
            value={doc.premium.header}
            options={{ logo: "Logo", name: "Nome", none: "Nada" }}
            onChange={(header) => setPremium({ header })}
          />
          <TextField
            label="Logo (link da imagem) — use no modo Logo"
            type="url"
            value={doc.profile.logo}
            placeholder="https://..."
            onChange={(logo) => onChange({ ...doc, profile: { ...doc.profile, logo } })}
          />
        </div>
      );
    case "premium:site":
      return (
        <div className="flex flex-col gap-3">
          <TextField label="Texto do botão do site" value={doc.premium.siteLabel} maxLength={40} onChange={(siteLabel) => setPremium({ siteLabel })} />
          <TextField label="Endereço do botão do site" type="url" value={doc.premium.siteUrl} maxLength={2000} onChange={(siteUrl) => setPremium({ siteUrl })} />
        </div>
      );
    case "premium:legal":
      return (
        <div className="flex flex-col gap-3">
          <TextField label="Link da Política de Privacidade" type="url" value={doc.premium.privacyUrl} maxLength={2000} onChange={(privacyUrl) => setPremium({ privacyUrl })} />
          <TextField label="Link dos Termos de Uso" type="url" value={doc.premium.termsUrl} maxLength={2000} onChange={(termsUrl) => setPremium({ termsUrl })} />
        </div>
      );
    default:
      // Unknown section for this design (shouldn't happen). Render nothing.
      void design;
      return null;
  }
}

// One collapsible card for a premium section (used in the Aparência tab).
function PremiumSectionCard({
  id,
  label,
  summary,
  open,
  onToggleOpen,
  doc,
  onChange,
  plan,
  dragHandle,
}: {
  id: string;
  label: string;
  summary: string;
  open: boolean;
  onToggleOpen: () => void;
  doc: PageDoc;
  onChange: DocChange;
  plan?: string;
  dragHandle?: ReactNode;
}) {
  const parts = doc.premium.hiddenParts;
  const hidden = parts.includes(id);
  // Only offer "Visível" where the design really hides that part; elsewhere the
  // checkbox would do nothing. (Today only Bistrô supports hiding parts.)
  const canHide = (HIDEABLE[doc.theme.premium] ?? []).includes(id);
  const toggleVisible = () =>
    onChange((d) => {
      const current = d.premium.hiddenParts;
      const isHidden = current.includes(id);
      return { ...d, premium: { ...d.premium, hiddenParts: isHidden ? current.filter((x) => x !== id) : [...current, id] } };
    });

  return (
    <div
      id={`blk-${id}`}
      className={`scroll-mt-24 rounded-xl bg-white ring-1 transition ${open ? "ring-2 ring-blue-500" : "ring-stone-200"}`}
    >
      <div className="flex items-center gap-2 p-3">
        {dragHandle}
        <button type="button" onClick={onToggleOpen} className="min-w-0 flex-1 text-left">
          <span className="block text-xs text-stone-400">Parte do modelo</span>
          <span className={`block truncate font-medium ${hidden ? "text-stone-400 line-through" : ""}`}>{label}</span>
          {summary ? <span className="block truncate text-xs text-stone-500">{summary}</span> : null}
        </button>
        {canHide ? (
          <button
            type="button"
            role="switch"
            aria-checked={!hidden}
            aria-label="Mostrar na página"
            onClick={toggleVisible}
            className={`flex h-[22px] w-[38px] shrink-0 items-center rounded-full p-0.5 transition-colors ${!hidden ? "justify-end bg-stone-900" : "justify-start bg-[#D9D6CE]"}`}
          >
            <span className="h-[18px] w-[18px] rounded-full bg-white" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onToggleOpen}
          aria-label={open ? "Fechar" : "Abrir"}
          aria-expanded={open}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-600 transition-colors hover:bg-[#F3F2EE] hover:text-stone-900"
        >
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>
      </div>
      {open ? (
        <div className="border-t border-stone-100 p-4">
          <PremiumSectionBody id={id} doc={doc} onChange={onChange} plan={plan} />
        </div>
      ) : null}
    </div>
  );
}

// A draggable wrapper around a section card (for designs that support
// reordering their parts), with a grip handle on the left.
function SortableSectionCard(props: {
  id: string;
  label: string;
  summary: string;
  open: boolean;
  onToggleOpen: () => void;
  doc: PageDoc;
  onChange: DocChange;
  plan?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.id });
  const handle = (
    <button
      type="button"
      {...attributes}
      {...listeners}
      aria-label="Arrastar para reordenar"
      className="cursor-grab touch-none rounded-md p-1 text-stone-300 transition-colors hover:text-stone-600 active:cursor-grabbing"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
        <circle cx="9" cy="6" r="1.6" />
        <circle cx="15" cy="6" r="1.6" />
        <circle cx="9" cy="12" r="1.6" />
        <circle cx="15" cy="12" r="1.6" />
        <circle cx="9" cy="18" r="1.6" />
        <circle cx="15" cy="18" r="1.6" />
      </svg>
    </button>
  );
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }}>
      <PremiumSectionCard {...props} dragHandle={handle} />
    </div>
  );
}

// The whole "Partes do modelo" editor shown in the Aparência tab for a premium
// model: every section as a card, plus an exit action. Opens/scrolls to the
// card named by `focus` (set when an area is clicked in the preview).
export function PremiumSectionsEditor({
  doc,
  onChange,
  focus,
  onActive,
  plan,
}: {
  doc: PageDoc;
  onChange: DocChange;
  focus?: { id: string; n: number } | null;
  onActive?: (id: string | null) => void;
  plan?: string;
}) {
  const design = doc.theme.premium as Design;
  // "Cores do modelo" is shown as its own card next to the profile (see
  // PremiumColorsCard / BlocksPanel), so it's excluded from this list.
  const baseSections = getPremiumSections(design).filter((s) => s.id !== "premium:colors");
  // Only designs whose render reads premium.partOrder can be reordered.
  const canReorder = REORDERABLE_DESIGNS.includes(design);
  const order = doc.premium.partOrder;
  const sections =
    canReorder && order.length
      ? [...baseSections].sort((a, b) => {
          const ia = order.indexOf(a.id);
          const ib = order.indexOf(b.id);
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        })
      : baseSections;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const ids = sections.map((s) => s.id);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    onChange((d) => ({ ...d, premium: { ...d.premium, partOrder: arrayMove(ids, from, to) } }));
  };
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!focus) return;
    setOpenId(focus.id);
    const timer = window.setTimeout(() => {
      document.getElementById(`blk-${focus.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [focus]);

  // Highlight the matching premium area in the preview while a card is open.
  useEffect(() => {
    onActive?.(openId);
    return () => onActive?.(null);
  }, [openId, onActive]);

  return (
    <div className="flex flex-col gap-3">
      {/* Scroll target used when a premium area is clicked in the preview. */}
      <div id="blk-premium:__group" className="scroll-mt-24" />
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-stone-500">Partes do modelo</p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Sair do modelo premium? A página volta ao layout simples, com seus blocos e seu perfil. Nada vai ao ar até você publicar.")) {
              onChange((d) => ({ ...d, theme: { ...d.theme, premium: "" } }));
            }
          }}
          className="text-xs text-stone-500 underline"
        >
          Sair do modelo
        </button>
      </div>
      {canReorder ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {sections.map((section) => (
              <SortableSectionCard
                key={section.id}
                id={section.id}
                label={section.label}
                summary={premiumSectionSummary(section.id, doc)}
                open={openId === section.id}
                onToggleOpen={() => setOpenId(openId === section.id ? null : section.id)}
                doc={doc}
                onChange={onChange}
                plan={plan}
              />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        sections.map((section) => (
          <PremiumSectionCard
            key={section.id}
            id={section.id}
            label={section.label}
            summary={premiumSectionSummary(section.id, doc)}
            open={openId === section.id}
            onToggleOpen={() => setOpenId(openId === section.id ? null : section.id)}
            doc={doc}
            onChange={onChange}
            plan={plan}
          />
        ))
      )}
    </div>
  );
}

// "Cores do modelo" as its own collapsible card, shown next to the profile
// (BlocksPanel) instead of inside the "Partes do modelo" list.
export function PremiumColorsCard({ doc, onChange, plan }: { doc: PageDoc; onChange: DocChange; plan?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <PremiumSectionCard
      id="premium:colors"
      label="Cores do modelo"
      summary={premiumSectionSummary("premium:colors", doc)}
      open={open}
      onToggleOpen={() => setOpen((v) => !v)}
      doc={doc}
      onChange={onChange}
      plan={plan}
    />
  );
}
