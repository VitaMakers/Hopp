"use client";

import { THEME_PRESETS } from "@/lib/page/catalog";
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
};

function PremiumPanel({ doc, onChange }: PanelProps) {
  const design = doc.theme.premium as Exclude<Theme["premium"], "">;
  const setTheme = (patch: Partial<Theme>) => onChange({ ...doc, theme: { ...doc.theme, ...patch } });
  const setPremium = (patch: Partial<PageDoc["premium"]>) => onChange({ ...doc, premium: { ...doc.premium, ...patch } });
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
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
              Posição da foto (vertical)
              <input type="range" min={0} max={100} value={doc.premium.coverY} onChange={(event) => setPremium({ coverY: Number(event.target.value) })} />
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
        <button type="button" onClick={() => setTheme({ premium: "" })} className="self-start text-sm text-stone-500 underline">
          Sair do modelo e usar o visual normal
        </button>
      </Card>
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
