"use client";

import { Act, ArrowRight, Calendar, Heart, Img, Item, Lines, Pin, Socials, split, type SiteRender } from "./kit";

// "Vetta" — car rental, black and red, heavy italic titles. Reference: a
// rental app (cover with the car, pickup card, category tiles, car list).
export const vetta: SiteRender = (c) => {
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
  return {
    hero: (
      <div className="vt-hero" style={c.hero.coverStyle}>
        {c.hero.photo ? (
          <div className="vt-photo">
            <Img src={c.hero.photo} alt={c.brand} style={c.hero.photoStyle} />
          </div>
        ) : null}
        <div className="vt-bar">
          {c.hero.showName ? (
            <div className="vt-brand">
              {c.logo ? <Img src={c.logo} alt="" className="vt-logo" /> : <i>{"//"}</i>}
              <span>
                <b>{c.brand}</b>
                {c.brandSub ? <small>{c.brandSub}</small> : null}
              </span>
            </div>
          ) : (
            <span />
          )}
          <Socials c={c} className="vt-socials" max={2} />
        </div>
        <div className="vt-head">
          {c.hero.pill ? <span className="vt-pill">{c.hero.pill}</span> : null}
          {c.hero.lines.length ? (
            <h1 className="vt-title">
              <Lines lines={c.hero.lines} />
            </h1>
          ) : null}
          {c.hero.sub ? <p className="vt-sub">{c.hero.sub}</p> : null}
          {c.hero.card.name ? (
            <Act c={c} to={{ label: c.hero.card.name, href: c.hero.card.href }} id="hero-card" className="vt-herocard">
              {c.hero.card.label ? <small>{c.hero.card.label}</small> : null}
              <b>{c.hero.card.name}</b>
              {c.hero.card.price ? <em>{price(c.hero.card.price)}</em> : null}
            </Act>
          ) : null}
        </div>
      </div>
    ),
    hours:
      c.hours.days.length || c.hours.title ? (
        <div className="vt-form">
          {c.hours.title || c.hours.note ? (
            <div className="vt-form-top">
              <Pin />
              <span>
                <small>{c.hours.title}</small>
                <b>{c.hours.note}</b>
              </span>
            </div>
          ) : null}
          <div className="vt-form-grid">
            {c.hours.days.map((day, i) => (
              <div key={i} className={`${day.highlight ? "on" : ""} ${day.closed ? "off" : ""}`}>
                {i % 2 === 0 ? <Calendar /> : null}
                <span>
                  <small>{day.label}</small>
                  <b>{day.time}</b>
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null,
    nav:
      c.chips.length || c.hero.cta.label ? (
        <div className="vt-nav">
          {c.chipsTitle ? <h2 className="vt-h">{c.chipsTitle}</h2> : null}
          {c.chips.length ? (
            <div className="vt-tiles">
              {c.chips.map((chip, i) => (
                <Act key={i} c={c} to={chip} id={`chip-${i}`} className={i === 0 ? "on" : undefined}>
                  <svg viewBox="0 0 32 16" aria-hidden>
                    <path d="M2 11c0-2 1.5-3 4-3.400L10 4.500C11 3.5 12.5 3 14 3h6c2 0 3.5.700 5 2l2.5 2.200c1.8.400 2.5 1.5 2.5 3V11h-3a3 3 0 0 0-6 0h-8a3 3 0 0 0-6 0z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  </svg>
                  {chip.label}
                </Act>
              ))}
            </div>
          ) : null}
          <Act c={c} to={c.hero.cta} id="cta" className="vt-cta">
            {c.hero.cta.label} <ArrowRight />
          </Act>
        </div>
      ) : null,
    stats: c.stats.length ? (
      <div className="vt-stats">
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
        <div className="vt-catalog">
          {c.catalog.label ? <span className="vt-label">{c.catalog.label}</span> : null}
          {c.catalog.title ? (
            <h2 className="vt-title vt-title2">
              <Lines lines={split(c.catalog.title)} />
            </h2>
          ) : null}
          {c.strip.length ? (
            <div className="vt-pills">
              {c.strip.map((word, i) => (
                <span key={i} className={i === 0 ? "on" : undefined}>
                  {word}
                </span>
              ))}
            </div>
          ) : null}
          {first ? (
            <Item c={c} block={first} className="vt-car">
              <span className="vt-car-img">
                <Img src={first.imageUrl} alt={first.title} />
                <Heart />
              </span>
              <span className="vt-car-body">
                <span className="vt-car-top">
                  <span>
                    <b>{first.title}</b>
                    {first.label ? <small>{first.label}</small> : null}
                  </span>
                  {first.price ? <em>{price(first.price)}</em> : null}
                </span>
                {first.description ? (
                  <span className="vt-specs">
                    {first.description.split("·").map((spec, i) => (
                      <span key={i}>{spec.trim()}</span>
                    ))}
                  </span>
                ) : null}
                {first.buttonText ? (
                  <span className="vt-cta sm">
                    {first.buttonText} <ArrowRight />
                  </span>
                ) : null}
              </span>
            </Item>
          ) : null}
          {rest.length ? (
            <div className="vt-list">
              {rest.map((block) => (
                <Item key={block.id} c={c} block={block} className="vt-row">
                  <span className="vt-row-img">
                    <Img src={block.imageUrl} alt={block.title} />
                  </span>
                  <span className="vt-row-body">
                    <b>{block.title}</b>
                    {block.label ? <small>{block.label}</small> : null}
                    {block.price ? <em>{price(block.price)}</em> : null}
                  </span>
                  <Heart />
                </Item>
              ))}
            </div>
          ) : null}
        </div>
      ) : null,
    text:
      c.about.title || c.about.body || c.about.quote ? (
        <div className="vt-about">
          {c.about.image ? (
            <div className="vt-about-img">
              <Img src={c.about.image} />
            </div>
          ) : null}
          {c.about.label ? <span className="vt-label">{c.about.label}</span> : null}
          {c.about.title ? <h2 className="vt-h big">{c.about.title}</h2> : null}
          {c.about.body ? <p>{c.about.body}</p> : null}
          {c.about.quote ? (
            <blockquote>
              “{c.about.quote}”{c.about.author ? <cite>{c.about.author}</cite> : null}
            </blockquote>
          ) : null}
        </div>
      ) : null,
    feature:
      c.feature.title || c.feature.big ? (
        <div className="vt-feature">
          {c.feature.image ? <Img src={c.feature.image} className="vt-feature-img" /> : null}
          <div className="vt-feature-body">
            {c.feature.tag ? <span className="vt-label">{c.feature.tag}</span> : null}
            {c.feature.big ? <strong>{c.feature.big}</strong> : null}
            {c.feature.label ? <small>{c.feature.label}</small> : null}
            {c.feature.title ? <b>{c.feature.title}</b> : null}
            {c.feature.text ? <p>{c.feature.text}</p> : null}
            <Act c={c} to={{ label: c.feature.button, href: c.feature.href }} id="feature" className="vt-cta sm">
              {c.feature.button} <ArrowRight />
            </Act>
          </div>
        </div>
      ) : null,
    links:
      c.links.items.length || c.links.title ? (
        <div className="vt-links">
          {c.links.label ? <span className="vt-label">{c.links.label}</span> : null}
          {c.links.title ? <h2 className="vt-h">{c.links.title}</h2> : null}
          <div className="vt-links-grid">
            {c.links.items.map((block) => (
              <Item key={block.id} c={c} block={block}>
                {block.title}
              </Item>
            ))}
          </div>
        </div>
      ) : null,
    promo:
      c.final.title || c.final.button ? (
        <div className="vt-final">
          {c.final.title ? (
            <h2 className="vt-title vt-title2">
              <Lines lines={split(c.final.title)} />
            </h2>
          ) : null}
          {c.final.text ? <p>{c.final.text}</p> : null}
          <Act c={c} to={{ label: c.final.button, href: c.final.href }} id="cta-final" className="vt-cta">
            {c.final.button} <ArrowRight />
          </Act>
        </div>
      ) : null,
    footer: <span className="vt-footer">{c.footerText || `${c.brand} © ${new Date().getFullYear()}`}</span>,
  };
};
