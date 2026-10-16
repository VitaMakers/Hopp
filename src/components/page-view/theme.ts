import type { CSSProperties } from "react";
import type { Theme } from "@/lib/page/schema";

const FONT_STACKS: Record<Theme["font"], string> = {
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  serif: 'ui-serif, Georgia, "Times New Roman", serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  rounded: 'ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif',
};

const RADII: Record<Theme["buttonShape"], string> = {
  square: "4px",
  rounded: "14px",
  pill: "999px",
};

export function themeVars(theme: Theme): CSSProperties {
  return {
    "--page-bg": theme.background,
    "--page-text": theme.text,
    "--btn-bg": theme.buttonBackground,
    "--btn-text": theme.buttonText,
    "--btn-radius": RADII[theme.buttonShape],
    fontFamily: FONT_STACKS[theme.font],
  } as CSSProperties;
}

export function buttonClass(style: Theme["buttonStyle"]): string {
  const base =
    "block w-full px-5 py-3.5 text-center font-medium rounded-[var(--btn-radius)] transition-transform hover:scale-[1.015] active:scale-[0.99]";
  switch (style) {
    case "fill":
      return `${base} bg-[var(--btn-bg)] text-[var(--btn-text)]`;
    case "outline":
      return `${base} border-2 border-[var(--btn-bg)] text-[var(--page-text)]`;
    case "soft":
      return `${base} bg-[color-mix(in_srgb,var(--btn-bg)_16%,transparent)] text-[var(--page-text)]`;
  }
}
