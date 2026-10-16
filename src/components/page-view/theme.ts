import type { CSSProperties } from "react";
import { safeHttpUrl } from "@/lib/handles";
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

// Cards, images and embeds follow the button shape, but a pill-shaped card
// would turn into an oval, so they stop at a moderate rounding.
const BOX_RADII: Record<Theme["buttonShape"], string> = {
  square: "4px",
  rounded: "14px",
  pill: "24px",
};

export const AVATAR_RADII: Record<Theme["avatarShape"], string> = {
  circle: "rounded-full",
  rounded: "rounded-3xl",
  square: "rounded-md",
};

export function themeVars(theme: Theme): CSSProperties {
  return {
    "--page-bg": theme.background,
    "--page-text": theme.text,
    "--btn-bg": theme.buttonBackground,
    "--btn-text": theme.buttonText,
    "--btn-radius": RADII[theme.buttonShape],
    "--box-radius": BOX_RADII[theme.buttonShape],
    fontFamily: FONT_STACKS[theme.font],
    ...pageBackground(theme),
  } as CSSProperties;
}

// The solid colour always stays as the fallback under a gradient or image.
function pageBackground(theme: Theme): CSSProperties {
  if (theme.backgroundType === "gradient") {
    return { backgroundImage: `linear-gradient(160deg, ${theme.background}, ${theme.background2})` };
  }
  const image = theme.backgroundType === "image" ? safeHttpUrl(theme.backgroundImageUrl) : null;
  // safeHttpUrl returns a serialised URL, where quotes are percent-encoded.
  if (image) return { backgroundImage: `url("${image}")`, backgroundSize: "cover", backgroundPosition: "center" };
  return {};
}

export function buttonClass(theme: Theme): string {
  const base =
    "block w-full px-5 py-3.5 text-center font-medium rounded-[var(--btn-radius)] transition-transform hover:scale-[1.015] active:scale-[0.99]";
  const shadow = theme.buttonShadow ? " shadow-[0_6px_18px_-6px_rgba(0,0,0,0.35)]" : "";
  switch (theme.buttonStyle) {
    case "fill":
      return `${base}${shadow} bg-[var(--btn-bg)] text-[var(--btn-text)]`;
    case "outline":
      return `${base}${shadow} border-2 border-[var(--btn-bg)] text-[var(--page-text)]`;
    case "soft":
      return `${base}${shadow} bg-[color-mix(in_srgb,var(--btn-bg)_16%,transparent)] text-[var(--page-text)]`;
  }
}
