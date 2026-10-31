"use client";

import { THEME_PRESETS } from "@/lib/page/catalog";
import { imageSrc } from "@/lib/page/links";
import type { PageDoc, Theme } from "@/lib/page/schema";
import { Card, TextArea, TextField, Toggle } from "./fields";

type PanelProps = { doc: PageDoc; onChange: (doc: PageDoc) => void };

const LAYOUT_LABELS: Record<Theme["layout"], string> = {
  classic: "Clássico",
  cover: "Com capa",
  card: "Cartão",
  hero: "Foto grande",
  name: "Só o nome",
  poster: "Capa com nome",
  blank: "Sem cabeçalho",
  band: "Faixas coloridas",
  cutout: "Recorte",
  fullscreen: "Tela cheia",
  portrait: "Retrato",
  capacheia: "Capa cheia (sem texto)",
};
const BACKGROUND_LABELS: Record<Theme["backgroundType"], string> = { solid: "Cor", gradient: "Degradê", image: "Imagem" };
const AVATAR_LABELS: Record<Theme["avatarShape"], string> = { circle: "Redonda", rounded: "Arredondada", square: "Quadrada" };
const SOCIAL_STYLE_LABELS: Record<Theme["socialStyle"], string> = { icons: "Ícones", pills: "Nomes" };
const FONT_LABELS: Record<Theme["font"], string> = {
  sans: "Moderna",
  serif: "Clássica",
  mono: "Máquina",
  rounded: "Arredondada",
  elegant: "Elegante",
  condensed: "Impacto",
  tech: "Técnica",
};
const SHAPE_LABELS: Record<Theme["buttonShape"], string> = { square: "Reto", rounded: "Arredondado", pill: "Pílula" };
const STYLE_LABELS: Record<Theme["buttonStyle"], string> = { fill: "Preenchido", outline: "Contorno", soft: "Suave" };
const COLOR_LABELS = {
  background: "Fundo",
  background2: "Fundo (2ª cor)",
  text: "Texto",
  buttonBackground: "Botão",
  buttonText: "Texto do botão",
  accent: "Destaque",
} as const;

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

const PREMIUM_NAMES: Record<Exclude<Theme["premium"], "">, string> = {
  authority: "Autoridade",
  spotlight: "Presença",
  ecosystem: "Ecossistema",
  catalog: "Vitrine",
  experience: "Presença Profissional",
  store: "Loja / Black Friday",
  lookbook: "Lookbook",
  mosaic: "Mosaico",
  dropz: "Drop Único",
  promo: "Banner Promo",
};

function PremiumPanel({ doc, onChange }: PanelProps) {
  const design = doc.theme.premium as Exclude<Theme["premium"], "">;
  const setTheme = (patch: Partial<Theme>) => onChange({ ...doc, theme: { ...doc.theme, ...patch } });
  const setPremium = (patch: Partial<PageDoc["premium"]>) => onChange({ ...doc, premium: { ...doc.premium, ...patch } });
  const coverSrc = imageSrc(doc.profile.coverUrl);
  const coverPos = `${doc.premium.coverX}% ${doc.premium.coverY}%`;
  const colors: [keyof Theme, string][] = [
    ["background", "Fundo"],
    ["text", "Texto"],
    ["accent", "Destaque"],
  ];
  return (
    <div className="flex flex-col gap-4">
      <Card title={`Modelo premium: ${PREMIUM_NAMES[design]}`}>
        <p className="-mt-2 text-sm text-stone-500">
          Este modelo tem visual próprio. Os links, produtos e números ficam na aba Blocos; o nome, a bio e a foto de capa, na aba
          Perfil.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {colors
            .filter(([key]) => design !== "authority" || key !== "accent")
            .map(([key, label]) => (
              <label key={key} className="flex flex-col gap-1 text-sm font-medium text-stone-700">
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
        {design === "authority" ? (
          <TextField label="Nome no rodapé (opcional)" value={doc.premium.footer} maxLength={80} onChange={(footer) => setPremium({ footer })} />
        ) : null}
        {design === "spotlight" || design === "ecosystem" ? (
          <>
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
          </>
        ) : null}
        {design === "spotlight" ? (
          <>
            <TextField label="Texto do botão do site" value={doc.premium.siteLabel} maxLength={40} onChange={(siteLabel) => setPremium({ siteLabel })} />
            <TextField label="Endereço do botão do site" type="url" value={doc.premium.siteUrl} maxLength={2000} onChange={(siteUrl) => setPremium({ siteUrl })} />
            <TextField label="Link da Política de Privacidade" type="url" value={doc.premium.privacyUrl} maxLength={2000} onChange={(privacyUrl) => setPremium({ privacyUrl })} />
            <TextField label="Link dos Termos de Uso" type="url" value={doc.premium.termsUrl} maxLength={2000} onChange={(termsUrl) => setPremium({ termsUrl })} />
          </>
        ) : null}
        {design === "spotlight" || design === "ecosystem" ? (
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
              Posição da foto (horizontal)
              <input type="range" min={0} max={100} value={doc.premium.coverX} onChange={(event) => setPremium({ coverX: Number(event.target.value) })} />
              <div className="mt-1 aspect-video w-full overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-200">
                {coverSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverSrc}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{ objectPosition: coverPos }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-stone-400">
                    Defina a capa em Perfil
                  </div>
                )}
              </div>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
              Posição da foto (vertical)
              <input type="range" min={0} max={100} value={doc.premium.coverY} onChange={(event) => setPremium({ coverY: Number(event.target.value) })} />
              <div className="mt-1 aspect-[3/4] w-full overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-200">
                {coverSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverSrc}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{ objectPosition: coverPos }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-stone-400">
                    Defina a capa em Perfil
                  </div>
                )}
              </div>
            </label>
          </div>
        ) : null}
        {design === "ecosystem" ? (
          <>
            <TextField label="Título da seção" value={doc.premium.sectionTitle} maxLength={60} onChange={(sectionTitle) => setPremium({ sectionTitle })} />
            <TextArea label="Frase de destaque" value={doc.premium.quote} maxLength={200} onChange={(quote) => setPremium({ quote })} />
            <TextArea label="Texto sobre você" value={doc.premium.about} maxLength={1000} onChange={(about) => setPremium({ about })} />
            <p className="text-xs text-stone-500">
              Na aba Blocos: o bloco Números vira os indicadores; links em Cartão viram projetos, em Banner viram a chamada em destaque e em
              Botão viram o link do site.
            </p>
          </>
        ) : null}
        {design === "catalog" ? (
          <>
            <TextArea label="Título principal (uma linha por trecho; a última fica em destaque)" value={doc.premium.heading} maxLength={240} onChange={(heading) => setPremium({ heading })} />
            <TextField label="Texto do contato" value={doc.premium.contactLabel} maxLength={60} onChange={(contactLabel) => setPremium({ contactLabel })} />
            <TextField label="E-mail de contato (opcional)" type="email" value={doc.premium.email} maxLength={120} onChange={(email) => setPremium({ email })} />
            <p className="text-xs text-stone-500">O número do WhatsApp fica em Perfil → WhatsApp flutuante.</p>
          </>
        ) : null}
        {design === "experience" ? (
          <>
            <TextField
              label="Logo / assinatura (link da imagem) — fica sobre a capa"
              type="url"
              value={doc.profile.logo}
              placeholder="https://..."
              onChange={(logo) => onChange({ ...doc, profile: { ...doc.profile, logo } })}
            />
            <TextField label="Frase de posicionamento" value={doc.premium.tagline} maxLength={120} onChange={(tagline) => setPremium({ tagline })} />
            <TextField label="Registro / credencial (ex.: CRO 00000)" value={doc.premium.credential} maxLength={80} onChange={(credential) => setPremium({ credential })} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Aba 1 (público)" value={doc.premium.audienceA} maxLength={40} onChange={(audienceA) => setPremium({ audienceA })} />
              <TextField label="Aba 2 (público)" value={doc.premium.audienceB} maxLength={40} onChange={(audienceB) => setPremium({ audienceB })} />
            </div>
            <p className="text-xs text-stone-500">
              A capa (foto ou vídeo) e o WhatsApp ficam em Perfil. Os números vêm do bloco Números. Na aba Blocos, cada bloco pode aparecer
              para todos, só na Aba 1 ou só na Aba 2.
            </p>
          </>
        ) : null}
        {design === "store" || design === "lookbook" || design === "mosaic" || design === "dropz" || design === "promo" ? <StoreFields doc={doc} setPremium={setPremium} /> : null}
        <button type="button" onClick={() => setTheme({ premium: "" })} className="self-start text-sm text-stone-500 underline">
          Sair do modelo e usar o visual normal
        </button>
      </Card>
    </div>
  );
}

function StoreFields({ doc, setPremium }: { doc: PageDoc; setPremium: (patch: Partial<PageDoc["premium"]>) => void }) {
  const p = doc.premium;
  const slides = p.heroSlides;
  const setSlide = (index: number, patch: Partial<(typeof slides)[number]>) =>
    setPremium({ heroSlides: slides.map((slide, i) => (i === index ? { ...slide, ...patch } : slide)) });
  const addSlide = () =>
    setPremium({ heroSlides: [...slides, { imageUrl: "", headline: "", productLabel: "NA TELA", productName: "", priceFrom: "", price: "", url: "" }] });
  const removeSlide = (index: number) => setPremium({ heroSlides: slides.filter((_, i) => i !== index) });
  // Comma-separated list <-> string[] helper.
  const list = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  const nav = p.navLinks;
  const setNav = (index: number, patch: Partial<(typeof nav)[number]>) =>
    setPremium({ navLinks: nav.map((item, i) => (i === index ? { ...item, ...patch } : item)) });

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-stone-200 p-3">
      <p className="text-sm font-semibold">Destaque (carrossel)</p>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Texto do selo (canto superior)" value={p.heroPill} maxLength={40} onChange={(heroPill) => setPremium({ heroPill })} />
        <TextField label="Link do selo" type="url" value={p.heroPillUrl} maxLength={2000} onChange={(heroPillUrl) => setPremium({ heroPillUrl })} />
      </div>
      {slides.map((slide, index) => (
        <div key={index} className="flex flex-col gap-2 rounded-lg bg-stone-50 p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Slide {index + 1}</span>
            <button type="button" onClick={() => removeSlide(index)} className="text-xs text-red-500">
              Remover
            </button>
          </div>
          <TextField label="Imagem (link)" type="url" value={slide.imageUrl} placeholder="https://..." onChange={(imageUrl) => setSlide(index, { imageUrl })} />
          <TextField label="Título (use Enter para quebrar a linha)" value={slide.headline} maxLength={80} onChange={(headline) => setSlide(index, { headline })} />
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Rótulo do produto" value={slide.productLabel} maxLength={20} onChange={(productLabel) => setSlide(index, { productLabel })} />
            <TextField label="Nome do produto" value={slide.productName} maxLength={60} onChange={(productName) => setSlide(index, { productName })} />
            <TextField label="Preço de (riscado)" value={slide.priceFrom} maxLength={20} onChange={(priceFrom) => setSlide(index, { priceFrom })} />
            <TextField label="Preço por" value={slide.price} maxLength={20} onChange={(price) => setSlide(index, { price })} />
          </div>
          <TextField label="Link do produto" type="url" value={slide.url} maxLength={2000} onChange={(url) => setSlide(index, { url })} />
        </div>
      ))}
      {slides.length < 6 ? (
        <button type="button" onClick={addSlide} className="self-start rounded-lg border border-dashed border-stone-300 px-3 py-1.5 text-sm text-stone-600">
          + Adicionar slide
        </button>
      ) : null}

      <p className="text-sm font-semibold">Cartão de oferta</p>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Selo" value={p.promoBadge} maxLength={30} onChange={(promoBadge) => setPremium({ promoBadge })} />
        <TextField label="Desconto (ex.: 15% OFF)" value={p.promoDiscount} maxLength={20} onChange={(promoDiscount) => setPremium({ promoDiscount })} />
        <TextField label="Texto do botão" value={p.promoButton} maxLength={30} onChange={(promoButton) => setPremium({ promoButton })} />
        <TextField label="Código do cupom (ao tocar, copia)" value={p.promoCode} maxLength={30} onChange={(promoCode) => setPremium({ promoCode })} />
      </div>
      <TextField label="Observação" value={p.promoNote} maxLength={80} onChange={(promoNote) => setPremium({ promoNote })} />
      <TextField label="Link do botão (usado só se não houver cupom)" type="url" value={p.promoUrl} maxLength={2000} onChange={(promoUrl) => setPremium({ promoUrl })} />
      <TextField label="Vantagens (separe por vírgula)" value={p.benefits.join(", ")} onChange={(value) => setPremium({ benefits: list(value).slice(0, 4) })} />

      <p className="text-sm font-semibold">Cartão de novidade</p>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Rótulo" value={p.featureLabel} maxLength={30} onChange={(featureLabel) => setPremium({ featureLabel })} />
        <TextField label="Título" value={p.featureTitle} maxLength={40} onChange={(featureTitle) => setPremium({ featureTitle })} />
      </div>
      <TextField label="Imagem (link)" type="url" value={p.featureImageUrl} placeholder="https://..." onChange={(featureImageUrl) => setPremium({ featureImageUrl })} />
      <TextField label="Link" type="url" value={p.featureUrl} maxLength={2000} onChange={(featureUrl) => setPremium({ featureUrl })} />
      <TextField label="Etiquetas (separe por vírgula)" value={p.featureTags.join(", ")} onChange={(value) => setPremium({ featureTags: list(value).slice(0, 5) })} />
      <TextField label="Cores em destaque (hex, separe por vírgula)" value={p.featureColors.join(", ")} onChange={(value) => setPremium({ featureColors: list(value).slice(0, 8) })} />

      <p className="text-sm font-semibold">Cartão de tamanho</p>
      <TextField label="Título" value={p.sizeTitle} maxLength={60} onChange={(sizeTitle) => setPremium({ sizeTitle })} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Tamanhos (separe por vírgula)" value={p.sizes.join(", ")} onChange={(value) => setPremium({ sizes: list(value).slice(0, 10) })} />
        <TextField label="Tamanho em destaque" value={p.sizeActive} maxLength={6} onChange={(sizeActive) => setPremium({ sizeActive })} />
      </div>
      <TextField label="Imagem (link, opcional)" type="url" value={p.sizeImageUrl} placeholder="https://..." onChange={(sizeImageUrl) => setPremium({ sizeImageUrl })} />

      <p className="text-sm font-semibold">Rodapé (links)</p>
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

      <p className="text-xs text-stone-500">
        Os produtos da grade (2 colunas) vêm dos blocos do tipo <strong>Produto</strong> na aba Blocos — a imagem, o nome, as etiquetas (no
        campo &quot;rótulo&quot;, separadas por · ou vírgula) e o botão. O WhatsApp vem do Perfil.
      </p>
    </div>
  );
}

export function ThemePanel({ doc, onChange }: PanelProps) {
  const setTheme = (patch: Partial<Theme>) => onChange({ ...doc, theme: { ...doc.theme, ...patch } });
  if (doc.theme.premium) return <PremiumPanel doc={doc} onChange={onChange} />;
  return (
    <div className="flex flex-col gap-4">
      <Card title="Temas prontos">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => setTheme(preset.theme)}
              className="overflow-hidden rounded-xl text-left ring-1 ring-stone-200 hover:ring-stone-400"
            >
              <div
                className="flex h-20 flex-col items-center justify-center gap-1.5 p-3"
                style={{
                  background:
                    preset.theme.backgroundType === "gradient"
                      ? `linear-gradient(160deg, ${preset.theme.background}, ${preset.theme.background2})`
                      : preset.theme.background,
                }}
              >
                <span className="h-2.5 w-3/4 rounded-full" style={{ background: preset.theme.buttonBackground }} />
                <span className="h-2.5 w-3/4 rounded-full" style={{ background: preset.theme.buttonBackground }} />
              </div>
              <span className="block px-3 py-2 text-sm">{preset.name}</span>
            </button>
          ))}
        </div>
      </Card>
      <Card title="Personalizar">
        <Choice label="Layout" value={doc.theme.layout} options={LAYOUT_LABELS} onChange={(layout) => setTheme({ layout })} />
        {doc.theme.layout === "cover" ? <p className="-mt-2 text-xs text-stone-500">A capa é a imagem definida em Perfil.</p> : null}
        {doc.theme.layout === "hero" ? <p className="-mt-2 text-xs text-stone-500">Usa a sua foto do Perfil grande no topo.</p> : null}
        <Choice label="Foto do perfil" value={doc.theme.avatarShape} options={AVATAR_LABELS} onChange={(avatarShape) => setTheme({ avatarShape })} />
        <Choice label="Redes sociais" value={doc.theme.socialStyle} options={SOCIAL_STYLE_LABELS} onChange={(socialStyle) => setTheme({ socialStyle })} />
        <Choice label="Fundo" value={doc.theme.backgroundType} options={BACKGROUND_LABELS} onChange={(backgroundType) => setTheme({ backgroundType })} />
        {doc.theme.backgroundType === "image" ? (
          <TextField
            label="Imagem de fundo (link)"
            type="url"
            value={doc.theme.backgroundImageUrl}
            maxLength={1000}
            placeholder="https://..."
            onChange={(backgroundImageUrl) => setTheme({ backgroundImageUrl })}
          />
        ) : null}
        <Choice label="Fonte" value={doc.theme.font} options={FONT_LABELS} onChange={(font) => setTheme({ font })} />
        <Choice
          label="Fonte dos títulos"
          value={doc.theme.headingFont}
          options={{ same: "Igual ao texto", ...FONT_LABELS }}
          onChange={(headingFont) => setTheme({ headingFont })}
        />
        <Choice label="Formato do botão" value={doc.theme.buttonShape} options={SHAPE_LABELS} onChange={(buttonShape) => setTheme({ buttonShape })} />
        <Choice label="Estilo do botão" value={doc.theme.buttonStyle} options={STYLE_LABELS} onChange={(buttonStyle) => setTheme({ buttonStyle })} />
        <Toggle label="Sombra nos botões" checked={doc.theme.buttonShadow} onChange={(buttonShadow) => setTheme({ buttonShadow })} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.keys(COLOR_LABELS) as (keyof typeof COLOR_LABELS)[])
            .filter((key) => key !== "background2" || doc.theme.backgroundType === "gradient")
            .map((key) => (
            <label key={key} className="flex flex-col gap-1 text-sm font-medium text-stone-700">
              {COLOR_LABELS[key]}
              <input
                type="color"
                value={doc.theme[key]}
                onChange={(event) => setTheme({ [key]: event.target.value })}
                className="h-10 w-full cursor-pointer rounded-lg ring-1 ring-stone-300"
              />
            </label>
          ))}
        </div>
      </Card>
    </div>
  );
}
