"use client";

import { useState } from "react";
import type { Block, PageDoc } from "@/lib/page/schema";
import { SOCIAL_LABELS } from "@/lib/page/catalog";
import { youtubeEmbedUrl } from "@/lib/page/embed";
import { imageSrc, linkHref, socialHref, videoSrc, whatsappHref } from "@/lib/page/links";
import { SocialIcon } from "./SocialIcon";
import { track } from "./track";
import { VerifiedCheck } from "./VerifiedCheck";

// The four Vita premium designs. Each one mirrors the markup of the
// original template so src/app/premium.css styles it the same way.

type Props = { doc: PageDoc; handle?: string };
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

export function PremiumView({ doc, handle }: Props) {
  const page = (() => {
    switch (doc.theme.premium) {
      case "authority":
        return <Authority doc={doc} handle={handle} />;
      case "spotlight":
        return <Spotlight doc={doc} handle={handle} />;
      case "ecosystem":
        return <Ecosystem doc={doc} handle={handle} />;
      case "catalog":
        return <Catalog doc={doc} handle={handle} />;
      case "experience":
        return <Experience doc={doc} handle={handle} />;
      default:
        return null;
    }
  })();
  return <div className="vita-page min-h-full">{page}</div>;
}

function Authority({ doc, handle }: Props) {
  const { profile, theme, premium } = doc;
  return (
    <div
      className="vita-premium premium-authority"
      style={{ "--premium-bg": theme.background, "--premium-text": theme.text, "--premium-accent": theme.accent } as React.CSSProperties}
    >
      <header className="premium-profile">
        <h1>{profile.name}{profile.verified ? <VerifiedCheck className="ml-1.5 inline h-[0.8em] w-[0.8em] align-middle" /> : null}</h1>
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
        <strong>{premium.footer || profile.name}</strong>
        <p>
          {profile.name} · © {year}. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}

function Spotlight({ doc, handle }: Props) {
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
          <img className="spotlight-portrait" src={cover} alt="" />
        ) : null}
        <div className="spotlight-hero-shade" />
        <div className="spotlight-identity">
          {premium.header === "none" ? null : premium.header === "logo" && logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="spotlight-logo" src={logo} alt={profile.name} />
          ) : (
            <h1>{profile.name}{profile.verified ? <VerifiedCheck className="ml-1.5 inline h-[0.8em] w-[0.8em] align-middle" /> : null}</h1>
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
          © {year} {profile.name}. Todos os direitos reservados.
        </p>
        <nav aria-label="Informações legais">
          {privacy ? <a href={privacy}>Política de Privacidade</a> : null}
          {terms ? <a href={terms}>Termos e Condições de Uso</a> : null}
        </nav>
      </footer>
    </div>
  );
}

function Ecosystem({ doc, handle }: Props) {
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
              <h1>{profile.name}{profile.verified ? <VerifiedCheck className="ml-1.5 inline h-[0.8em] w-[0.8em] align-middle" /> : null}</h1>
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
          {premium.header !== "none" && logo ? <img src={logo} alt={profile.name} /> : <strong>{profile.name}</strong>}
          <p>
            © {year} {profile.name}. Todos os direitos reservados.
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
              <h1 className="text-2xl font-bold">{profile.name}</h1>
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

function Catalog({ doc, handle }: Props) {
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
            © {profile.name} · Todos os direitos reservados · {year}
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
