"use client";

import { Act, ArrowRight, Calendar, Chevron, Img, Item, Socials, Star, split, type SiteRender } from "./kit";

// "Navalha" — barbershop, warm near-black and beige, thin uppercase titles.
// Reference: a booking app (full photo cover with two pills, service cards
// with the photo fading in on the right, booking screen with time slots).
export const navalha: SiteRender = (c) => {
  // Title lines: the last word of every line takes the accent colour.
  const title = (list: string[]) =>
    list.map((line, i) => {
      const cut = line.lastIndexOf(" ");
      return (
        <span key={i} className="nv-line">
          {cut < 0 ? line : (
            <>
              {line.slice(0, cut)} <span className="ac">{line.slice(cut + 1)}</span>
            </>
          )}
        </span>
      );
    });
  const price = (text: string) => {
    const [value, unit] = text.split("/").map((s) => s.trim());
    return (
      <>
        {value}
        {unit ? <small> / {unit}</small> : null}
      </>
    );
  };
  // "Role ★ 4,9": the star becomes the accent icon.
  const rated = (text: string) =>
    text.split("★").map((piece, i) => (
      <span key={i}>
        {i > 0 ? <Star /> : null}
        {piece.trim()}
      </span>
    ));
  const circle = (
    <span className="nv-circle">
      <ArrowRight />
    </span>
  );
  return {
    hero: (
      <div className="nv-hero" style={c.hero.coverStyle}>
        {c.hero.photo ? (
          <div className="nv-photo">
            <Img src={c.hero.photo} alt={c.brand} style={c.hero.photoStyle} />
          </div>
        ) : null}
        <div className="nv-bar">
          {c.hero.showName ? (
            <div className="nv-brand">
              {c.logo ? <Img src={c.logo} alt="" className="nv-logo" /> : null}
              <span>
                <b>{c.brand}</b>
                {c.brandSub ? <small>{c.brandSub}</small> : null}
              </span>
            </div>
          ) : (
            <span />
          )}
          <i className="nv-dash" />
        </div>
        <div className="nv-head">
          {c.hero.pill ? <span className="nv-label">{c.hero.pill}</span> : null}
          {c.hero.lines.length ? <h1 className="nv-title">{title(c.hero.lines)}</h1> : null}
          {c.hero.sub ? <p className="nv-sub">{c.hero.sub}</p> : null}
          <i className="nv-rule" />
          {c.hero.cta.label || c.hero.cta2.label ? (
            <div className="nv-btns">
              <Act c={c} to={c.hero.cta2} id="cta2" className="nv-btn line" />
              <Act c={c} to={c.hero.cta} id="cta" className="nv-btn fill">
                <span>{c.hero.cta.label}</span>
                <Chevron />
              </Act>
            </div>
          ) : null}
          {c.hero.card.name ? (
            <Act c={c} to={{ label: c.hero.card.name, href: c.hero.card.href }} id="hero-card" className="nv-guest">
              {circle}
              <span>
                {c.hero.card.label ? <small>{c.hero.card.label}</small> : null}
                {c.hero.card.name}
                {c.hero.card.price ? <em>{price(c.hero.card.price)}</em> : null}
              </span>
            </Act>
          ) : null}
        </div>
      </div>
    ),
    nav:
      c.chips.length || c.chipsTitle || c.strip.length ? (
        <div className="nv-nav">
          {c.chipsTitle ? <h2 className="nv-h">{c.chipsTitle}</h2> : null}
          {c.chips.length ? (
            <div className="nv-tabs">
              {c.chips.map((chip, i) => (
                <Act key={i} c={c} to={chip} id={`chip-${i}`} className={i === 0 ? "on" : undefined} />
              ))}
            </div>
          ) : null}
          {c.strip.length ? (
            <div className="nv-strip">
              {c.strip.map((word, i) => (
                <span key={i}>{word}</span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null,
    catalog:
      c.catalog.items.length || c.catalog.title ? (
        <div className="nv-catalog">
          {c.catalog.label ? <span className="nv-label">{c.catalog.label}</span> : null}
          {c.catalog.title ? <h2 className="nv-title nv-title2">{title(split(c.catalog.title))}</h2> : null}
          {c.catalog.items.map((block) => (
            <Item key={block.id} c={c} block={block} className={`nv-svc ${block.imageUrl ? "" : "plain"}`}>
              {block.imageUrl ? (
                <span className="nv-svc-img">
                  <Img src={block.imageUrl} alt={block.title} />
                </span>
              ) : null}
              <span className="nv-svc-body">
                {block.label ? <small>{block.label}</small> : null}
                <b>{block.title}</b>
                {block.description ? <span className="nv-svc-text">{block.description}</span> : null}
                {block.price ? <em>{price(block.price)}</em> : null}
                {block.buttonText ? <span className="nv-svc-btn">{block.buttonText}</span> : null}
              </span>
              {circle}
            </Item>
          ))}
        </div>
      ) : null,
    feature:
      c.feature.title || c.feature.big ? (
        <div className={`nv-feature ${c.feature.image ? "" : "plain"}`}>
          {c.feature.image ? (
            <div className="nv-feature-img">
              <Img src={c.feature.image} alt={c.feature.title} />
            </div>
          ) : null}
          <div className="nv-feature-body">
            <i className="nv-rule" />
            {c.feature.tag ? <span className="nv-tag">{c.feature.tag}</span> : null}
            {c.feature.label ? <span className="nv-label">{c.feature.label}</span> : null}
            <div className="nv-feature-row">
              {c.feature.title ? <h2>{c.feature.title}</h2> : null}
              {c.feature.big || c.feature.text ? (
                <div className="nv-price">
                  {c.feature.big ? <strong>{c.feature.big}</strong> : null}
                  {c.feature.text ? <small>{c.feature.text}</small> : null}
                </div>
              ) : null}
            </div>
            <Act c={c} to={{ label: c.feature.button, href: c.feature.href }} id="feature" className="nv-btn line sm">
              <span>{c.feature.button}</span>
              <Chevron />
            </Act>
          </div>
        </div>
      ) : null,
    text:
      c.about.title || c.about.body || c.about.quote ? (
        <div className="nv-about">
          {c.about.label ? <span className="nv-label">{c.about.label}</span> : null}
          {c.about.title || c.about.body ? (
            <div className="nv-box nv-person">
              {c.about.image ? (
                <span className="nv-avatar">
                  <Img src={c.about.image} alt={c.about.title} />
                </span>
              ) : null}
              <span className="nv-person-body">
                {c.about.title ? <b>{c.about.title}</b> : null}
                {c.about.body ? <span className="nv-role">{rated(c.about.body)}</span> : null}
              </span>
              <Chevron />
            </div>
          ) : null}
          {c.about.quote ? (
            <blockquote>
              “{c.about.quote}”{c.about.author ? <cite>{c.about.author}</cite> : null}
            </blockquote>
          ) : null}
        </div>
      ) : null,
    hours:
      c.hours.days.length || c.hours.title || c.hours.note ? (
        <div className="nv-hours">
          {c.hours.title || c.hours.note ? (
            <div className="nv-box nv-date">
              <Calendar />
              <span className="nv-date-body">
                {c.hours.title ? <b>{c.hours.title}</b> : null}
                {c.hours.note ? <small>{c.hours.note}</small> : null}
              </span>
              <Chevron />
            </div>
          ) : null}
          {c.hours.days.length ? (
            <div className="nv-slots">
              {c.hours.days.map((day, i) => (
                <span key={i} className={`${day.highlight ? "on" : ""} ${day.closed ? "off" : ""}`}>
                  {day.label}
                  {day.time ? <small>{day.time}</small> : null}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null,
    promo:
      c.final.title || c.final.button ? (
        <div className="nv-final">
          {c.final.title ? <h2 className="nv-title nv-title2">{title(split(c.final.title))}</h2> : null}
          {c.final.text ? <p>{c.final.text}</p> : null}
          <Act c={c} to={{ label: c.final.button, href: c.final.href }} id="cta-final" className="nv-book">
            <span>{c.final.button}</span>
            <Chevron />
          </Act>
        </div>
      ) : null,
    stats: c.stats.length ? (
      <div className="nv-stats">
        {c.stats.map((s, i) => (
          <div key={i}>
            <b>{s.value}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    ) : null,
    links:
      c.links.items.length || c.links.title ? (
        <div className="nv-links">
          {c.links.label ? <span className="nv-label">{c.links.label}</span> : null}
          {c.links.title ? <h2 className="nv-title nv-title2">{title(split(c.links.title))}</h2> : null}
          {c.links.items.map((block) => (
            <Item key={block.id} c={c} block={block} className="nv-box nv-link">
              {block.imageUrl ? (
                <span className="nv-avatar">
                  <Img src={block.imageUrl} alt={block.title} />
                </span>
              ) : null}
              <span className="nv-person-body">
                {block.label ? <small>{block.label}</small> : null}
                <b>{block.title}</b>
                {block.subtitle ? <span className="nv-role">{block.subtitle}</span> : null}
              </span>
              <Chevron />
            </Item>
          ))}
        </div>
      ) : null,
    footer: (
      <>
        <Socials c={c} className="nv-socials" />
        <span className="nv-footer">{c.footerText || `${c.brand} © ${new Date().getFullYear()}`}</span>
      </>
    ),
  };
};
