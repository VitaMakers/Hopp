"use client";

import { Act, ArrowUp, Cart, Img, Item, Lines, Socials, split, Star, type SiteRender } from "./kit";

// Spec icons of the numbers row (strength, layers, energy, lab), by position.
function SpecIcon({ index }: { index: number }) {
  const paths = [
    <path key="a" d="M6 20c-1.7-2.5-2-5.5-.5-8 1-1.7 2.7-2.5 4.5-2.5V5.5C10 4.1 11.1 3 12.5 3S15 4.1 15 5.5V8M10 9.5c2.2-1.2 4.8-.9 6.7.7 2.7 2.3 3 6.4 1.3 9.8H6M10 14c1.3-.9 2.8-.9 4 0" />,
    <path key="b" d="m12 3 9 4.5-9 4.5-9-4.5zM3 12l9 4.5 9-4.5M3 16.5 12 21l9-4.5" />,
    <path key="c" d="M13 2 5 13.5h6L10 22l9-12.5h-6.5z" />,
    <path key="d" d="M9.5 3h5M10.5 3v6L5 18.5c-.6 1.1.2 2.5 1.5 2.5h11c1.3 0 2.1-1.4 1.5-2.5L13.5 9V3M8 15h8" />,
  ];
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" aria-hidden>
      {paths[index % paths.length]}
    </svg>
  );
}

// "Vigor" — sports nutrition store, black and deep red, tall condensed
// uppercase titles and square buttons. Reference: a supplement shop (cover
// with the athlete, approach block, category tiles, banner, product detail).
export const vigor: SiteRender = (c) => {
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
  const catalogHead =
    c.catalog.title || c.catalog.label ? (
      <div className="vg-row-head">
        {c.catalog.title ? <h2 className="vg-h">{c.catalog.title}</h2> : <span />}
        {c.catalog.label ? (
          <span className="vg-more">
            {c.catalog.label} <ArrowUp />
          </span>
        ) : null}
      </div>
    ) : null;
  return {
    hero: (
      <div className="vg-hero" style={c.hero.coverStyle}>
        {c.hero.photo ? (
          <div className="vg-photo">
            <Img src={c.hero.photo} alt={c.brand} style={c.hero.photoStyle} />
          </div>
        ) : null}
        <div className="vg-bar">
          {c.hero.showName ? (
            <div className="vg-brand">
              {c.logo ? <Img src={c.logo} alt="" className="vg-logo" /> : null}
              <span>
                <b>{c.brand}</b>
                {c.brandSub ? <small>{c.brandSub}</small> : null}
              </span>
            </div>
          ) : (
            <span />
          )}
          <Socials c={c} className="vg-socials" max={3} />
        </div>
        <div className="vg-head">
          {c.hero.pill ? <span className="vg-label">{c.hero.pill}</span> : null}
          {c.hero.lines.length ? (
            <h1 className="vg-title">
              <Lines lines={c.hero.lines} />
            </h1>
          ) : null}
          {c.hero.sub ? <p className="vg-sub">{c.hero.sub}</p> : null}
          {c.hero.cta.label || c.hero.cta2.label ? (
            <div className="vg-btns">
              <Act c={c} to={c.hero.cta} id="cta" className="vg-btn">
                {c.hero.cta.label} <ArrowUp />
              </Act>
              <Act c={c} to={c.hero.cta2} id="cta2" className="vg-btn line" />
            </div>
          ) : null}
          {c.hero.card.name ? (
            <Act c={c} to={{ label: c.hero.card.name, href: c.hero.card.href }} id="hero-card" className="vg-herocard">
              <span>
                {c.hero.card.label ? <small>{c.hero.card.label}</small> : null}
                <b>{c.hero.card.name}</b>
              </span>
              {c.hero.card.price ? <em>{price(c.hero.card.price)}</em> : null}
            </Act>
          ) : null}
        </div>
      </div>
    ),
    text:
      c.about.title || c.about.body || c.about.quote ? (
        <div className="vg-about">
          {c.about.image ? (
            <div className="vg-about-img">
              <Img src={c.about.image} />
            </div>
          ) : null}
          {c.about.label ? <span className="vg-label">{c.about.label}</span> : null}
          {c.about.title ? (
            <h2 className="vg-title vg-title2">
              <Lines lines={split(c.about.title)} accent="" />
            </h2>
          ) : null}
          {c.about.body ? <p>{c.about.body}</p> : null}
          {c.about.quote ? <blockquote>“{c.about.quote}”</blockquote> : null}
          <Act c={c} to={{ label: c.about.author, href: c.hero.cta.href }} id="about-link" className="vg-more">
            {c.about.author} <ArrowUp />
          </Act>
        </div>
      ) : null,
    links:
      c.links.items.length || c.links.title ? (
        <div className="vg-links">
          {c.links.title || c.links.label ? (
            <div className="vg-row-head">
              {c.links.title ? <h2 className="vg-h">{c.links.title}</h2> : <span />}
              {c.links.label ? (
                <span className="vg-more">
                  {c.links.label} <ArrowUp />
                </span>
              ) : null}
            </div>
          ) : null}
          {c.links.items.length ? (
            <div className="vg-tiles">
              {c.links.items.map((block) => (
                <Item key={block.id} c={c} block={block} className="vg-tile">
                  {block.imageUrl ? <Img src={block.imageUrl} alt="" /> : null}
                  {block.label ? <small className="vg-tile-tag">{block.label}</small> : null}
                  <span className="vg-tile-body">
                    <span>
                      <b>{block.title}</b>
                      {block.subtitle ? <small>{block.subtitle}</small> : null}
                    </span>
                    <ArrowUp />
                  </span>
                </Item>
              ))}
            </div>
          ) : null}
        </div>
      ) : null,
    feature:
      c.feature.title || c.feature.big ? (
        <div className="vg-feature">
          {c.feature.image ? (
            <div className="vg-feature-img">
              <Img src={c.feature.image} />
            </div>
          ) : null}
          <div className="vg-feature-body">
            {c.feature.tag ? <span className="vg-label">{c.feature.tag}</span> : null}
            {c.feature.big ? <strong>{c.feature.big}</strong> : null}
            {c.feature.label ? <small>{c.feature.label}</small> : null}
            {c.feature.title ? (
              <h2 className="vg-title vg-title3">
                <Lines lines={split(c.feature.title)} />
              </h2>
            ) : null}
            {c.feature.text ? <p>{c.feature.text}</p> : null}
            <Act c={c} to={{ label: c.feature.button, href: c.feature.href }} id="feature" className="vg-btn">
              {c.feature.button} <ArrowUp />
            </Act>
          </div>
        </div>
      ) : null,
    catalog:
      c.catalog.items.length || c.catalog.title ? (
        <div className="vg-catalog">
          {rest.length ? null : catalogHead}
          {first ? (
            <Item c={c} block={first} className="vg-pdp">
              <span className="vg-shot">
                <Img src={first.imageUrl} alt={first.title} />
              </span>
              <span className="vg-pdp-body">
                {first.label ? <span className="vg-label">{first.label}</span> : null}
                <b className="vg-title vg-title2">{first.title}</b>
                {first.description ? <span className="vg-pdp-text">{first.description}</span> : null}
                {first.price ? <em>{price(first.price)}</em> : null}
                <span className="vg-stars" aria-hidden>
                  <Star />
                  <Star />
                  <Star />
                  <Star />
                  <Star />
                </span>
                {c.strip.length ? (
                  <span className="vg-sizes">
                    {c.strip.map((word, i) => (
                      <span key={i} className={i === 0 ? "on" : undefined}>
                        {word}
                      </span>
                    ))}
                  </span>
                ) : null}
                {first.buttonText ? (
                  <span className="vg-buy">
                    <span className="vg-qty" aria-hidden>
                      <i>−</i>
                      <i>1</i>
                      <i>+</i>
                    </span>
                    <span className="vg-btn">{first.buttonText}</span>
                  </span>
                ) : null}
              </span>
            </Item>
          ) : null}
          {rest.length ? catalogHead : null}
          {rest.length ? (
            <div className="vg-grid">
              {rest.map((block) => (
                <Item key={block.id} c={c} block={block} className="vg-card">
                  <span className="vg-shot">
                    <Img src={block.imageUrl} alt={block.title} />
                  </span>
                  <span className="vg-card-body">
                    {block.label ? <small>{block.label}</small> : null}
                    <b>{block.title}</b>
                    <span className="vg-card-foot">
                      <em>{block.price ? price(block.price) : null}</em>
                      <i>
                        <Cart />
                      </i>
                    </span>
                  </span>
                </Item>
              ))}
            </div>
          ) : null}
        </div>
      ) : null,
    stats: c.stats.length ? (
      <div className="vg-stats">
        {c.stats.map((s, i) => (
          <div key={i}>
            <SpecIcon index={i} />
            {s.value ? <b>{s.value}</b> : null}
            {s.label ? <span>{s.label}</span> : null}
          </div>
        ))}
      </div>
    ) : null,
    hours:
      c.hours.days.length || c.hours.title ? (
        <div className="vg-acc">
          {c.hours.title ? <h2 className="vg-h">{c.hours.title}</h2> : null}
          {c.hours.note ? <p>{c.hours.note}</p> : null}
          {c.hours.days.length ? (
            <div className="vg-acc-rows">
              {c.hours.days.map((day, i) => (
                <div key={i} className={`${day.highlight ? "on" : ""} ${day.closed ? "off" : ""}`}>
                  <b>{day.label}</b>
                  {day.time ? <span>{day.time}</span> : null}
                  <i aria-hidden>+</i>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null,
    nav: c.chips.length ? (
      <div className="vg-nav">
        {c.chipsTitle ? <span className="vg-label">{c.chipsTitle}</span> : null}
        <div className="vg-sizes">
          {c.chips.map((chip, i) => (
            <Act key={i} c={c} to={chip} id={`chip-${i}`} className={i === 0 ? "on" : undefined} />
          ))}
        </div>
      </div>
    ) : null,
    promo:
      c.final.title || c.final.button ? (
        <div className="vg-final">
          {c.final.title ? (
            <h2 className="vg-title vg-title3">
              <Lines lines={split(c.final.title)} />
            </h2>
          ) : null}
          {c.final.text ? <p>{c.final.text}</p> : null}
          <Act c={c} to={{ label: c.final.button, href: c.final.href }} id="cta-final" className="vg-btn">
            {c.final.button} <ArrowUp />
          </Act>
        </div>
      ) : null,
    footer: <span className="vg-footer">{c.footerText || `${c.brand} © ${new Date().getFullYear()}`}</span>,
  };
};
