"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Block, PageDoc } from "@/lib/page/schema";
import { SOCIAL_LABELS } from "@/lib/page/catalog";
import { spotifyEmbedUrl, youtubeEmbedUrl } from "@/lib/page/embed";
import { imageSrc, linkHref, mapsDirectionsUrl, mapsEmbedUrl, socialHref, vCard, videoSrc, whatsappHref } from "@/lib/page/links";
import { PremiumView } from "./PremiumView";
import { SocialIcon } from "./SocialIcon";
import { startVisit, track } from "./track";
import { AVATAR_RADII, buttonClass, themeVars } from "./theme";

type Props = {
  doc: PageDoc;
  // Set on the published page; omitted in the editor preview, which then
  // neither records analytics nor submits forms.
  handle?: string;
  footer?: React.ReactNode;
  // In gallery thumbnails a video cover is drawn as a still (its poster), so
  // dozens of previews don't autoplay at once.
  still?: boolean;
};

export function PageView({ doc, handle, footer, still }: Props) {
  const { theme } = doc;
  const blocks = doc.blocks.filter((block) => block.enabled);

  useEffect(() => {
    startVisit();
    track(handle, { kind: "page_view", referrer: document.referrer });
  }, [handle]);

  if (theme.premium) return <PremiumView doc={doc} handle={handle} />;

  const content = (
    <>
      <Header doc={doc} handle={handle} still={still} />
      {theme.layout === "band" ? null : <Socials doc={doc} handle={handle} />}
      <div className="mt-7 flex w-full flex-col gap-3.5">
        {blocks.map((block) => (
          <BlockView key={block.id} block={block} doc={doc} handle={handle} />
        ))}
      </div>
      {footer}
      <FloatingWhatsapp doc={doc} handle={handle} />
    </>
  );

  return (
    <div style={themeVars(theme)} className="min-h-full bg-[var(--page-bg)] text-[var(--page-text)]">
      {theme.layout === "card" ? (
        <main className="mx-auto w-full max-w-[580px] px-4 py-10">
          <div className="flex flex-col items-center rounded-[28px] bg-white/90 px-5 pb-8 pt-10 shadow-2xl backdrop-blur">
            {content}
          </div>
        </main>
      ) : (
        <main className="mx-auto flex w-full max-w-[580px] flex-col items-center px-5 pb-10">{content}</main>
      )}
    </div>
  );
}

function Avatar({ doc, size }: { doc: PageDoc; size: string }) {
  const { profile, theme } = doc;
  const src = imageSrc(profile.avatarUrl);
  const shape = AVATAR_RADII[theme.avatarShape];
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={profile.name} className={`${size} ${shape} border-4 border-[var(--page-bg)] object-cover`} />;
  }
  return (
    <div className={`${size} ${shape} flex items-center justify-center bg-[var(--btn-bg)] text-3xl font-semibold text-[var(--btn-text)]`}>
      {profile.name.trim().charAt(0).toUpperCase() || "?"}
    </div>
  );
}

function Name({ doc, big = false }: { doc: PageDoc; big?: boolean }) {
  return (
    <h1 className={`flex items-center justify-center gap-1.5 text-center font-bold [font-family:var(--heading-font)] ${big ? "text-4xl leading-tight tracking-tight" : "text-xl"}`}>
      {doc.profile.name}
      {doc.profile.verified ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" role="img" aria-label="Verificado">
          <path
            fill="#1d9bf0"
            d="M12 1.5l2.6 1.9 3.2-.1 1 3 2.6 1.9-1 3.1 1 3.1-2.6 1.9-1 3-3.2-.1L12 22.5l-2.6-1.9-3.2.1-1-3-2.6-1.9 1-3.1-1-3.1 2.6-1.9 1-3 3.2.1z"
          />
          <path fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M7.8 12.3l2.8 2.8 5.6-5.8" />
        </svg>
      ) : null}
    </h1>
  );
}

function Bio({ doc }: { doc: PageDoc }) {
  if (!doc.profile.bio) return null;
  return <p className="mt-2 max-w-md whitespace-pre-line text-center text-[15px] opacity-80">{doc.profile.bio}</p>;
}

// An optional brand logo shown at the top of some headers.
function Logo({ doc, className = "mb-3 h-14 w-auto object-contain" }: { doc: PageDoc; className?: string }) {
  const src = imageSrc(doc.profile.logo);
  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={doc.profile.name} className={className} />;
}

// A cover/hero slot: plays the cover video when there is one, otherwise shows
// the image. In thumbnails (still) the video is drawn as its poster instead.
function CoverMedia({
  video,
  img,
  alt,
  className,
  style,
}: {
  video: string | null;
  img: string | null;
  alt: string;
  className: string;
  style?: React.CSSProperties;
}) {
  if (video) {
    return (
      <video
        src={video}
        poster={img ?? undefined}
        autoPlay
        muted
        loop
        playsInline
        className={className}
        style={style}
        aria-label={alt || undefined}
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return img ? <img src={img} alt={alt} className={className} style={style} /> : null;
}

function Header({ doc, handle, still }: { doc: PageDoc; handle?: string; still?: boolean }) {
  const { profile, theme } = doc;
  const video = still ? null : videoSrc(profile.coverVideo);
  const coverImg = imageSrc(profile.coverUrl);
  const avatarImg = imageSrc(profile.avatarUrl);
  const cover = theme.layout === "cover" ? coverImg : null;
  const hero = theme.layout === "hero" ? avatarImg : null;
  const poster = theme.layout === "poster" ? coverImg ?? avatarImg : null;

  // The page starts straight with its blocks (a title block usually opens it).
  if (theme.layout === "blank") return <div className="pt-10" />;

  if (theme.layout === "name") {
    // Text-only header: the name set large in the heading font.
    return (
      <div className="flex flex-col items-center pt-14">
        <Logo doc={doc} />
        <Name doc={doc} big />
        <Bio doc={doc} />
      </div>
    );
  }

  if (theme.layout === "band") {
    // Stacked coloured bands: name, tagline and socials, each full-width.
    return (
      <div className="-mx-5 w-[calc(100%+2.5rem)] overflow-hidden">
        <div className="px-6 py-8 text-center" style={{ background: "var(--page-accent)", color: "var(--btn-text)" }}>
          <Logo doc={doc} className="mx-auto mb-3 h-12 w-auto object-contain" />
          <h1 className="text-3xl font-extrabold uppercase leading-tight tracking-tight [font-family:var(--heading-font)]">{profile.name}</h1>
        </div>
        {profile.bio ? (
          <div className="px-6 py-3 text-center text-sm font-medium" style={{ background: "color-mix(in srgb, var(--page-accent) 20%, var(--page-bg))" }}>
            {profile.bio}
          </div>
        ) : null}
        <div className="flex justify-center py-2.5" style={{ background: "color-mix(in srgb, var(--page-accent) 10%, var(--page-bg))" }}>
          <Socials doc={doc} handle={handle} />
        </div>
      </div>
    );
  }

  if (theme.layout === "cutout") {
    // Portrait inside an organic blob over a tinted field.
    const blob = coverImg ?? avatarImg;
    return (
      <div className="flex flex-col items-center pt-10">
        <Name doc={doc} big />
        <div
          className="relative mt-4 h-72 w-64 overflow-hidden"
          style={{ borderRadius: "42% 58% 63% 37% / 41% 44% 56% 59%", background: "color-mix(in srgb, var(--page-accent) 18%, var(--page-bg))" }}
        >
          <CoverMedia video={video} img={blob} alt={profile.name} className="h-full w-full object-cover" />
        </div>
        <Bio doc={doc} />
      </div>
    );
  }

  if (theme.layout === "fullscreen") {
    // Full-bleed photo/video with the name centred over it (Cloud Layers).
    const media = coverImg ?? avatarImg;
    return (
      <div className="relative -mx-5 w-[calc(100%+2.5rem)]">
        <div className="relative aspect-[3/4] max-h-[640px] w-full">
          <CoverMedia video={video} img={media} alt={profile.name} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-[var(--page-bg)]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
            <Logo doc={doc} className="mb-3 h-12 w-auto object-contain" />
            <h1 className="text-4xl font-bold leading-tight tracking-tight [font-family:var(--heading-font)] drop-shadow">{profile.name}</h1>
            {profile.bio ? <p className="mt-2 max-w-xs whitespace-pre-line text-sm opacity-90 drop-shadow">{profile.bio}</p> : null}
            <span className="mt-5 text-2xl opacity-80" aria-hidden="true">↓</span>
          </div>
        </div>
      </div>
    );
  }

  if (theme.layout === "portrait") {
    // A large framed portrait at the top, name and bio below (profile-large).
    const media = coverImg ?? avatarImg;
    return (
      <div className="flex flex-col items-center pt-8">
        <div className="aspect-[3/4] w-full max-w-[320px] overflow-hidden rounded-[32px] ring-1 ring-black/10">
          <CoverMedia video={video} img={media} alt={profile.name} className="h-full w-full object-cover" />
        </div>
        <div className="mt-5 flex flex-col items-center">
          <Logo doc={doc} className="mb-2 h-10 w-auto object-contain" />
          <Name doc={doc} big />
        </div>
        <Bio doc={doc} />
      </div>
    );
  }

  if (poster || (theme.layout === "poster" && video)) {
    // Full-width media with the name over its darkened bottom edge.
    return (
      <div className="relative -mx-5 w-[calc(100%+2.5rem)]">
        <CoverMedia video={video} img={poster} alt={profile.name} className="aspect-[4/5] max-h-[520px] w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent from-40% via-black/40 to-[var(--page-bg)]" />
        <div className="absolute inset-x-0 bottom-4 px-6 text-center">
          <div className="uppercase">
            <Name doc={doc} big />
          </div>
          <Bio doc={doc} />
        </div>
      </div>
    );
  }

  if (hero || (theme.layout === "hero" && video)) {
    // Big media across the top that fades into the page background.
    return (
      <div className="-mx-5 flex w-[calc(100%+2.5rem)] flex-col items-center">
        <div className="relative w-full">
          <CoverMedia video={video} img={hero} alt={profile.name} className="aspect-[4/5] max-h-[460px] w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent from-55% to-[var(--page-bg)]" />
          <div className="absolute inset-x-0 bottom-2 px-5">
            <Name doc={doc} big />
          </div>
        </div>
        <div className="px-5">
          <Bio doc={doc} />
        </div>
      </div>
    );
  }

  const bannerVideo = theme.layout === "cover" ? video : null;
  return (
    <>
      {cover || bannerVideo ? (
        <CoverMedia
          video={bannerVideo}
          img={cover}
          alt=""
          className="-mx-5 h-44 w-[calc(100%+2.5rem)] max-w-none object-cover sm:rounded-b-3xl"
        />
      ) : null}
      <div className={`flex flex-col items-center ${cover || bannerVideo ? "-mt-12" : theme.layout === "card" ? "" : "pt-12"}`}>
        <Avatar doc={doc} size="h-24 w-24" />
        <div className="mt-4 flex flex-col items-center">
          <Logo doc={doc} className="mb-2 h-10 w-auto object-contain" />
          <Name doc={doc} />
        </div>
        <Bio doc={doc} />
      </div>
    </>
  );
}

function Socials({ doc, handle }: { doc: PageDoc; handle?: string }) {
  const links = doc.socials
    .map((social) => ({ social, href: socialHref(social) }))
    .filter((item): item is { social: (typeof doc.socials)[number]; href: string } => !!item.href);
  if (links.length === 0) return null;
  const icons = doc.theme.socialStyle === "icons";
  return (
    <nav className={`mt-4 flex flex-wrap justify-center ${icons ? "gap-1" : "gap-2"}`}>
      {links.map(({ social, href }) => (
        <a
          key={`${social.platform}-${href}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={SOCIAL_LABELS[social.platform]}
          onClick={() => track(handle, { kind: "social_click", target: social.platform })}
          className={
            icons
              ? "flex h-11 w-11 items-center justify-center rounded-full opacity-85 transition hover:scale-110 hover:opacity-100"
              : "rounded-full border border-current/25 px-3 py-1 text-sm opacity-85 hover:opacity-100"
          }
        >
          {icons ? <SocialIcon platform={social.platform} className="h-[22px] w-[22px]" /> : SOCIAL_LABELS[social.platform]}
        </a>
      ))}
    </nav>
  );
}

function Heading({ text, style }: { text: string; style: Extract<Block, { type: "heading" }>["style"] }) {
  switch (style) {
    case "divider":
      return (
        <div className="mt-3 flex w-full items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
          <span className="h-px flex-1 bg-current opacity-40" />
          {text}
          <span className="h-px flex-1 bg-current opacity-40" />
        </div>
      );
    case "section":
      return <h2 className="mt-4 text-center text-xs font-bold uppercase tracking-[0.25em] text-[var(--page-accent)]">{text}</h2>;
    case "display":
      return <h2 className="mt-2 text-center text-3xl font-bold leading-tight [font-family:var(--heading-font)]">{text}</h2>;
    case "badge":
      return (
        <span className="mt-2 self-center rounded-full border border-[var(--page-accent)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--page-accent)]">
          {text}
        </span>
      );
    default:
      return <h2 className="mt-3 text-center text-base font-semibold [font-family:var(--heading-font)]">{text}</h2>;
  }
}

function FloatingWhatsapp({ doc, handle }: { doc: PageDoc; handle?: string }) {
  const href = whatsappHref(doc.profile.floatingWhatsapp, "");
  if (!href) return null;
  // Sticky rather than fixed, so it stays inside the editor's phone preview too.
  return (
    <div className="pointer-events-none sticky bottom-4 z-10 -mb-14 mt-4 flex w-full justify-end">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        onClick={() => track(handle, { kind: "social_click", target: "whatsapp" })}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105"
      >
        <SocialIcon platform="whatsapp" className="h-7 w-7" />
      </a>
    </div>
  );
}

// Shown dimmed in the editor preview while a block is missing what it needs;
// visitors never see it.
function Placeholder({ handle, className, children }: { handle?: string; className: string; children: React.ReactNode }) {
  return handle ? null : <span className={`${className} opacity-40`}>{children}</span>;
}

const softBox = "rounded-[var(--box-radius)] bg-[color-mix(in_srgb,var(--page-text)_7%,transparent)]";

function BlockView({ block, doc, handle }: { block: Block; doc: PageDoc; handle?: string }) {
  const btn = buttonClass(doc.theme);
  const click = (target: string) => track(handle, { kind: "block_click", blockId: block.id, target });
  switch (block.type) {
    case "link": {
      const href = linkHref(block.url);
      if (!href) return <Placeholder handle={handle} className={btn}>{block.title || "Link sem endereço"}</Placeholder>;
      const thumb = imageSrc(block.imageUrl);
      const accent = block.accent || "var(--page-accent)";
      if (block.display === "banner") {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => click(href)}
            className={`relative flex min-h-[168px] w-full flex-col items-start justify-end overflow-hidden rounded-[var(--box-radius)] p-5 text-left text-white transition-transform hover:scale-[1.01] ${block.highlight ? "btn-highlight" : ""}`}
            style={{ background: `linear-gradient(135deg, ${accent}, #0b0b12)` }}
          >
            {thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumb} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            ) : null}
            <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/5" />
            <span className="relative flex flex-col items-start gap-2">
              {block.label ? (
                <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider" style={{ background: accent }}>
                  {block.label}
                </span>
              ) : null}
              <span className="text-xl font-bold leading-tight [font-family:var(--heading-font)]">{block.title}</span>
              {block.subtitle ? <span className="text-sm opacity-85">{block.subtitle}</span> : null}
              {block.buttonText ? (
                <span className="mt-1 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black">{block.buttonText} →</span>
              ) : null}
            </span>
          </a>
        );
      }
      if (block.display === "card") {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => click(href)}
            className={`${softBox} flex w-full items-center gap-3 p-4 text-left transition-transform hover:scale-[1.01] ${block.highlight ? "btn-highlight" : ""}`}
          >
            {thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumb} alt="" className="h-14 w-14 shrink-0 rounded-[calc(var(--box-radius)*0.7)] object-cover" />
            ) : null}
            <span className="flex min-w-0 flex-1 flex-col">
              {block.label ? (
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: accent }}>
                  {block.label}
                </span>
              ) : null}
              <span className="font-semibold leading-snug">{block.title}</span>
              {block.subtitle ? <span className="text-sm opacity-70">{block.subtitle}</span> : null}
            </span>
            <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg" style={{ background: accent, color: "#fff" }}>
              ↗
            </span>
          </a>
        );
      }
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btn} relative ${thumb ? "px-16" : ""} ${block.highlight ? "btn-highlight" : ""}`}
          onClick={() => click(href)}
        >
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className="absolute left-1.5 top-1/2 h-10 w-10 -translate-y-1/2 rounded-[calc(var(--btn-radius)*0.8)] object-cover" />
          ) : null}
          {block.title || href}
        </a>
      );
    }
    case "heading":
      return <Heading text={block.text} style={block.style} />;
    case "text":
      if (block.style === "footer") return <p className="mt-4 whitespace-pre-line text-center text-xs opacity-60">{block.text}</p>;
      if (block.style === "quote") {
        return (
          <section className={`${softBox} w-full p-5 text-center`}>
            {block.title ? (
              <p className="text-xl font-bold uppercase leading-tight [font-family:var(--heading-font)]">{block.title}</p>
            ) : null}
            <p className="mt-3 whitespace-pre-line text-[15px] opacity-80">{block.text}</p>
          </section>
        );
      }
      return <p className="whitespace-pre-line text-center text-[15px] opacity-85">{block.text}</p>;
    case "stats":
      return (
        <section className={`grid w-full gap-2.5 ${block.items.length >= 3 ? "grid-cols-3" : block.items.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
          {block.items.map((item, index) => (
            <div key={index} className={`${softBox} px-2 py-4 text-center`}>
              <div className="text-2xl font-bold text-[var(--page-accent)] [font-family:var(--heading-font)]">{item.value}</div>
              <div className="mt-1 text-xs leading-snug opacity-75">{item.label}</div>
            </div>
          ))}
        </section>
      );
    case "youtube": {
      const src = youtubeEmbedUrl(block.url);
      if (!src) return null;
      return (
        <iframe
          src={src}
          title="Vídeo do YouTube"
          className="aspect-video w-full rounded-[var(--box-radius)]"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      );
    }
    case "spotify": {
      const src = spotifyEmbedUrl(block.url);
      if (!src) return null;
      return (
        <iframe
          src={src}
          title="Spotify"
          className="h-[152px] w-full rounded-xl"
          allow="encrypted-media"
          loading="lazy"
        />
      );
    }
    case "faq":
      return (
        <section className="w-full">
          {block.title ? <h2 className="mb-2 text-center font-semibold">{block.title}</h2> : null}
          <div className="flex flex-col gap-2">
            {block.items.map((item, index) => (
              <details key={index} className={`${softBox} px-4 py-3`}>
                <summary className="cursor-pointer font-medium">{item.question}</summary>
                <p className="mt-2 whitespace-pre-line text-[15px] opacity-85">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      );
    case "countdown":
      return <Countdown title={block.title} endsAt={block.endsAt} />;
    case "subscribe":
      return <SubscribeForm block={block} handle={handle} buttonClassName={btn} />;
    case "whatsapp": {
      const href = whatsappHref(block.phone, block.message);
      const label = (
        <span className="flex items-center justify-center gap-2">
          <SocialIcon platform="whatsapp" className="h-5 w-5" />
          {block.buttonText || "WhatsApp"}
        </span>
      );
      if (!href) return <Placeholder handle={handle} className={btn}>{label}</Placeholder>;
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={btn} onClick={() => click("whatsapp")}>
          {label}
        </a>
      );
    }
    case "image": {
      const src = imageSrc(block.imageUrl);
      if (!src) return <Placeholder handle={handle} className={`${softBox} block w-full py-10 text-center`}>Imagem sem endereço</Placeholder>;
      // eslint-disable-next-line @next/next/no-img-element
      const img = <img src={src} alt={block.alt} className="w-full rounded-[var(--box-radius)] object-cover" loading="lazy" />;
      const href = linkHref(block.url);
      if (!href) return img;
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="block transition-transform hover:scale-[1.01]" onClick={() => click(href)}>
          {img}
        </a>
      );
    }
    case "product": {
      const src = imageSrc(block.imageUrl);
      const href = linkHref(block.url);
      return (
        <section className={`${softBox} w-full overflow-hidden`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {src ? <img src={src} alt={block.title} className="aspect-[4/3] w-full object-cover" loading="lazy" /> : null}
          <div className="flex flex-col gap-1.5 p-4">
            {block.label ? (
              <span className="self-start rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white" style={{ background: "var(--page-accent)" }}>
                {block.label}
              </span>
            ) : null}
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold">{block.title}</h2>
              {block.price ? <span className="shrink-0 font-bold">{block.price}</span> : null}
            </div>
            {block.description ? <p className="whitespace-pre-line text-[15px] opacity-80">{block.description}</p> : null}
            {href ? (
              <a href={href} target="_blank" rel="noopener noreferrer" className={`${btn} mt-2`} onClick={() => click(href)}>
                {block.buttonText || "Comprar"}
              </a>
            ) : (
              <Placeholder handle={handle} className={`${btn} mt-2`}>{block.buttonText || "Comprar"}</Placeholder>
            )}
          </div>
        </section>
      );
    }
    case "map": {
      const address = block.address.trim();
      if (!address) return <Placeholder handle={handle} className={`${softBox} block w-full py-10 text-center`}>Mapa sem endereço</Placeholder>;
      return (
        <section className="flex w-full flex-col gap-2.5">
          {block.title ? <h2 className="text-center font-semibold">{block.title}</h2> : null}
          <iframe
            src={mapsEmbedUrl(address)}
            title={`Mapa: ${address}`}
            className="h-56 w-full rounded-[var(--box-radius)]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <p className="text-center text-sm opacity-75">{address}</p>
          <a href={mapsDirectionsUrl(address)} target="_blank" rel="noopener noreferrer" className={btn} onClick={() => click("maps")}>
            Como chegar
          </a>
        </section>
      );
    }
    case "contact": {
      const ready = block.name.trim() && (block.phone.trim() || block.email.trim());
      if (!ready) return <Placeholder handle={handle} className={btn}>{block.buttonText || "Salvar contato"}</Placeholder>;
      return (
        <button
          type="button"
          className={btn}
          onClick={() => {
            click("vcard");
            const url = URL.createObjectURL(new Blob([vCard(block)], { type: "text/vcard" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = `${block.name.trim() || "contato"}.vcf`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}
        >
          {block.buttonText || "Salvar contato"}
        </button>
      );
    }
    case "gallery": {
      const items = block.items.map((item) => ({ src: imageSrc(item.imageUrl), href: linkHref(item.url) })).filter((item) => item.src);
      if (items.length === 0) return <Placeholder handle={handle} className={`${softBox} block w-full py-10 text-center`}>Galeria sem fotos</Placeholder>;
      const picture = (src: string, cls: string) =>
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className={cls} loading="lazy" />;
      const wrap = (index: number, href: string | null, inner: React.ReactNode) =>
        href ? (
          <a key={index} href={href} target="_blank" rel="noopener noreferrer" className="block shrink-0 transition-transform hover:scale-[1.02]" onClick={() => click(href)}>
            {inner}
          </a>
        ) : (
          <div key={index} className="shrink-0">{inner}</div>
        );
      if (block.display === "carousel") {
        // A horizontal strip that scrolls (Action Ready style).
        return (
          <section className="-mx-5 w-[calc(100%+2.5rem)]">
            {block.title ? <h2 className="mb-2.5 px-5 text-center font-semibold [font-family:var(--heading-font)]">{block.title}</h2> : null}
            <div className="flex snap-x gap-2.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {items.map((item, index) => wrap(index, item.href, picture(item.src!, "h-44 w-36 snap-start rounded-[calc(var(--box-radius)*0.8)] object-cover")))}
            </div>
          </section>
        );
      }
      const cols = items.length === 1 ? "grid-cols-1" : items.length === 2 || items.length === 4 ? "grid-cols-2" : "grid-cols-3";
      return (
        <section className="w-full">
          {block.title ? <h2 className="mb-2.5 text-center font-semibold [font-family:var(--heading-font)]">{block.title}</h2> : null}
          <div className={`grid gap-2 ${cols}`}>
            {items.map((item, index) => wrap(index, item.href, picture(item.src!, "aspect-square w-full rounded-[calc(var(--box-radius)*0.8)] object-cover")))}
          </div>
        </section>
      );
    }
  }
}

function Countdown({ title, endsAt }: { title: string; endsAt: string }) {
  // Rendered empty on the server and filled after mount, so the server's
  // clock never mismatches the visitor's during hydration.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const end = Date.parse(endsAt);
  if (Number.isNaN(end)) return null;
  const left = now === null ? null : Math.max(0, end - now);
  const parts =
    left === null
      ? null
      : [
          ["dias", Math.floor(left / 86_400_000)],
          ["horas", Math.floor(left / 3_600_000) % 24],
          ["min", Math.floor(left / 60_000) % 60],
          ["seg", Math.floor(left / 1000) % 60],
        ];
  return (
    <section className="w-full rounded-[var(--box-radius)] bg-[color-mix(in_srgb,var(--page-text)_7%,transparent)] p-4 text-center">
      <p className="font-medium">{title}</p>
      <div className="mt-2 flex justify-center gap-4 tabular-nums">
        {(parts ?? []).map(([label, value]) => (
          <div key={label}>
            <div className="text-2xl font-bold">{String(value).padStart(2, "0")}</div>
            <div className="text-xs opacity-70">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SubscribeForm({
  block,
  handle,
  buttonClassName,
}: {
  block: Extract<Block, { type: "subscribe" }>;
  handle?: string;
  buttonClassName: string;
}) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!handle) return;
    const form = new FormData(event.currentTarget);
    setState("sending");
    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        handle,
        blockId: block.id,
        email: form.get("email") ?? "",
        phone: form.get("phone") ?? "",
      }),
    }).catch(() => null);
    setState(response?.ok ? "done" : "error");
  }

  const input =
    "w-full rounded-[var(--btn-radius)] border border-current/25 bg-transparent px-4 py-3 outline-none focus:border-current/60";

  if (state === "done") {
    return <p className="rounded-[var(--btn-radius)] p-4 text-center font-medium">{block.thankYouMessage}</p>;
  }
  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-2.5">
      <p className="text-center font-semibold">{block.title}</p>
      <input name="email" type="email" required placeholder="Seu e-mail" className={input} />
      {block.collectPhone ? (
        <input name="phone" type="tel" placeholder="Seu WhatsApp (opcional)" className={input} />
      ) : null}
      <button type="submit" disabled={state === "sending"} className={buttonClassName}>
        {state === "sending" ? "Enviando..." : block.buttonText}
      </button>
      {state === "error" ? <p className="text-center text-sm">Não deu certo. Tente de novo.</p> : null}
    </form>
  );
}
