import { nanoid } from "nanoid";
import type { Block, PageDoc } from "../schema";

// Helpers shared by the "site" family templates (src/lib/page/site/*.ts).
export const uid = () => nanoid(10);
export const photo = (id: string, width = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=85`;
export const WHATS = "https://wa.me/5511999990000";

export function product(f: { title: string; price?: string; description?: string; label?: string; imageUrl?: string; buttonText?: string; url?: string }): Block {
  return { id: uid(), enabled: true, type: "product", payWithStripe: false, amountCents: 0, label: "", description: "", price: "", imageUrl: "", buttonText: "", url: WHATS, ...f };
}

export function link(f: { title: string; subtitle?: string; label?: string; imageUrl?: string; url?: string }): Block {
  return { id: uid(), enabled: true, type: "link", imageUrl: "", highlight: false, display: "button", label: "", subtitle: "", buttonText: "", accent: "", buttonColor: "", icon: "", bannerShade: true, imagePosY: 50, url: WHATS, ...f };
}

export const stats = (items: [string, string][]): Block => ({ id: uid(), enabled: true, type: "stats", items: items.map(([value, label]) => ({ value, label })) });

export const slide = (imageUrl: string, card: { productLabel?: string; productName?: string; price?: string; url?: string } = {}) => [
  { imageUrl, headline: "", productLabel: "", productName: "", priceFrom: "", price: "", url: "", ...card },
];

// What each design file exports: the gallery card and the sample page.
export type SiteTemplate = {
  design: string;
  id: string;
  name: string;
  category: string;
  description: string;
  theme: { background: string; text: string; accent: string };
  bio: string;
  socials?: PageDoc["socials"];
  premium: Partial<PageDoc["premium"]>;
  blocks: () => Block[];
};
