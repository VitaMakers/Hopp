"use client";

import { useEffect, useState } from "react";
import { imageSrc } from "@/lib/page/links";
import type { PageDoc, Theme } from "@/lib/page/schema";
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
    default:
      // store, lookbook, mosaic, dropz, promo, menu
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
  menu: ["premium:nav"],
  bar: ["premium:promo", "premium:nav", "premium:feature"],
  bistro: ["premium:hero", "premium:feature", "premium:text", "premium:nav"],
};

// A short line shown under the card title while it is collapsed.
export function premiumSectionSummary(id: string, doc: PageDoc): string {
  const p = doc.premium;
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
  return (
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
  );
}

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
            step={20}
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

// Renders the editing controls for one premium section. Reuses exactly the
// fields that used to live in the Aparência tab, so behavior is unchanged.
export function PremiumSectionBody({ id, doc, onChange, plan }: { id: string; doc: PageDoc; onChange: DocChange; plan?: string }) {
  const design = doc.theme.premium as Design;
  const setTheme = (patch: Patch<Theme>) => onChange((d) => ({ ...d, theme: applyPatch(d.theme, patch) }));
  const setPremium = (patch: Patch<PageDoc["premium"]>) => onChange((d) => ({ ...d, premium: applyPatch(d.premium, patch) }));

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
}: {
  id: string;
  label: string;
  summary: string;
  open: boolean;
  onToggleOpen: () => void;
  doc: PageDoc;
  onChange: DocChange;
  plan?: string;
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
        <button type="button" onClick={onToggleOpen} className="min-w-0 flex-1 text-left">
          <span className="block text-xs text-stone-400">Parte do modelo</span>
          <span className={`block truncate font-medium ${hidden ? "text-stone-400 line-through" : ""}`}>{label}</span>
          {summary ? <span className="block truncate text-xs text-stone-500">{summary}</span> : null}
        </button>
        {canHide ? (
          <label className="flex items-center gap-1 text-xs text-stone-500">
            <input type="checkbox" checked={!hidden} onChange={toggleVisible} />
            Visível
          </label>
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
  const sections = getPremiumSections(design).filter((s) => s.id !== "premium:colors");
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
      {sections.map((section) => (
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
      ))}
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
