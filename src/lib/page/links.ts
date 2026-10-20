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

// wa.me wants digits only, with country code. A number typed without "+"
// and with 10 or 11 digits (DDD + number, as Brazilians write it) gets 55.
export function whatsappHref(phone: string, message: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (!phone.trim().startsWith("+") && (digits.length === 10 || digits.length === 11)) digits = `55${digits}`;
  if (digits.length < 10 || digits.length > 15) return null;
  const text = message.trim();
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function mapsEmbedUrl(address: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

export function mapsDirectionsUrl(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

// vCard 3.0, which both iPhone and Android contacts import.
export function vCard(contact: { name: string; company: string; phone: string; email: string }): string {
  const esc = (value: string) => value.trim().replace(/\\/g, "\\\\").replace(/\r?\n/g, " ").replace(/([,;])/g, "\\$1");
  const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${esc(contact.name)}`, `N:${esc(contact.name)};;;;`];
  if (contact.company.trim()) lines.push(`ORG:${esc(contact.company)}`);
  if (contact.phone.trim()) lines.push(`TEL;TYPE=CELL:${contact.phone.replace(/[^\d+]/g, "")}`);
  if (contact.email.trim()) lines.push(`EMAIL:${esc(contact.email)}`);
  lines.push("END:VCARD");
  return lines.join("\r\n") + "\r\n";
}

export function imageSrc(url: string): string | null {
  const value = url.trim();
  // Example images shipped with the app (placeholder logos, etc.).
  if (/^\/assets\/[A-Za-z0-9._-]+$/.test(value)) return value;
  return safeHttpUrl(value);
}
