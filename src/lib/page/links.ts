import { safeHttpUrl } from "@/lib/handles";
import type { SocialLink } from "./schema";

// Only http(s), mailto and tel ever reach an href, so a pasted
// "javascript:" URL can't run on a visitor's page.
export function socialHref({ platform, url }: SocialLink): string | null {
  const value = url.trim();
  if (!value) return null;
  if (platform === "email") {
    const address = value.replace(/^mailto:/i, "");
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) ? `mailto:${address}` : null;
  }
  if (platform === "whatsapp" && /^\+?[\d\s()-]{8,}$/.test(value)) {
    return `https://wa.me/${value.replace(/\D/g, "")}`;
  }
  return safeHttpUrl(value.includes("://") ? value : `https://${value}`);
}

export function linkHref(url: string): string | null {
  const value = url.trim();
  if (/^(mailto|tel):/i.test(value)) return value;
  return safeHttpUrl(value);
}
