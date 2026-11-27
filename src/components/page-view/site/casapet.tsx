"use client";

import type { CSSProperties } from "react";
import { Act, ArrowRight, Img, Item, Lines, Play, Socials, split, type SiteRender } from "./kit";

const Paw = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" aria-hidden>
    <ellipse cx="5" cy="11" rx="2" ry="2.6" transform="rotate(-18 5 11)" />
    <ellipse cx="9.3" cy="6.4" rx="2.1" ry="2.9" transform="rotate(-6 9.3 6.4)" />
    <ellipse cx="14.7" cy="6.4" rx="2.1" ry="2.9" transform="rotate(6 14.7 6.4)" />
    <ellipse cx="19" cy="11" rx="2" ry="2.6" transform="rotate(18 19 11)" />
    <path d="M12 11.600c-3 0-6 3.300-6 6.200 0 1.800 1.300 2.700 2.900 2.700 1.200 0 2-.600 3.100-.600s1.900.600 3.100.600c1.600 0 2.900-.900 2.900-2.700 0-2.900-3-6.200-6-6.200z" />
  </svg>
);

// "Casa Pet" — pet shop, deep red cover with the giant brand word behind the
// pet photo, cream page, red italic accents. Reference: a pet shop landing.
export const casapet: SiteRender = (c) => {
  const price = (text: string) => {
    const [value, unit] = text.split("/").map((s) => s.trim());
    return (
      <>
        {value}
        {unit ? <small> / {unit}</small> : null}
      </>
    );
  };
  const faces = [c.hero.photo, c.feature.image || c.about.image].filter(Boolean);
  const card = c.hero.card;
  const cardImage = c.catalog.items[0]?.imageUrl ?? "";
  return {
    hero: (
      <div className={`cp-hero ${c.hero.photo ? "" : "nop"}`} style={{ ...c.hero.coverStyle, "--cp-n": Math.max(c.brand.length, 3) } as CSSProperties}>
        <div className="cp-bar">
          {c.hero.showName ? (
            <div className="cp-brand">
              {c.logo ? <Img src={c.logo} alt="" className="cp-logo" /> : <Paw />}
              <b>{c.brand}</b>
            </div>
          ) : (
            <span />
          )}
          {c.hero.cta2.label ? (
            <Act c={c} to={c.hero.cta2} id="cta2" className="cp-pill sm">
              <span>{c.hero.cta2.label}</span>
              <i>
                <ArrowRight />
              </i>
            </Act>
          ) : (
            <Socials c={c} className="cp-socials" max={2} />
          )}
        </div>
        {c.hero.showName ? (
          <div className="cp-giant" aria-hidden>
            <span>{c.brand}</span>
          </div>
        ) : null}
        {c.hero.photo ? (
          <div className="cp-photo">
            <Img src={c.hero.photo} alt={c.brand} style={c.hero.photoStyle} />
          </div>
        ) : null}
        <div className="cp-body">
          <div className="cp-copy">
            {c.hero.pill ? <span className="cp-tag">{c.hero.pill}</span> : null}
            {c.hero.lines.length ? (
              <h1 className="cp-title">
                <Lines lines={c.hero.lines} />
              </h1>
            ) : null}
            {c.hero.sub ? <p className="cp-sub">{c.hero.sub}</p> : null}
            <Act c={c} to={c.hero.cta} id="cta" className="cp-pill">
              <span>{c.hero.cta.label}</span>
              <i>
                <ArrowRight />
              </i>
            </Act>
          </div>
          {card.name ? (
            <Act c={c} to={{ label: card.name, href: card.href }} id="hero-card" className="cp-card">
              <Img src={cardImage} alt="" />
              <span className="cp-card-txt">
                {card.label ? <small>{card.label}</small> : null}
                <b>{card.name}</b>
                {card.price ? <em>{price(card.price)}</em> : null}
              </span>
              <i>
                <Play />
              </i>
            </Act>
          ) : null}
        </div>
      </div>
    ),
    feature:
      c.feature.image || c.feature.title || c.feature.text || c.feature.big ? (
        <div className="cp-feature">
          {c.feature.image || c.feature.tag ? (
            <div className={`cp-feature-img ${c.feature.image ? "" : "noimg"}`}>
              <Img src={c.feature.image} alt={c.feature.title} />
              {c.feature.tag ? <span className="cp-chip">{c.feature.tag}</span> : null}
            </div>
          ) : null}
          {c.feature.big ? <strong>{c.feature.big}</strong> : null}
          {c.feature.label ? <small>{c.feature.label}</small> : null}
          {c.feature.title ? <b>{c.feature.title}</b> : null}
          {c.feature.text ? <p>{c.feature.text}</p> : null}
          <Act c={c} to={{ label: c.feature.button, href: c.feature.href }} id="feature" className="cp-btn">
            <span>{c.feature.button}</span> <ArrowRight />
          </Act>
        </div>
      ) : null,
    text:
      c.about.title || c.about.body || c.about.quote ? (
        <div className="cp-about">
          {c.about.image ? (
            <div className="cp-about-img">
              <Img src={c.about.image} />
            </div>
          ) : null}
          {c.about.label ? (
            <div className="cp-eyebrow">
              <i>
                <Paw />
              </i>
              <span className="cp-chip">{c.about.label}</span>
            </div>
          ) : null}
          {c.about.title ? (
            <h2 className="cp-h">
              <Lines lines={split(c.about.title)} />
            </h2>
          ) : null}
          {c.about.body ? <p>{c.about.body}</p> : null}
          {c.about.quote ? (
            <blockquote>
              “{c.about.quote}”{c.about.author ? <cite>{c.about.author}</cite> : null}
            </blockquote>
          ) : null}
        </div>
      ) : null,
    stats: c.stats.length ? (
      <div className="cp-stats">
        {c.stats.map((s, i) => (
          <div key={i}>
            {s.value ? <b>{s.value}</b> : null}
            {s.label ? <span>{s.label}</span> : null}
          </div>
        ))}
      </div>
    ) : null,
    catalog:
      c.catalog.items.length || c.catalog.title ? (
        <div className="cp-catalog">
          {faces.length ? (
            <div className="cp-faces">
              {faces.map((src, i) => (
                <span key={i}>
                  <Img src={src} />
                </span>
              ))}
              <i>+</i>
            </div>
          ) : null}
          {c.catalog.label ? <span className="cp-label">{c.catalog.label}</span> : null}
          {c.catalog.title ? (
            <h2 className="cp-h">
              <Lines lines={split(c.catalog.title)} />
            </h2>
          ) : null}
          {c.strip.length ? (
            <div className="cp-strip">
              {c.strip.map((word, i) => (
                <span key={i} className={i === 0 ? "on" : undefined}>
                  {word}
                </span>
              ))}
            </div>
          ) : null}
          {c.catalog.items.length ? (
            <div className="cp-grid">
              {c.catalog.items.map((block) => (
                <Item key={block.id} c={c} block={block} className="cp-prod">
                  <span className="cp-prod-img">
                    <Img src={block.imageUrl} alt={block.title} />
                    {block.label ? <span className="cp-chip">{block.label}</span> : null}
                  </span>
                  <b>{block.title}</b>
                  {block.description ? <small>{block.description}</small> : null}
                  {block.price || block.buttonText ? (
                    <span className="cp-prod-foot">
                      {block.price ? <em>{price(block.price)}</em> : <span />}
                      {block.buttonText ? (
                        <span className="cp-go">
                          {block.buttonText} <ArrowRight />
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                </Item>
              ))}
            </div>
          ) : null}
        </div>
      ) : null,
    nav: c.chips.length ? (
      <div className="cp-nav">
        {c.chipsTitle ? <h2 className="cp-h sm">{c.chipsTitle}</h2> : null}
        <div className="cp-chips">
          {c.chips.map((chip, i) => (
            <Act key={i} c={c} to={chip} id={`chip-${i}`} className={i === 0 ? "on" : undefined} />
          ))}
        </div>
      </div>
    ) : null,
    links:
      c.links.items.length || c.links.title ? (
        <div className="cp-links">
          {c.links.label ? (
            <div className="cp-eyebrow">
              <i>
                <Paw />
              </i>
              <span className="cp-chip">{c.links.label}</span>
            </div>
          ) : null}
          {c.links.title ? (
            <h2 className="cp-h">
              <Lines lines={split(c.links.title)} />
            </h2>
          ) : null}
          {c.links.items.length ? (
            <div className="cp-rows">
              {c.links.items.map((block, i) => (
                <Item key={block.id} c={c} block={block} className="cp-row">
                  {block.imageUrl ? (
                    <span className="cp-row-img">
                      <Img src={block.imageUrl} alt="" />
                    </span>
                  ) : (
                    <span className="cp-row-n">{String(i + 1).padStart(2, "0")}</span>
                  )}
                  <span className="cp-row-body">
                    {block.label ? <small>{block.label}</small> : null}
                    <b>{block.title}</b>
                    {block.subtitle ? <span>{block.subtitle}</span> : null}
                  </span>
                  <i>
                    <ArrowRight />
                  </i>
                </Item>
              ))}
            </div>
          ) : null}
        </div>
      ) : null,
    hours:
      c.hours.days.length || c.hours.title ? (
        <div className="cp-hours">
          {c.hours.title ? <h2 className="cp-h sm">{c.hours.title}</h2> : null}
          {c.hours.note ? <p>{c.hours.note}</p> : null}
          {c.hours.days.length ? (
            <div className="cp-days">
              {c.hours.days.map((day, i) => (
                <div key={i} className={`${day.highlight ? "on" : ""} ${day.closed ? "off" : ""}`}>
                  <span>{day.label}</span>
                  <b>{day.time}</b>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null,
    promo:
      c.final.title || c.final.button ? (
        <div className="cp-final">
          <span className="cp-final-paw">
            <Paw />
          </span>
          {c.final.title ? (
            <h2 className="cp-title">
              <Lines lines={split(c.final.title)} />
            </h2>
          ) : null}
          {c.final.text ? <p>{c.final.text}</p> : null}
          <Act c={c} to={{ label: c.final.button, href: c.final.href }} id="cta-final" className="cp-pill">
            <span>{c.final.button}</span>
            <i>
              <ArrowRight />
            </i>
          </Act>
        </div>
      ) : null,
    footer: (
      <div className="cp-footer">
        <div className="cp-brand">
          {c.logo ? <Img src={c.logo} alt="" className="cp-logo" /> : <Paw />}
          <b>{c.brand}</b>
        </div>
        <Socials c={c} className="cp-socials" />
        <span>{c.footerText || `${c.brand} © ${new Date().getFullYear()}`}</span>
      </div>
    ),
  };
};
