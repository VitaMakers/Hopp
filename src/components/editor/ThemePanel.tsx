"use client";

import { THEME_PRESETS } from "@/lib/page/catalog";
import type { PageDoc, Theme } from "@/lib/page/schema";
import { Card, TextField, Toggle } from "./fields";

type PanelProps = { doc: PageDoc; onChange: (doc: PageDoc) => void };

const LAYOUT_LABELS: Record<Theme["layout"], string> = {
  classic: "Clássico",
  cover: "Com capa",
  card: "Cartão",
  hero: "Foto grande",
};
const BACKGROUND_LABELS: Record<Theme["backgroundType"], string> = { solid: "Cor", gradient: "Degradê", image: "Imagem" };
const AVATAR_LABELS: Record<Theme["avatarShape"], string> = { circle: "Redonda", rounded: "Arredondada", square: "Quadrada" };
const SOCIAL_STYLE_LABELS: Record<Theme["socialStyle"], string> = { icons: "Ícones", pills: "Nomes" };
const FONT_LABELS: Record<Theme["font"], string> = {
  sans: "Moderna",
  serif: "Clássica",
  mono: "Máquina",
  rounded: "Arredondada",
};
const SHAPE_LABELS: Record<Theme["buttonShape"], string> = { square: "Reto", rounded: "Arredondado", pill: "Pílula" };
const STYLE_LABELS: Record<Theme["buttonStyle"], string> = { fill: "Preenchido", outline: "Contorno", soft: "Suave" };
const COLOR_LABELS = {
  background: "Fundo",
  background2: "Fundo (2ª cor)",
  text: "Texto",
  buttonBackground: "Botão",
  buttonText: "Texto do botão",
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

export function ThemePanel({ doc, onChange }: PanelProps) {
  const setTheme = (patch: Partial<Theme>) => onChange({ ...doc, theme: { ...doc.theme, ...patch } });
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
