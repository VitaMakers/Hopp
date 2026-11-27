"use client";

import type { CSSProperties } from "react";
import { Act, ArrowRight, Chevron, Heart, Img, Item, Lines, Socials, split, type SiteRender } from "./kit";

// "Atelier" — menswear store, off-white and black, greyscale photos and heavy
// uppercase grotesque titles. Reference: a fashion landing page (giant faded
// brand word behind the model, testimonial, rounded black editorial block,
// intro with numbers, product with big price, black banner, newsletter).
export const atelier: SiteRender = (c) => {
  const [first, ...rest] = c.catalog.items;
  const price = (text: string) => {
    const [value, unit] = text.split("/").map((s) => s.trim());
    return (
      <>
        {value}
        {unit ? <small> / {unit}</small> : null}
      </>
    );
  };
  // The cover card borrows the photo of the product it names.
  const cardName = c.hero.card.name.toLowerCase();
  const cardImage = (c.catalog.items.find((b) => b.title.trim().toLowerCase() === cardName && b.imageUrl) ?? c.catalog.items.find((b) => b.imageUrl))?.imageUrl ?? "";
  const [who, role] = c.about.author.split(/\s*[·|,]\s*/);
  const [lead, ...more] = c.about.body.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  const thumbs = rest.filter((b) => b.imageUrl).slice(0, 2);
  const block = c.about.title || c.about.body || c.about.image;
  return {
    hero: (
      <div className="at-hero">
        <div className="at-bar">
          {c.hero.showName ? (
            <div className="at-brand">
              {c.logo ? <Img src={c.logo} alt="" className="at-logo" /> : null}
              <span>
                <b>{c.brand}</b>
                {c.brandSub ? <small>{c.brandSub}</small> : null}
              </span>
            </div>
          ) : (
            <span />
          )}
          <Socials c={c} className="at-socials" max={3} />
        </div>
        {c.hero.pill ? <span className="at-pill">{c.hero.pill}</span> : null}
        <div className={`at-stage ${c.hero.photo ? "" : "nop"}`} style={c.hero.coverStyle}>
          {c.hero.showName ? (
            <span className="at-ghost" aria-hidden style={{ "--n": Math.max(c.brand.length, 5) } as CSSProperties}>
              {c.brand}
            </span>
          ) : null}
          {c.hero.photo ? (
            <div className={`at-photo ${c.hero.cutout ? "cut" : ""}`}>
              <Img src={c.hero.photo} alt={c.brand} style={c.hero.photoStyle} />
            </div>
          ) : null}
          {c.hero.card.name ? (
            <Act c={c} to={{ label: c.hero.card.name, href: c.hero.card.href }} id="hero-card" className="at-card">
              {cardImage ? (
                <span className="at-card-img">
                  <Img src={cardImage} alt="" />
                </span>
              ) : null}
              {c.hero.card.label ? <small>{c.hero.card.label}</small> : null}
              <b>{c.hero.card.name}</b>
              {c.hero.card.price ? <em>{price(c.hero.card.price)}</em> : null}
              <i className="at-round">
                <Chevron />
              </i>
            </Act>
          ) : null}
          <div className="at-head">
            {c.hero.lines.length ? (
              <h1 className="at-title">
                <Lines lines={c.hero.lines} />
              </h1>
            ) : null}
            {c.hero.sub ? <p className="at-sub">{c.hero.sub}</p> : null}
            {c.hero.cta.label || (c.hero.cta2.label && !block) ? (
              <div className="at-actions">
                <Act c={c} to={c.hero.cta} id="cta" className="at-btn">
                  {c.hero.cta.label} <ArrowRight />
                </Act>
                {block ? null : <Act c={c} to={c.hero.cta2} id="cta2" className="at-btn line" />}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    ),
    nav: c.chips.length ? (
      <div className={`at-nav ${c.chipsTitle ? "" : "bare"}`}>
        {c.chipsTitle ? <h2 className="at-h">{c.chipsTitle}</h2> : null}
        <div className="at-menu">
          {c.chips.map((chip, i) => (
            <Act key={i} c={c} to={chip} id={`chip-${i}`} className={i === 0 ? "on" : undefined} />
          ))}
        </div>
      </div>
    ) : null,
    text:
      block || c.about.quote ? (
        <div className="at-text">
          {c.about.quote ? (
            <div className="at-say">
              {c.about.label ? (
                <div className="at-say-side">
                  <b>{c.about.label}</b>
                  <span className="at-arrows" aria-hidden>
                    <i className="at-round back">
                      <Chevron />
                    </i>
                    <i className="at-round">
                      <Chevron />
                    </i>
                  </span>
                </div>
              ) : null}
              <blockquote>
                <span className="at-mark" aria-hidden>
                  ”
                </span>
                <p>“{c.about.quote}”</p>
                {who ? (
                  <cite>
                    <i aria-hidden>{who.charAt(0)}</i>
                    <span>
                      <b>{who}</b>
                      {role ? <small>{role}</small> : null}
                    </span>
                  </cite>
                ) : null}
              </blockquote>
            </div>
          ) : null}
          {block ? (
            <div className="at-ink">
              {!c.about.quote && c.about.label ? <span className="at-label">{c.about.label}</span> : null}
              {c.about.title ? (
                <h2 className="at-title at-title2">
                  <Lines lines={split(c.about.title)} />
                </h2>
              ) : null}
              {lead ? <p className="at-lead">{lead}</p> : null}
              {c.about.image ? (
                <div className="at-big">
                  <div>
                    <Img src={c.about.image} alt="" />
                  </div>
                  <i />
                  <i />
                </div>
              ) : null}
              {thumbs.length ? (
                <div className="at-thumbs">
                  {thumbs.map((b) => (
                    <Item key={b.id} c={c} block={b}>
                      <Img src={b.imageUrl} alt={b.title} />
                    </Item>
                  ))}
                </div>
              ) : null}
              {more.length ? <p className="at-more">{more.join("\n\n")}</p> : null}
              <Act c={c} to={c.hero.cta2} id="cta2" className="at-btn line" />
            </div>
          ) : null}
        </div>
      ) : null,
    hours:
      c.hours.days.length || c.hours.title || c.hours.note ? (
        <div className="at-intro">
          {c.hours.title ? (
            <h2 className="at-h">
              <Lines lines={split(c.hours.title)} accent="" />
            </h2>
          ) : null}
          {c.hours.note ? <p>{c.hours.note}</p> : null}
          {c.hours.days.length ? (
            <div className="at-rows">
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
    stats: c.stats.length ? (
      <div className="at-stats">
        {c.stats.map((s, i) => (
          <div key={i}>
            <b>{s.value}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    ) : null,
    catalog:
      c.catalog.items.length || c.catalog.title ? (
        <div className="at-catalog">
          {c.catalog.label ? <span className="at-label">{c.catalog.label}</span> : null}
          {c.catalog.title ? (
            <h2 className="at-h big">
              <Lines lines={split(c.catalog.title)} accent="" />
            </h2>
          ) : null}
          {first ? (
            <Item c={c} block={first} className="at-prod">
              {first.imageUrl ? (
                <span className="at-prod-img">
                  <Img src={first.imageUrl} alt={first.title} />
                </span>
              ) : null}
              <span className="at-prod-body">
                {first.description ? <span className="at-prod-text">{first.description}</span> : null}
                {first.label ? <small>{first.label}</small> : null}
                <b>{first.title}</b>
                {first.price ? <em>{price(first.price)}</em> : null}
                <span className="at-prod-buy">
                  {first.buttonText ? <span className="at-btn line sm">{first.buttonText}</span> : null}
                  <i className="at-round">
                    <Heart />
                  </i>
                </span>
              </span>
            </Item>
          ) : null}
          {rest.length ? (
            <div className="at-swatches">
              {rest.map((b) => (
                <Item key={b.id} c={c} block={b}>
                  <span className="at-swatch">
                    <Img src={b.imageUrl} alt={b.title} />
                  </span>
                  <b>{b.title}</b>
                  {b.price ? <em>{price(b.price)}</em> : null}
                </Item>
              ))}
            </div>
          ) : null}
          {c.strip.length ? (
            <div className="at-strip">
              {c.strip.map((word, i) => (
                <span key={i}>{word}</span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null,
    feature:
      c.feature.title || c.feature.big ? (
        <div className={`at-banner ${c.feature.image ? "" : "nop"}`}>
          {c.feature.image ? (
            <div className="at-banner-img">
              <Img src={c.feature.image} alt="" />
            </div>
          ) : null}
          <div className="at-banner-body">
            {c.feature.tag ? <span className="at-label">{c.feature.tag}</span> : null}
            {c.feature.big ? <strong>{c.feature.big}</strong> : null}
            {c.feature.label ? <small>{c.feature.label}</small> : null}
            {c.feature.title ? (
              <h2 className="at-title">
                <Lines lines={split(c.feature.title)} />
              </h2>
            ) : null}
            {c.feature.text ? <p>{c.feature.text}</p> : null}
            <Act c={c} to={{ label: c.feature.button, href: c.feature.href }} id="feature" className="at-btn inv">
              {c.feature.button} <ArrowRight />
            </Act>
          </div>
        </div>
      ) : null,
    promo:
      c.final.title || c.final.button ? (
        <div className="at-final">
          {c.final.title ? (
            <div className="at-final-top">
              <h2>
                <Lines lines={split(c.final.title)} accent="" />
              </h2>
              <i className="at-round" aria-hidden>
                <ArrowRight />
              </i>
            </div>
          ) : null}
          {c.final.text ? <p>{c.final.text}</p> : null}
          <Act c={c} to={{ label: c.final.button, href: c.final.href }} id="cta-final" className="at-field">
            <span>{c.final.button}</span>
            <ArrowRight />
          </Act>
        </div>
      ) : null,
    links:
      c.links.items.length || c.links.title ? (
        <div className="at-links">
          {c.links.label ? <span className="at-label">{c.links.label}</span> : null}
          {c.links.title ? <h2 className="at-h sm">{c.links.title}</h2> : null}
          {c.links.items.length ? (
            <div className="at-links-grid">
              {c.links.items.map((b) => (
                <Item key={b.id} c={c} block={b}>
                  {b.imageUrl ? (
                    <span className="at-link-img">
                      <Img src={b.imageUrl} alt="" />
                    </span>
                  ) : null}
                  <span>
                    {b.title}
                    {b.subtitle ? <small>{b.subtitle}</small> : null}
                  </span>
                </Item>
              ))}
            </div>
          ) : null}
        </div>
      ) : null,
    footer: <span className="at-footer">{c.footerText || `${c.brand} © ${new Date().getFullYear()}`}</span>,
  };
};
