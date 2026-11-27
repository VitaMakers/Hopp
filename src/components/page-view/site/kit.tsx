"use client";

import type { CSSProperties, ReactNode } from "react";
import type { Block, PageDoc } from "@/lib/page/schema";
import { imageSrc, linkHref, socialHref } from "@/lib/page/links";
import { SOCIAL_LABELS } from "@/lib/page/constants";
import { SocialIcon } from "../SocialIcon";
import { track } from "../track";
import { BlockLink } from "../PremiumView";

// Shared toolkit of the "site" family (landing-style premium models). Every
// design gets the same content (SiteCtx) and only decides how to draw it, so
// all of them are edited, hidden and reordered by the same editor cards.

export const SITE_PARTS = ["premium:hero", "premium:stats", "premium:nav", "premium:text", "premium:catalog", "premium:feature", "premium:links", "premium:hours", "premium:promo"];

type ProductBlock = Extract<Block, { type: "product" }>;
type LinkBlock = Extract<Block, { type: "link" }>;
type Action = { label: string; href: string | null };

export type SiteCtx = {
  doc: PageDoc;
  handle?: string;
  // Brand name (profile name) and the small line that goes with it.
  brand: string;
  brandSub: string;
  logo: string;
  hero: {
    photo: string;
    // object-position chosen in the editor; spread it on the cover <img>.
    photoStyle: CSSProperties;
    // Cover height chosen in the editor (undefined = the design's own).
    coverStyle: CSSProperties | undefined;
    showName: boolean;
    pill: string;
    // Title lines (the editor splits by line break).
    lines: string[];
    sub: string;
    cta: Action;
    cta2: Action;
    // Small floating card on the cover (highlighted item).
    card: { label: string; name: string; price: string; href: string | null };
  };
  stats: { value: string; label: string }[];
  // Short chips / categories and a strip of short words (partners, benefits).
  chipsTitle: string;
  chips: Action[];
  strip: string[];
  about: { label: string; title: string; body: string; image: string; quote: string; author: string };
  catalog: { label: string; title: string; items: ProductBlock[] };
  feature: { image: string; tag: string; big: string; label: string; title: string; text: string; button: string; href: string | null };
  links: { label: string; title: string; items: LinkBlock[] };
  hours: { title: string; note: string; days: { label: string; time: string; highlight: boolean; closed: boolean }[] };
  final: { title: string; text: string; button: string; href: string | null };
  socials: { platform: PageDoc["socials"][number]["platform"]; href: string }[];
  footerText: string;
};

// What a design returns: one node per part (null/undefined = nothing to draw)
// plus its own footer. Keys are the part names without the "premium:" prefix.
export type SiteNodes = Partial<Record<"hero" | "stats" | "nav" | "text" | "catalog" | "feature" | "links" | "hours" | "promo" | "footer", ReactNode>>;
export type SiteRender = (c: SiteCtx) => SiteNodes;

const img = (src: string) => imageSrc(src) ?? "";
const lines = (text: string) => text.split("\n").map((s) => s.trim()).filter(Boolean);
const visible = <T extends Block["type"]>(doc: PageDoc, type: T) => doc.blocks.filter((b): b is Extract<Block, { type: T }> => b.enabled && b.type === type);

export function buildSiteCtx(doc: PageDoc, handle: string | undefined, brand: string): SiteCtx {
  const p = doc.premium;
  const slide = p.heroSlides[0];
  const t = (s: string) => s.trim();
  return {
    doc,
    handle,
    brand,
    brandSub: t(p.tagline),
    logo: img(doc.profile.logo),
    hero: {
      photo: img(slide?.imageUrl || doc.profile.coverUrl),
      photoStyle: { objectPosition: `${p.heroPosX}% ${p.heroPosY}%` },
      coverStyle: p.coverHeight ? { height: p.coverHeight, minHeight: 0 } : undefined,
      showName: !p.hideName,
      pill: t(p.heroPill),
      lines: lines(p.heading),
      sub: t(doc.profile.bio),
      cta: { label: t(p.promoButton), href: linkHref(p.promoUrl) },
      cta2: { label: t(p.siteLabel), href: linkHref(p.siteUrl) },
      card: { label: t(slide?.productLabel ?? ""), name: t(slide?.productName ?? ""), price: t(slide?.price ?? ""), href: linkHref(slide?.url ?? "") },
    },
    stats: (visible(doc, "stats")[0]?.items ?? []).filter((i) => t(i.value) || t(i.label)).slice(0, 4),
    chipsTitle: t(p.navTitle),
    chips: p.navLinks.filter((n) => t(n.label)).map((n) => ({ label: t(n.label), href: linkHref(n.url) })),
    strip: p.benefits.map(t).filter(Boolean),
    about: { label: t(p.sectionTitle), title: t(p.aboutTitle), body: t(p.about), image: img(p.aboutImageUrl), quote: t(p.quote), author: t(p.credential) },
    catalog: { label: t(p.catalogLabel), title: t(p.catalogTitle), items: visible(doc, "product") },
    feature: { image: img(p.featureImageUrl), tag: t(p.promoBadge), big: t(p.promoDiscount), label: t(p.featureLabel), title: t(p.featureTitle), text: t(p.promoNote), button: t(p.contactLabel), href: linkHref(p.featureUrl) },
    links: { label: t(p.linksLabel), title: t(p.linksTitle), items: visible(doc, "link") },
    hours: { title: t(p.hoursTitle), note: t(p.hoursNote), days: p.hours.filter((d) => t(d.label)) },
    final: { title: t(p.ctaTitle), text: t(p.ctaText), button: t(p.ctaButton), href: linkHref(p.promoUrl) },
    socials: doc.socials.map((s) => ({ platform: s.platform, href: socialHref(s) })).filter((s): s is { platform: PageDoc["socials"][number]["platform"]; href: string } => !!s.href),
    footerText: t(p.footer),
  };
}

// A button/link that is not a block (cover buttons, feature button…). Draws
// nothing when it has no label. `id` names the click in the page statistics.
export function Act({ c, to, id, className, children }: { c: SiteCtx; to: Action | { label: string; href: string | null }; id: string; className?: string; children?: ReactNode }) {
  if (!to.label) return null;
  return (
    <a
      className={className}
      href={to.href ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => (to.href ? track(c.handle, { kind: "block_click", blockId: id, target: to.href }) : e.preventDefault())}
    >
      {children ?? to.label}
    </a>
  );
}

// A product or link block as a clickable element (counts the click and, in the
// editor, opens that block).
export function Item({ c, block, className, style, children }: { c: SiteCtx; block: ProductBlock | LinkBlock; className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <BlockLink block={block} handle={c.handle} href={linkHref(block.url)} className={className} style={style}>
      {children}
    </BlockLink>
  );
}

// Image that fills its box (the box sets the size). Nothing when empty.
export function Img({ src, alt = "", className, style }: { src: string; alt?: string; className?: string; style?: CSSProperties }) {
  const url = imageSrc(src);
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src={url} alt={alt} loading="lazy" style={style} />;
}

// Title lines; the last one gets `accent` (when there is more than one).
export function Lines({ lines: list, accent = "ac" }: { lines: string[]; accent?: string }) {
  return (
    <>
      {list.map((line, i) => (
        <span key={i} className={i === list.length - 1 && list.length > 1 ? accent : undefined} style={{ display: "block" }}>
          {line}
        </span>
      ))}
    </>
  );
}

// Splits a one-field title by line break (titles of the inner parts).
export const split = lines;

export function Socials({ c, className, max = 5 }: { c: SiteCtx; className?: string; max?: number }) {
  if (!c.socials.length) return null;
  return (
    <nav className={className} aria-label="Redes sociais">
      {c.socials.slice(0, max).map((s) => (
        <a key={`${s.platform}-${s.href}`} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={SOCIAL_LABELS[s.platform]} onClick={() => track(c.handle, { kind: "social_click", target: s.platform })}>
          <SocialIcon platform={s.platform} />
        </a>
      ))}
    </nav>
  );
}

const icon = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, width: "1em", height: "1em", "aria-hidden": true };
export const ArrowRight = () => <svg {...icon}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
export const ArrowUp = () => <svg {...icon}><path d="M7 17 17 7M9 7h8v8" /></svg>;
export const Chevron = () => <svg {...icon}><path d="m9 6 6 6-6 6" /></svg>;
export const Pin = () => <svg {...icon}><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>;
export const Star = () => <svg {...icon} fill="currentColor" stroke="none"><path d="m12 3 2.7 5.8 6.3.800-4.6 4.4 1.2 6.300L12 17.2 6.4 20.300l1.2-6.300L3 9.600l6.3-.800z" /></svg>;
export const Play = () => <svg {...icon} fill="currentColor" stroke="none"><path d="M8 5v14l11-7z" /></svg>;
export const Heart = () => <svg {...icon}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.600A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>;
export const Cart = () => <svg {...icon}><path d="M3 4h2l2.4 11h10.200L20 7H6.5" /><circle cx="9" cy="19" r="1.4" /><circle cx="17" cy="19" r="1.4" /></svg>;
export const Calendar = () => <svg {...icon}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M8 3v4M16 3v4" /></svg>;
export const Clock = () => <svg {...icon}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
export const Check = () => <svg {...icon}><path d="m5 12 5 5 9-10" /></svg>;
export const Menu = () => <svg {...icon}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
// A neutral icon per position, for rows of numbers / benefits.
export function StatIcon({ index }: { index: number }) {
  const paths = [
    <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    <><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5.500a3 3 0 0 1 0 5.500M17.5 14.500c2 .900 3.5 3 3.5 5.5" /></>,
    <path key="s" d="m12 3 2.7 5.8 6.3.800-4.6 4.4 1.2 6.300L12 17.2 6.4 20.300l1.2-6.300L3 9.600l6.3-.800z" />,
    <><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  ];
  return <svg {...icon}>{paths[index % paths.length]}</svg>;
}
