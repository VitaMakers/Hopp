"use client";

import { useEffect, useState } from "react";
import { APP_NAME } from "@/lib/env";
import { showsBadge } from "@/lib/entitlements";
import type { Block, PageDoc } from "@/lib/page/schema";
import { SOCIAL_LABELS } from "@/lib/page/catalog";
import { youtubeEmbedUrl } from "@/lib/page/embed";
import { imageSrc, linkHref, socialHref, videoSrc, whatsappHref } from "@/lib/page/links";
import { SocialIcon } from "./SocialIcon";
import { track } from "./track";
import { VerifiedCheck } from "./VerifiedCheck";

// The four Vita premium designs. Each one mirrors the markup of the
// original template so src/app/premium.css styles it the same way.

type Props = { doc: PageDoc; handle?: string; plan?: string };

// The footer credit. Profissional keeps its own brand; every other plan
// carries the Virtú.bio name (same rule as the badge).
function footerOwner(plan: string | undefined, name: string, handle?: string): string {
  if (showsBadge(plan)) return APP_NAME;
  return name.trim() || handle || APP_NAME;
}
type LinkBlock = Extract<Block, { type: "link" }>;
type ProductBlock = Extract<Block, { type: "product" }>;

const year = new Date().getFullYear();

function visible<T extends Block["type"]>(doc: PageDoc, type: T) {
  return doc.blocks.filter((block): block is Extract<Block, { type: T }> => block.enabled && block.type === type);
}

function BlockLink({
  block,
  handle,
  href,
  className,
  children,
}: {
  block: { id: string; title: string };
  handle?: string;
  href: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={block.title}
      className={className}
      onClick={() => href && track(handle, { kind: "block_click", blockId: block.id, target: href })}
    >
      {children}
    </a>
  );
}

export function PremiumView({ doc, handle, plan }: Props) {
  const page = (() => {
    switch (doc.theme.premium) {
      case "authority":
        return <Authority doc={doc} handle={handle} plan={plan} />;
      case "spotlight":
        return <Spotlight doc={doc} handle={handle} plan={plan} />;
      case "ecosystem":
        return <Ecosystem doc={doc} handle={handle} plan={plan} />;
      case "catalog":
        return <Catalog doc={doc} handle={handle} plan={plan} />;
      case "experience":
        return <Experience doc={doc} handle={handle} plan={plan} />;
      case "store":
        return <Store doc={doc} handle={handle} plan={plan} />;
      case "lookbook":
        return <Lookbook doc={doc} handle={handle} plan={plan} />;
      case "mosaic":
        return <Mosaic doc={doc} handle={handle} plan={plan} />;
      case "dropz":
        return <Dropz doc={doc} handle={handle} plan={plan} />;
      default:
        return null;
    }
  })();
  return <div className="vita-page min-h-full">{page}</div>;
}

function Authority({ doc, handle, plan }: Props) {
  const { profile, theme, premium } = doc;
  return (
    <div
      className="vita-premium premium-authority"
      style={{ "--premium-bg": theme.background, "--premium-text": theme.text, "--premium-accent": theme.accent } as React.CSSProperties}
    >
      <header className="premium-profile">
        <h1>{profile.name || APP_NAME}{profile.verified ? <VerifiedCheck className="ml-1.5 inline h-[0.8em] w-[0.8em] align-middle" /> : null}</h1>
        {profile.bio ? <p>{profile.bio}</p> : null}
        <div className="premium-divider">LINKS</div>
      </header>
      <div className="premium-cards">
        {visible(doc, "link").map((block: LinkBlock) => {
          const image = imageSrc(block.imageUrl);
          return (
            <section
              key={block.id}
              className="premium-card"
              style={{ "--premium-accent": block.accent || theme.accent } as React.CSSProperties}
            >
              <BlockLink block={block} handle={handle} href={linkHref(block.url)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {image ? <img src={image} alt="" loading="lazy" /> : null}
                <div className="premium-card-shade" />
                <div className="premium-card-copy">
                  {block.label ? <span className="premium-category">{block.label}</span> : null}
                  <strong>{block.title}</strong>
                  <span className="premium-card-cta">
                    {block.buttonText || "Saiba mais"} <span aria-hidden="true">→</span>
                  </span>
                </div>
              </BlockLink>
            </section>
          );
        })}
      </div>
      <footer className="premium-footer">
        <strong>{premium.footer || profile.name || APP_NAME}</strong>
        <p>
          {footerOwner(plan, profile.name, handle)} · © {year}. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}

function Spotlight({ doc, handle, plan }: Props) {
  const { profile, theme, premium } = doc;
  const cover = imageSrc(profile.coverUrl);
  const site = linkHref(premium.siteUrl);
  const logo = imageSrc(profile.logo);
  const privacy = linkHref(premium.privacyUrl);
  const terms = linkHref(premium.termsUrl);
  const socials = doc.socials
    .map((social) => ({ social, href: socialHref(social) }))
    .filter((item): item is { social: (typeof doc.socials)[number]; href: string } => !!item.href);
  return (
    <div
      className="vita-premium premium-spotlight"
      style={{ "--spotlight-bg": theme.background, "--spotlight-text": theme.text, "--spotlight-accent": theme.accent, "--spotlight-cover-x": `${premium.coverX}%` } as React.CSSProperties}
    >
      <header className="spotlight-hero">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="spotlight-portrait" src={cover} alt="" style={{ objectPosition: `${premium.coverX}% ${premium.coverY}%` }} />
        ) : null}
        <div className="spotlight-hero-shade" />
        <div className="spotlight-identity">
          {premium.header === "none" ? null : premium.header === "logo" && logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="spotlight-logo" src={logo} alt={profile.name} />
          ) : (
            <h1>{profile.name || APP_NAME}{profile.verified ? <VerifiedCheck className="ml-1.5 inline h-[0.8em] w-[0.8em] align-middle" /> : null}</h1>
          )}
          <div className="spotlight-actions">
            <nav aria-label="Redes sociais">
              {socials.map(({ social, href }) => (
                <a
                  key={`${social.platform}-${href}`}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={SOCIAL_LABELS[social.platform]}
                  onClick={() => track(handle, { kind: "social_click", target: social.platform })}
                >
                  <SocialIcon platform={social.platform} />
                </a>
              ))}
            </nav>
            {site ? (
              <a
                className="spotlight-site"
                href={site}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track(handle, { kind: "social_click", target: "website" })}
              >
                {premium.siteLabel || "MEU SITE"}
              </a>
            ) : null}
          </div>
        </div>
      </header>
      <div className="spotlight-projects">
        {profile.bio ? <p className="spotlight-intro">{profile.bio}</p> : null}
        {visible(doc, "link").map((block: LinkBlock) => {
          const image = imageSrc(block.imageUrl);
          return (
            <section
              key={block.id}
              className="spotlight-project"
              style={{ "--spotlight-accent": block.accent || theme.accent } as React.CSSProperties}
            >
              <BlockLink block={block} handle={handle} href={linkHref(block.url)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {image ? <img src={image} alt="" loading="lazy" /> : null}
                <div className="spotlight-project-shade" />
                <div className="spotlight-project-copy">
                  {block.label ? <small>{block.label}</small> : null}
                  <strong>{block.title}</strong>
                  {block.buttonText ? <span>{block.buttonText} →</span> : null}
                </div>
              </BlockLink>
            </section>
          );
        })}
      </div>
      <footer className="spotlight-footer">
        <p>
          © {year} {footerOwner(plan, profile.name, handle)}. Todos os direitos reservados.
        </p>
        <nav aria-label="Informações legais">
          {privacy ? <a href={privacy}>Política de Privacidade</a> : null}
          {terms ? <a href={terms}>Termos e Condições de Uso</a> : null}
        </nav>
      </footer>
    </div>
  );
}

function Ecosystem({ doc, handle, plan }: Props) {
  const { profile, theme, premium } = doc;
  const cover = imageSrc(profile.coverUrl);
  const logo = imageSrc(profile.logo);
  const stats = visible(doc, "stats")[0]?.items.slice(0, 3) ?? [];
  return (
    <div className="vita-premium premium-ecosystem" style={{ "--eco-bg": theme.background, "--eco-text": theme.text, "--eco-accent": theme.accent } as React.CSSProperties}>
      <div className="ecosystem-inner">
        <header className="ecosystem-profile">
          <div className="ecosystem-portrait">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" style={{ objectPosition: `${premium.coverX}% ${premium.coverY}%` }} />
            ) : null}
            <div className="ecosystem-photo-shade" />
          </div>
          <div className="ecosystem-identity">
            {premium.header === "none" ? null : premium.header === "logo" && logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={profile.name} />
            ) : (
              <h1>{profile.name || APP_NAME}{profile.verified ? <VerifiedCheck className="ml-1.5 inline h-[0.8em] w-[0.8em] align-middle" /> : null}</h1>
            )}
            {profile.bio ? <p>{profile.bio}</p> : null}
          </div>
        </header>
        {stats.length ? (
          <section className="ecosystem-stats" aria-label="Indicadores de destaque">
            {stats.map((stat, index) => (
              <div key={index}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </section>
        ) : null}
        <section className="ecosystem-projects">
          <h2>{premium.sectionTitle || "ECOSSISTEMA"}</h2>
          {visible(doc, "link").map((block: LinkBlock) => {
            // Card: project. Banner: highlighted call. Button: plain site link.
            const role = block.display === "banner" ? "featured" : block.display === "button" ? "site" : "ecosystem";
            const logo = imageSrc(block.imageUrl);
            return (
              <article
                key={block.id}
                className={`ecosystem-card ecosystem-${role}`}
                style={{ "--eco-accent": block.accent || theme.accent } as React.CSSProperties}
              >
                <BlockLink block={block} handle={handle} href={linkHref(block.url)}>
                  {role === "ecosystem" ? (
                    <>
                      <span className="ecosystem-project-logo">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {logo ? <img src={logo} alt="" /> : <b>{block.label || "PROJETO"}</b>}
                      </span>
                      <span className="ecosystem-project-copy">
                        <strong>{block.title}</strong>
                        {block.subtitle ? <small>{block.subtitle}</small> : null}
                      </span>
                      <span className="ecosystem-arrow" aria-hidden="true">
                        ↗
                      </span>
                    </>
                  ) : role === "featured" ? (
                    <>
                      <span className="ecosystem-feature-label">{block.label || "DESTAQUE"}</span>
                      <strong>{block.title}</strong>
                      {block.subtitle ? <p>{block.subtitle}</p> : null}
                      {block.buttonText ? <span className="ecosystem-feature-cta">{block.buttonText} →</span> : null}
                    </>
                  ) : (
                    <>
                      <span>
                        <strong>{block.title}</strong>
                        {block.subtitle ? <small>{block.subtitle}</small> : null}
                      </span>
                      <span className="ecosystem-arrow" aria-hidden="true">
                        ↗
                      </span>
                    </>
                  )}
                </BlockLink>
              </article>
            );
          })}
        </section>
        <section className="ecosystem-closing">
          {premium.quote ? (
            <>
              <span className="ecosystem-quote-mark" aria-hidden="true">
                &ldquo;
              </span>
              <p className="ecosystem-quote">{premium.quote}</p>
            </>
          ) : null}
          {premium.about ? <p>{premium.about}</p> : null}
        </section>
        <footer className="ecosystem-footer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {premium.header !== "none" && logo ? <img src={logo} alt={profile.name} /> : <strong>{profile.name || APP_NAME}</strong>}
          <p>
            © {year} {footerOwner(plan, profile.name, handle)}. Todos os direitos reservados.
          </p>
        </footer>
      </div>
    </div>
  );
}

function Experience({ doc, handle }: Props) {
  const { profile, theme, premium } = doc;
  const [mode, setMode] = useState<"a" | "b">("a");
  const cover = imageSrc(profile.coverUrl);
  const coverVideo = videoSrc(profile.coverVideo);
  const logo = imageSrc(profile.logo);
  const stats = visible(doc, "stats")[0]?.items.slice(0, 3) ?? [];

  const inMode = (block: Block) =>
    block.enabled && block.type !== "stats" && (!block.audience || block.audience === "all" || block.audience === mode);
  // Group consecutive "card" links into a feature grid; everything else is a row.
  const rows: (Block | Block[])[] = [];
  for (const block of doc.blocks.filter(inMode)) {
    const isCard = block.type === "link" && block.display === "card";
    const last = rows[rows.length - 1];
    if (isCard && Array.isArray(last)) last.push(block);
    else rows.push(isCard ? [block] : block);
  }

  const toggle = (
    <div className="mt-4 flex gap-1 rounded-full bg-white/10 p-1 text-sm font-semibold">
      {(["a", "b"] as const).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => setMode(key)}
          className={`flex-1 rounded-full px-4 py-2 transition ${mode === key ? "bg-white text-black" : "text-white/70"}`}
        >
          {key === "a" ? premium.audienceA : premium.audienceB}
        </button>
      ))}
    </div>
  );

  return (
    <div className="premium-experience mx-auto min-h-full max-w-[480px] px-4 pb-10 pt-5" style={{ background: theme.background, color: theme.text }}>
      <header className="overflow-hidden rounded-[26px] bg-white/[0.04] ring-1 ring-white/10">
        <div className="relative aspect-[5/6] w-full bg-black">
          {coverVideo ? (
            <video src={coverVideo} poster={cover ?? undefined} controls playsInline className="h-full w-full object-cover" />
          ) : cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt={profile.name} className="h-full w-full object-cover" />
          ) : null}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-5 pb-4 text-center">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={profile.name} className="h-12 w-auto object-contain" />
            ) : (
              <h1 className="text-2xl font-bold">{profile.name || APP_NAME}</h1>
            )}
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-3 px-5 pt-3">
          {premium.tagline ? <p className="text-sm font-medium opacity-90">{premium.tagline}</p> : <span />}
          {premium.credential ? <span className="shrink-0 text-xs uppercase tracking-wide opacity-50">{premium.credential}</span> : null}
        </div>
        {stats.length ? (
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/10 px-5 py-4 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-2xl font-bold leading-none">{stat.value}</div>
                <div className="mt-1 text-[11px] leading-tight opacity-55">{stat.label}</div>
              </div>
            ))}
          </div>
        ) : null}
      </header>

      {toggle}

      <div className="mt-5 flex flex-col gap-4">
        {rows.map((row, index) => {
          if (Array.isArray(row)) {
            return (
              <div key={index} className="grid grid-cols-2 gap-3">
                {row.map((block) => {
                  const card = block as LinkBlock;
                  return (
                    <ExpItem key={card.id} block={card} handle={handle} href={linkHref(card.url)} className="block rounded-2xl bg-white/[0.06] p-4 text-left ring-1 ring-white/10">
                      {card.label ? <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: theme.accent }}>{card.label}</span> : null}
                      <p className="font-semibold leading-snug">{card.title}</p>
                      {card.subtitle ? <p className="mt-1 text-sm opacity-55">{card.subtitle}</p> : null}
                    </ExpItem>
                  );
                })}
              </div>
            );
          }
          return <ExpBlock key={row.id} block={row} handle={handle} accent={theme.accent} />;
        })}
      </div>
    </div>
  );
}

// One block inside the "experience" body (headline, text, video, banner or CTA).
function ExpBlock({ block, handle, accent }: { block: Block; handle?: string; accent: string }) {
  if (block.type === "heading") {
    return <h2 className="text-3xl font-bold leading-tight [font-family:var(--heading-font)]">{block.text}</h2>;
  }
  if (block.type === "text") {
    return <p className={`whitespace-pre-line ${block.style === "footer" ? "text-xs opacity-40" : "text-[15px] opacity-70"}`}>{block.text}</p>;
  }
  if (block.type === "youtube") {
    const src = youtubeEmbedUrl(block.url);
    return src ? <iframe src={src} title="Vídeo" className="aspect-video w-full rounded-2xl" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" /> : null;
  }
  if (block.type === "link") {
    const href = linkHref(block.url);
    const wa = /wa\.me|whatsapp/i.test(block.url);
    if (block.display === "banner") {
      const image = imageSrc(block.imageUrl);
      return (
        <ExpItem block={block} handle={handle} href={href} className="relative flex min-h-[150px] flex-col items-start justify-end overflow-hidden rounded-2xl p-5 text-left ring-1 ring-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {image ? <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" /> : null}
          <span className="absolute inset-0 bg-gradient-to-t from-black/85 to-black/20" />
          <span className="relative">
            {block.label ? <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: accent }}>{block.label}</span> : null}
            <span className="block text-xl font-bold">{block.title}</span>
            {block.buttonText ? <span className="mt-2 inline-block rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black">{block.buttonText}</span> : null}
          </span>
        </ExpItem>
      );
    }
    if (block.highlight) {
      // Primary CTA: a white pill.
      return (
        <ExpItem block={block} handle={handle} href={href} className="flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-center font-semibold text-black">
          {wa ? <SocialIcon platform="whatsapp" className="h-5 w-5" /> : null}
          {block.title}
        </ExpItem>
      );
    }
    // Secondary link: text with an arrow.
    return (
      <ExpItem block={block} handle={handle} href={href} className="flex items-center gap-1 text-sm font-semibold opacity-80">
        {block.title} <span aria-hidden="true">›</span>
      </ExpItem>
    );
  }
  return null;
}

function ExpItem({ block, handle, href, className, children }: { block: LinkBlock; handle?: string; href: string | null; className: string; children: React.ReactNode }) {
  return (
    <BlockLink block={block} handle={handle} href={href} className={className}>
      {children}
    </BlockLink>
  );
}

function Catalog({ doc, handle, plan }: Props) {
  const { profile, theme, premium } = doc;
  const lines = (premium.heading || "Conheça meus produtos").split("\n").filter(Boolean).slice(0, 6);
  const whatsapp = whatsappHref(profile.floatingWhatsapp, "");
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(premium.email) ? premium.email : "";
  return (
    <div
      className="vita-premium premium-catalog"
      style={
        {
          "--catalog-bg": theme.background,
          "--catalog-text": theme.text,
          "--catalog-accent": theme.accent,
        } as React.CSSProperties
      }
    >
      <div className="catalog-inner">
        <header className="catalog-header">
          <span className="catalog-brand">≠ {profile.name}</span>
          <h1>
            {lines.map((line, index) => (
              <span key={index} className={index === lines.length - 1 ? "catalog-highlight" : undefined}>
                {line}
              </span>
            ))}
          </h1>
          {profile.bio ? <p>{profile.bio}</p> : null}
        </header>
        <section className="catalog-products" aria-label="Produtos e serviços">
          {visible(doc, "product").map((block: ProductBlock) => {
            const href = linkHref(block.url);
            const image = imageSrc(block.imageUrl);
            return (
              <article key={block.id} className="catalog-product">
                {image ? (
                  <BlockLink block={block} handle={handle} href={href} className="catalog-product-image">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt={block.title} loading="lazy" />
                  </BlockLink>
                ) : null}
                <div className="catalog-product-body">
                  <div className="catalog-product-copy">
                    {block.label ? <span className="catalog-product-label">{block.label}</span> : null}
                    <h2>{block.title}</h2>
                    {block.description ? <p>{block.description}</p> : null}
                  </div>
                  <BlockLink block={block} handle={handle} href={href} className="catalog-product-cta">
                    {block.buttonText || "SAIBA MAIS"} →
                  </BlockLink>
                </div>
              </article>
            );
          })}
        </section>
        <footer className="catalog-footer">
          {whatsapp || email ? (
            <p>
              {whatsapp ? (
                <>
                  Dúvidas?{" "}
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                    Falar no WhatsApp
                  </a>
                </>
              ) : null}
              {whatsapp && email ? " · " : null}
              {email ? (
                <>
                  Contato: <a href={`mailto:${email}`}>{email}</a>
                </>
              ) : null}
            </p>
          ) : null}
          <p>
            © {footerOwner(plan, profile.name, handle)} · Todos os direitos reservados · {year}
          </p>
          {whatsapp ? <p>{premium.contactLabel || "Fale comigo"}</p> : null}
        </footer>
      </div>
      {whatsapp ? (
        <a
          className="catalog-contact-float"
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={premium.contactLabel || "Falar no WhatsApp"}
          onClick={() => track(handle, { kind: "social_click", target: "whatsapp" })}
        >
          <SocialIcon platform="whatsapp" />
        </a>
      ) : null}
    </div>
  );
}

/* ---------- Store (e-commerce / Black Friday) ---------- */
type PremiumFields = PageDoc["premium"];
type HeroSlide = PremiumFields["heroSlides"][number];

function Store({ doc, handle, plan }: Props) {
  const { profile, theme, premium } = doc;
  const brand = profile.name || APP_NAME;
  const products = visible(doc, "product");
  const whatsapp = whatsappHref(profile.floatingWhatsapp, "");
  return (
    <div
      className="vita-premium premium-store"
      style={
        {
          "--store-bg": theme.background,
          "--store-text": theme.text,
          "--store-accent": theme.accent,
        } as React.CSSProperties
      }
    >
      <div className="store-inner">
        <StoreHero slides={premium.heroSlides} brand={brand} verified={profile.verified} pill={premium.heroPill} pillUrl={premium.heroPillUrl} handle={handle} />
        <StorePromo premium={premium} brand={brand} handle={handle} />
        {premium.featureTitle || premium.featureImageUrl ? <StoreFeature premium={premium} handle={handle} /> : null}
        {products.length ? (
          <section className="store-grid" aria-label="Produtos">
            {products.map((block) => (
              <StoreProduct key={block.id} block={block} handle={handle} />
            ))}
          </section>
        ) : null}
        {whatsapp && (premium.sizes.length > 0 || premium.sizeTitle) ? <StoreSize premium={premium} whatsapp={whatsapp} handle={handle} /> : null}
        <footer className="store-footer">
          <span className="store-footer-brand">{brand}</span>
          {premium.navLinks.length ? (
            <nav className="store-nav">
              {premium.navLinks.map((item, index) =>
                item.label ? (
                  <a key={index} href={linkHref(item.url) ?? "#"} target="_blank" rel="noopener noreferrer">
                    {item.label}
                  </a>
                ) : null,
              )}
            </nav>
          ) : null}
          <small>© {footerOwner(plan, profile.name, handle)} · {year}</small>
        </footer>
      </div>
    </div>
  );
}

function StoreHero({
  slides,
  brand,
  verified,
  pill,
  pillUrl,
  handle,
}: {
  slides: HeroSlide[];
  brand: string;
  verified: boolean;
  pill: string;
  pillUrl: string;
  handle?: string;
}) {
  const [index, setIndex] = useState(0);
  const count = slides.length;
  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(() => setIndex((value) => (value + 1) % count), 3600);
    return () => clearInterval(timer);
  }, [count]);
  if (!count) return null;
  const active = Math.min(index, count - 1);
  return (
    <section className="store-hero">
      <div className="store-hero-track" style={{ transform: `translateX(-${active * 100}%)` }}>
        {slides.map((slide, slideIndex) => (
          <StoreSlide key={slideIndex} slide={slide} brand={brand} verified={verified} pill={pill} pillUrl={pillUrl} handle={handle} />
        ))}
      </div>
      {count > 1 ? (
        <div className="store-hero-bars" aria-hidden>
          {slides.map((_, barIndex) => (
            <button key={barIndex} type="button" className={barIndex === active ? "on" : ""} onClick={() => setIndex(barIndex)} aria-label={`Ver destaque ${barIndex + 1}`}>
              <span />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function StoreSlide({
  slide,
  brand,
  verified,
  pill,
  pillUrl,
  handle,
}: {
  slide: HeroSlide;
  brand: string;
  verified: boolean;
  pill: string;
  pillUrl: string;
  handle?: string;
}) {
  const href = linkHref(slide.url);
  const image = imageSrc(slide.imageUrl);
  const pillHref = linkHref(pillUrl) ?? href;
  const lines = (slide.headline || "").split("\n").filter(Boolean);
  const go = () => href && track(handle, { kind: "block_click", blockId: "hero", target: href });
  return (
    <div className="store-slide">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={slide.headline || slide.productName || brand} className="store-slide-img" loading="lazy" />
      ) : (
        <div className="store-slide-img store-slide-placeholder" />
      )}
      <div className="store-slide-shade" />
      <div className="store-slide-top">
        <span className="store-brandpill">
          {brand}
          {verified ? <VerifiedCheck className="ml-1 inline h-[0.85em] w-[0.85em] align-middle" /> : null}
        </span>
        {pill ? (
          <a className="store-toppill" href={pillHref ?? "#"} target="_blank" rel="noopener noreferrer">
            {pill} <span aria-hidden>›</span>
          </a>
        ) : null}
      </div>
      <div className="store-slide-bottom">
        {lines.length ? (
          <h2 className="store-slide-head">
            {lines.map((line, lineIndex) => (
              <span key={lineIndex}>{line}</span>
            ))}
          </h2>
        ) : null}
        {slide.productName || slide.price ? (
          <a className="store-slide-product" href={href ?? "#"} target="_blank" rel="noopener noreferrer" onClick={go}>
            {slide.productLabel ? <span className="store-prod-label">{slide.productLabel}</span> : null}
            <span className="store-prod-name">{slide.productName}</span>
            {slide.priceFrom ? <s className="store-prod-from">{slide.priceFrom}</s> : null}
            {slide.price ? <span className="store-prod-price">{slide.price}</span> : null}
            <span className="store-prod-arrow" aria-hidden>›</span>
          </a>
        ) : null}
      </div>
    </div>
  );
}

function StorePromo({ premium, brand, handle }: { premium: PremiumFields; brand: string; handle?: string }) {
  const href = linkHref(premium.promoUrl);
  const code = (premium.promoCode || "").trim();
  const match = (premium.promoDiscount || "").match(/^(\S+)\s*(.*)$/);
  const bigPart = match ? match[1] : premium.promoDiscount;
  const smallPart = match ? match[2] : "";
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  // No code: the button is a plain link to promoUrl (old behaviour).
  const activate = () => {
    track(handle, { kind: "block_click", blockId: "promo", target: code ? `cupom:${code}` : href ?? "promo" });
    setRevealed(true);
    try {
      navigator.clipboard?.writeText(code).then(
        () => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2500);
        },
        () => {},
      );
    } catch {
      /* clipboard may be blocked; the code still shows for manual copy */
    }
  };
  return (
    <section className="store-promo">
      <div className="store-promo-top">
        <div>
          {premium.promoBadge ? <span className="store-promo-badge">{premium.promoBadge}</span> : null}
          <p className="store-promo-discount">
            <strong>{bigPart}</strong>
            {smallPart ? <span>{smallPart}</span> : null}
          </p>
          {premium.promoNote ? <p className="store-promo-note">{premium.promoNote}</p> : null}
        </div>
        <div className="store-promo-right">
          <span className="store-promo-brand">{brand}</span>
          {code ? (
            <button type="button" className="store-promo-btn" onClick={activate}>
              {copied ? "Copiado!" : revealed ? "Copiar" : premium.promoButton || "ATIVAR"} <span aria-hidden>{copied ? "✓" : "→"}</span>
            </button>
          ) : (
            <a className="store-promo-btn" href={href ?? "#"} target="_blank" rel="noopener noreferrer" onClick={() => href && track(handle, { kind: "block_click", blockId: "promo", target: href })}>
              {premium.promoButton || "ATIVAR"} <span aria-hidden>→</span>
            </a>
          )}
        </div>
      </div>
      {code && revealed ? (
        <button type="button" className="store-coupon" onClick={activate} aria-label={`Copiar cupom ${code}`}>
          <span className="store-coupon-code">{code}</span>
          <span className="store-coupon-hint">{copied ? "✓ copiado" : "toque para copiar"}</span>
        </button>
      ) : null}
      {premium.benefits.length ? (
        <div className="store-promo-benefits">
          {premium.benefits.map((benefit, index) => (
            <span key={index}>{benefit}</span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function StoreFeature({ premium, handle }: { premium: PremiumFields; handle?: string }) {
  const image = imageSrc(premium.featureImageUrl);
  const href = linkHref(premium.featureUrl);
  const go = () => href && track(handle, { kind: "block_click", blockId: "feature", target: href });
  return (
    <a className="store-feature" href={href ?? "#"} target="_blank" rel="noopener noreferrer" onClick={go}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={premium.featureTitle} className="store-feature-img" loading="lazy" />
      ) : null}
      <div className="store-feature-body">
        {premium.featureLabel ? <span className="store-feature-label">{premium.featureLabel}</span> : null}
        {premium.featureTitle ? <h3>{premium.featureTitle}</h3> : null}
        {premium.featureTags.length ? (
          <div className="store-tags">
            {premium.featureTags.map((tag, index) => (
              <span key={index}>{tag}</span>
            ))}
          </div>
        ) : null}
        {premium.featureColors.length ? (
          <div className="store-swatches">
            {premium.featureColors.map((colorValue, index) => (
              <span key={index} style={{ background: colorValue }} />
            ))}
          </div>
        ) : null}
        <span className="store-feature-cta">Ver tudo <span aria-hidden>›</span></span>
      </div>
    </a>
  );
}

function StoreProduct({ block, handle }: { block: ProductBlock; handle?: string }) {
  const image = imageSrc(block.imageUrl);
  const href = linkHref(block.url);
  const tags = block.label
    ? block.label
        .split(/[·,|]/)
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];
  return (
    <article className="store-card">
      {image ? (
        <BlockLink block={block} handle={handle} href={href} className="store-card-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={block.title} loading="lazy" />
        </BlockLink>
      ) : null}
      <div className="store-card-body">
        <h3>{block.title}</h3>
        {tags.length ? (
          <div className="store-tags">
            {tags.map((tag, index) => (
              <span key={index}>{tag}</span>
            ))}
          </div>
        ) : null}
        <BlockLink block={block} handle={handle} href={href} className="store-card-cta">
          {block.buttonText || "Comprar"} <span aria-hidden>›</span>
        </BlockLink>
      </div>
    </article>
  );
}

function StoreSize({ premium, whatsapp, handle }: { premium: PremiumFields; whatsapp: string; handle?: string }) {
  const image = imageSrc(premium.sizeImageUrl);
  return (
    <section className="store-size">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="store-size-img" loading="lazy" />
      ) : null}
      <div className="store-size-body">
        <p>{premium.sizeTitle}</p>
        {premium.sizes.length ? (
          <div className="store-sizes">
            {premium.sizes.map((size, index) => (
              <span key={index} className={size === premium.sizeActive ? "on" : ""}>
                {size}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <a
        className="store-size-wa"
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        onClick={() => track(handle, { kind: "social_click", target: "whatsapp" })}
      >
        <SocialIcon platform="whatsapp" />
      </a>
    </section>
  );
}

/* ---------- Lookbook (editorial fashion drop) ---------- */
function Lookbook({ doc, handle, plan }: Props) {
  const { profile, theme, premium } = doc;
  const brand = profile.name || APP_NAME;
  const slide = premium.heroSlides[0];
  const heroImg = imageSrc(slide?.imageUrl || profile.coverUrl);
  const headline = (slide?.headline || premium.heading || "").split("\n").filter(Boolean);
  const heroHref = linkHref(slide?.url);
  const siteHref = linkHref(premium.siteUrl);
  const products = visible(doc, "product");
  const feature = imageSrc(premium.featureImageUrl);
  const featureHref = linkHref(premium.featureUrl);
  const whatsapp = whatsappHref(profile.floatingWhatsapp, "");
  return (
    <div
      className="vita-premium premium-lookbook"
      style={{ "--look-bg": theme.background, "--look-text": theme.text, "--look-accent": theme.accent } as React.CSSProperties}
    >
      <header className="look-hero">
        {heroImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="look-hero-img" src={heroImg} alt={headline.join(" ") || brand} />
        ) : (
          <div className="look-hero-img look-hero-placeholder" />
        )}
        <div className="look-hero-shade" />
        <div className="look-hero-top">
          <span className="look-brand">
            {brand}
            {profile.verified ? <VerifiedCheck className="ml-1 inline h-[0.8em] w-[0.8em] align-middle" /> : null}
          </span>
          {premium.heroPill ? (
            <a className="look-top-pill" href={linkHref(premium.heroPillUrl) ?? heroHref ?? "#"} target="_blank" rel="noopener noreferrer">
              {premium.heroPill} <span aria-hidden>›</span>
            </a>
          ) : null}
        </div>
        <div className="look-hero-bottom">
          {headline.length ? (
            <h1 className="look-headline">
              {headline.map((line, index) => (
                <span key={index}>{line}</span>
              ))}
            </h1>
          ) : null}
          <div className="look-hero-row">
            {slide?.productName || slide?.price ? (
              <a className="look-hero-chip" href={heroHref ?? "#"} target="_blank" rel="noopener noreferrer" onClick={() => heroHref && track(handle, { kind: "block_click", blockId: "hero", target: heroHref })}>
                {slide?.productName ? <span className="look-chip-name">{slide.productName}</span> : null}
                {slide?.priceFrom ? <s className="look-chip-from">{slide.priceFrom}</s> : null}
                {slide?.price ? <span className="look-chip-price">{slide.price}</span> : null}
              </a>
            ) : null}
            {siteHref ? (
              <a className="look-hero-cta" href={siteHref} target="_blank" rel="noopener noreferrer" onClick={() => track(handle, { kind: "social_click", target: "website" })}>
                {premium.siteLabel || "Ver coleção"} <span aria-hidden>→</span>
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <div className="look-body">
        {premium.navLinks.length ? (
          <nav className="look-chips" aria-label="Categorias">
            {premium.navLinks.map((item, index) =>
              item.label ? (
                <a key={index} href={linkHref(item.url) ?? "#"} target="_blank" rel="noopener noreferrer">
                  {item.label}
                </a>
              ) : null,
            )}
          </nav>
        ) : null}

        {products.length ? (
          <section className="look-rail-wrap" aria-label="Produtos">
            {premium.featureLabel ? <h2 className="look-rail-title">{premium.featureTitle || "Mais desejados"}</h2> : null}
            <div className="look-rail">
              {products.map((block) => {
                const image = imageSrc(block.imageUrl);
                const href = linkHref(block.url);
                return (
                  <article key={block.id} className="look-product">
                    {image ? (
                      <BlockLink block={block} handle={handle} href={href} className="look-product-img">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image} alt={block.title} loading="lazy" />
                      </BlockLink>
                    ) : null}
                    <div className="look-product-body">
                      <h3>{block.title}</h3>
                      {block.price ? <span className="look-product-price">{block.price}</span> : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        <LookPromo premium={premium} handle={handle} />

        {feature || premium.featureTitle ? (
          <a className="look-feature" href={featureHref ?? "#"} target="_blank" rel="noopener noreferrer" onClick={() => featureHref && track(handle, { kind: "block_click", blockId: "feature", target: featureHref })}>
            {feature ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="look-feature-img" src={feature} alt={premium.featureTitle} loading="lazy" />
            ) : null}
            <div className="look-feature-shade" />
            <div className="look-feature-copy">
              {premium.featureLabel ? <small>{premium.featureLabel}</small> : null}
              {premium.featureTitle ? <strong>{premium.featureTitle}</strong> : null}
              <span className="look-feature-cta">Ver tudo <span aria-hidden>→</span></span>
            </div>
          </a>
        ) : null}

        <footer className="look-footer">
          <span className="look-footer-brand">{brand}</span>
          <small>© {footerOwner(plan, profile.name, handle)} · {year}</small>
        </footer>
      </div>

      {whatsapp ? (
        <a className="look-wa" href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Falar no WhatsApp" onClick={() => track(handle, { kind: "social_click", target: "whatsapp" })}>
          <SocialIcon platform="whatsapp" />
        </a>
      ) : null}
    </div>
  );
}

function LookPromo({ premium, handle, hideBenefits }: { premium: PremiumFields; handle?: string; hideBenefits?: boolean }) {
  const href = linkHref(premium.promoUrl);
  const code = (premium.promoCode || "").trim();
  const match = (premium.promoDiscount || "").match(/^(\S+)\s*(.*)$/);
  const bigPart = match ? match[1] : premium.promoDiscount;
  const smallPart = match ? match[2] : "";
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!premium.promoDiscount && !code) return null;
  const activate = () => {
    track(handle, { kind: "block_click", blockId: "promo", target: code ? `cupom:${code}` : href ?? "promo" });
    setRevealed(true);
    try {
      navigator.clipboard?.writeText(code).then(
        () => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2500);
        },
        () => {},
      );
    } catch {
      /* clipboard may be blocked; code still shows for manual copy */
    }
  };
  return (
    <section className="look-promo">
      <div className="look-promo-main">
        {premium.promoBadge ? <span className="look-promo-badge">{premium.promoBadge}</span> : null}
        <p className="look-promo-discount">
          <strong>{bigPart}</strong>
          {smallPart ? <span>{smallPart}</span> : null}
        </p>
        {premium.promoNote ? <p className="look-promo-note">{premium.promoNote}</p> : null}
        {code ? (
          <button type="button" className="look-promo-btn" onClick={activate}>
            {copied ? "Cupom copiado ✓" : revealed ? `Copiar ${code}` : premium.promoButton || "Pegar cupom"}
          </button>
        ) : href ? (
          <a className="look-promo-btn" href={href} target="_blank" rel="noopener noreferrer" onClick={() => track(handle, { kind: "block_click", blockId: "promo", target: href })}>
            {premium.promoButton || "Ver ofertas"}
          </a>
        ) : null}
        {code && revealed ? (
          <button type="button" className="store-coupon" onClick={activate} aria-label={`Copiar cupom ${code}`}>
            <span className="store-coupon-code">{code}</span>
            <span className="store-coupon-hint">{copied ? "✓ copiado" : "toque para copiar"}</span>
          </button>
        ) : null}
      </div>
      {!hideBenefits && premium.benefits.length ? (
        <div className="look-promo-benefits">
          {premium.benefits.map((benefit, index) => (
            <span key={index}>{benefit}</span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

/* ---------- Mosaic (magazine / marketplace grid) ---------- */
function Mosaic({ doc, handle, plan }: Props) {
  const { profile, theme, premium } = doc;
  const brand = profile.name || APP_NAME;
  const headline = (premium.heading || "").split("\n").filter(Boolean);
  const products = visible(doc, "product");
  const whatsapp = whatsappHref(profile.floatingWhatsapp, "");
  return (
    <div
      className="vita-premium premium-mosaic"
      style={{ "--mosaic-bg": theme.background, "--mosaic-text": theme.text, "--mosaic-accent": theme.accent, "--look-accent": theme.accent } as React.CSSProperties}
    >
      <div className="mosaic-inner">
        <header className="mosaic-head">
          <div className="mosaic-head-top">
            <span className="mosaic-brand">
              {brand}
              {profile.verified ? <VerifiedCheck className="ml-1 inline h-[0.8em] w-[0.8em] align-middle" /> : null}
            </span>
            {premium.heroPill ? (
              <a className="mosaic-pill" href={linkHref(premium.heroPillUrl) ?? "#"} target="_blank" rel="noopener noreferrer">
                {premium.heroPill} <span aria-hidden>›</span>
              </a>
            ) : null}
          </div>
          {headline.length ? (
            <h1 className="mosaic-title">
              {headline.map((line, index) => (
                <span key={index}>{line}</span>
              ))}
            </h1>
          ) : null}
          {profile.bio ? <p className="mosaic-bio">{profile.bio}</p> : null}
        </header>
        {products.length ? (
          <section className="mosaic-grid" aria-label="Ofertas">
            {products.map((block, index) => {
              const image = imageSrc(block.imageUrl);
              const href = linkHref(block.url);
              const shape = index % 6 === 0 ? "mosaic-tall" : index % 6 === 3 ? "mosaic-wide" : "";
              return (
                <BlockLink key={block.id} block={block} handle={handle} href={href} className={`mosaic-tile ${shape}`}>
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={block.title} loading="lazy" />
                  ) : (
                    <span className="mosaic-tile-ph" />
                  )}
                  <span className="mosaic-tile-shade" />
                  <span className="mosaic-tile-copy">
                    {block.label ? <small>{block.label}</small> : null}
                    <strong>{block.title}</strong>
                    {block.price ? <span className="mosaic-tile-price">{block.price}</span> : null}
                  </span>
                </BlockLink>
              );
            })}
          </section>
        ) : null}
        <LookPromo premium={premium} handle={handle} />
        <footer className="mosaic-footer">
          <span className="mosaic-footer-brand">{brand}</span>
          {premium.navLinks.length ? (
            <nav className="mosaic-nav">
              {premium.navLinks.map((item, index) => (item.label ? <a key={index} href={linkHref(item.url) ?? "#"} target="_blank" rel="noopener noreferrer">{item.label}</a> : null))}
            </nav>
          ) : null}
          <small>© {footerOwner(plan, profile.name, handle)} · {year}</small>
        </footer>
      </div>
      {whatsapp ? (
        <a className="look-wa" href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Falar no WhatsApp" onClick={() => track(handle, { kind: "social_click", target: "whatsapp" })}>
          <SocialIcon platform="whatsapp" />
        </a>
      ) : null}
    </div>
  );
}

/* ---------- Dropz (single-product drop) ---------- */
function Dropz({ doc, handle, plan }: Props) {
  const { profile, theme, premium } = doc;
  const brand = profile.name || APP_NAME;
  const slide = premium.heroSlides[0];
  const heroImg = imageSrc(slide?.imageUrl || premium.featureImageUrl || profile.coverUrl);
  const title = slide?.headline || premium.featureTitle || "";
  const label = slide?.productLabel || premium.featureLabel;
  const buyHref = linkHref(slide?.url || premium.siteUrl || premium.promoUrl);
  const products = visible(doc, "product");
  const whatsapp = whatsappHref(profile.floatingWhatsapp, "");
  return (
    <div
      className="vita-premium premium-dropz"
      style={{ "--dropz-bg": theme.background, "--dropz-text": theme.text, "--dropz-accent": theme.accent, "--look-accent": theme.accent } as React.CSSProperties}
    >
      <div className="dropz-inner">
        <header className="dropz-top">
          <span className="dropz-brand">
            {brand}
            {profile.verified ? <VerifiedCheck className="ml-1 inline h-[0.8em] w-[0.8em] align-middle" /> : null}
          </span>
          {premium.heroPill ? <span className="dropz-chip">{premium.heroPill}</span> : null}
        </header>
        <section className="dropz-hero">
          {heroImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="dropz-hero-img" src={heroImg} alt={title || brand} />
          ) : (
            <div className="dropz-hero-img dropz-hero-ph" />
          )}
        </section>
        <section className="dropz-info">
          {label ? <span className="dropz-label">{label}</span> : null}
          {title ? <h1 className="dropz-title">{title}</h1> : null}
          <div className="dropz-price">
            {slide?.priceFrom ? <s>{slide.priceFrom}</s> : null}
            {slide?.price ? <strong>{slide.price}</strong> : null}
          </div>
          {premium.sizes.length ? (
            <div className="dropz-sizes">
              <span className="dropz-sizes-label">Tamanho</span>
              <div className="dropz-sizes-row">
                {premium.sizes.map((size, index) => (
                  <span key={index} className={size === premium.sizeActive ? "on" : ""}>
                    {size}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {buyHref ? (
            <a className="dropz-buy" href={buyHref} target="_blank" rel="noopener noreferrer" onClick={() => track(handle, { kind: "block_click", blockId: "buy", target: buyHref })}>
              {premium.promoButton || "Comprar agora"} <span aria-hidden>→</span>
            </a>
          ) : null}
          {premium.benefits.length ? (
            <div className="dropz-benefits">
              {premium.benefits.map((benefit, index) => (
                <span key={index}>{benefit}</span>
              ))}
            </div>
          ) : null}
        </section>
        {premium.promoCode || (premium.promoDiscount && premium.promoBadge) ? <LookPromo premium={premium} handle={handle} hideBenefits /> : null}
        {products.length ? (
          <section className="dropz-more">
            <h2>Você também vai gostar</h2>
            <div className="dropz-rail">
              {products.map((block) => {
                const image = imageSrc(block.imageUrl);
                const href = linkHref(block.url);
                return (
                  <article key={block.id} className="dropz-card">
                    {image ? (
                      <BlockLink block={block} handle={handle} href={href} className="dropz-card-img">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image} alt={block.title} loading="lazy" />
                      </BlockLink>
                    ) : null}
                    <div className="dropz-card-body">
                      <h3>{block.title}</h3>
                      {block.price ? <span>{block.price}</span> : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
        <footer className="dropz-footer">
          <span className="dropz-footer-brand">{brand}</span>
          {premium.navLinks.length ? (
            <nav className="dropz-nav">
              {premium.navLinks.map((item, index) => (item.label ? <a key={index} href={linkHref(item.url) ?? "#"} target="_blank" rel="noopener noreferrer">{item.label}</a> : null))}
            </nav>
          ) : null}
          <small>© {footerOwner(plan, profile.name, handle)} · {year}</small>
        </footer>
      </div>
      {whatsapp ? (
        <a className="look-wa" href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Falar no WhatsApp" onClick={() => track(handle, { kind: "social_click", target: "whatsapp" })}>
          <SocialIcon platform="whatsapp" />
        </a>
      ) : null}
    </div>
  );
}
