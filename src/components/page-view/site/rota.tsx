"use client";

import type { CSSProperties } from "react";
import { Act, ArrowRight, Calendar, Img, Item, Lines, Socials, split, Star, StatIcon, type SiteRender } from "./kit";

const car = { viewBox: "0 0 32 20", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
// One outline per category row: sedan, SUV, van, diamond (premium).
const CAT_ICONS = [
  <svg key="a" {...car}><path d="M3 14v-2.500c0-1.200.8-2 2-2.200L9 9l2.600-3.200c.6-.8 1.400-1.300 2.400-1.300h5c1 0 1.900.4 2.600 1.200L24.500 9l2.700.600c1.100.3 1.800 1.100 1.800 2.200V14h-2.500M9.500 14h13" /><circle cx="7.5" cy="14.500" r="2" /><circle cx="24.500" cy="14.500" r="2" /></svg>,
  <svg key="b" {...car}><path d="M3 14.500V9.500l3-.500 2.500-4.500h12L24 9l3.500.500c.9.200 1.500.900 1.500 1.800v3.200h-2M9.500 14.500h13M8.500 9h15.500" /><circle cx="7.500" cy="14.500" r="2" /><circle cx="24.500" cy="14.500" r="2" /></svg>,
  <svg key="c" {...car}><path d="M3 14.500V6c0-.800.700-1.500 1.500-1.500h15.500c.900 0 1.700.400 2.200 1.100L26 10l2 .600c.600.200 1 .700 1 1.400v2.500h-2.500M9.500 14.500h13M3 9.500h22.500M11 4.500v5M18 4.500v5" /><circle cx="7.500" cy="14.500" r="2" /><circle cx="24.500" cy="14.500" r="2" /></svg>,
  <svg key="d" {...car}><path d="M10 3h12l5 5.500L16 18 5 8.500zM5 8.500h22M12.500 8.500 16 18l3.500-9.500M10 3l2.500 5.500L16 3l3.500 5.500L22 3" /></svg>,
];

// "Rota" — car rental, graphite and cream with a red accent. Reference: a
// rental landing (giant brand word behind the car, red wedge, cream sections).
export const rota: SiteRender = (c) => {
  const first = c.catalog.items[0];
  const giant = { "--n": Math.max(c.brand.length, 3) } as CSSProperties;
  const price = (text: string) => {
    const [value, unit] = text.split("/").map((s) => s.trim());
    return (
      <>
        {value}
        {unit ? <small> / {unit}</small> : null}
      </>
    );
  };
  const specs = (text: string) => text.split("·").map((s) => s.trim()).filter(Boolean);
  const [who, role] = c.about.author.split(/[,·|]/).map((s) => s.trim());
  const wordmark = (
    <div className="ro-brand">
      {c.logo ? <Img src={c.logo} alt="" className="ro-logo" /> : null}
      <b>{c.brand}</b>
      {c.brandSub ? <i>{c.brandSub}</i> : null}
    </div>
  );
  return {
    hero: (
      <div className="ro-hero">
        <div className="ro-bar">
          {c.hero.showName ? wordmark : <span />}
          <Socials c={c} className="ro-socials" max={3} />
        </div>
        <div className="ro-stage" style={c.hero.coverStyle}>
          {c.hero.showName ? (
            <div className="ro-giant" style={giant} aria-hidden>
              {c.brand}
            </div>
          ) : null}
          <i className="ro-band" />
          {c.hero.photo ? (
            <div className="ro-photo">
              <Img src={c.hero.photo} alt={c.brand} style={c.hero.photoStyle} />
            </div>
          ) : null}
        </div>
        <div className="ro-head">
          {c.hero.pill ? <span className="ro-tag">{c.hero.pill}</span> : null}
          {c.hero.lines.length ? (
            <h1 className="ro-h1">
              <Lines lines={c.hero.lines} />
            </h1>
          ) : null}
          {c.hero.sub ? <p className="ro-sub">{c.hero.sub}</p> : null}
          {c.hero.cta.label || c.hero.cta2.label ? (
            <div className="ro-btns">
              <Act c={c} to={c.hero.cta} id="cta" className="ro-btn" />
              <Act c={c} to={c.hero.cta2} id="cta2" className="ro-btn line" />
            </div>
          ) : null}
          {c.hero.card.name ? (
            <Act c={c} to={{ label: c.hero.card.name, href: c.hero.card.href }} id="hero-card" className="ro-herocard">
              {c.hero.photo ? (
                <span className="ro-herocard-img">
                  <Img src={c.hero.photo} alt="" />
                </span>
              ) : null}
              <span className="ro-herocard-body">
                {c.hero.card.label ? <small>{c.hero.card.label}</small> : null}
                <b>{c.hero.card.name}</b>
                {c.hero.card.price ? <em>{price(c.hero.card.price)}</em> : null}
              </span>
            </Act>
          ) : null}
        </div>
      </div>
    ),
    text:
      c.about.title || c.about.body || c.about.quote || c.strip.length ? (
        <>
          {c.about.title || c.about.body || c.about.image || c.strip.length ? (
            <div className="ro-about">
              {c.about.image ? (
                <div className="ro-about-img">
                  <Img src={c.about.image} />
                </div>
              ) : null}
              {c.about.label ? <span className="ro-label">( {c.about.label} )</span> : null}
              {c.about.title ? (
                <h2 className="ro-h2">
                  <Lines lines={split(c.about.title)} />
                </h2>
              ) : null}
              {c.about.body ? <p className="ro-p">{c.about.body}</p> : null}
              {c.about.title || c.about.body ? (
                <Act c={c} to={c.hero.cta} id="cta-about" className="ro-btn">
                  {c.hero.cta.label} <ArrowRight />
                </Act>
              ) : null}
              {c.strip.length ? (
                <div className="ro-tiles">
                  {c.strip.map((word, i) => (
                    <span key={i}>
                      <StatIcon index={i + 2} />
                      {word}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {c.about.quote ? (
            <figure className="ro-quote">
              <blockquote>
                <i>“</i>
                {c.about.quote}
                <i>”</i>
              </blockquote>
              <figcaption>
                {who ? <b>{who}</b> : null}
                {role ? <small>{role}</small> : null}
                <span className="ro-stars">
                  <Star />
                  <Star />
                  <Star />
                  <Star />
                  <Star />
                </span>
              </figcaption>
            </figure>
          ) : null}
        </>
      ) : null,
    stats: c.stats.length ? (
      <div className="ro-stats">
        {c.stats.map((s, i) => (
          <div key={i}>
            <b>{s.value}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    ) : null,
    feature:
      c.feature.title || c.feature.big ? (
        <div className="ro-offer">
          <div className="ro-offer-card">
            {c.feature.image ? <Img src={c.feature.image} className="ro-offer-img" /> : null}
            <div className="ro-offer-body">
              {c.feature.tag ? <span className="ro-tag">{c.feature.tag}</span> : null}
              {c.feature.big ? <strong>{c.feature.big}</strong> : null}
              {c.feature.label ? <small>{c.feature.label}</small> : null}
              {c.feature.title ? (
                <h2>
                  <Lines lines={split(c.feature.title)} />
                </h2>
              ) : null}
              {c.feature.text ? <p>{c.feature.text}</p> : null}
              <Act c={c} to={{ label: c.feature.button, href: c.feature.href }} id="feature" className="ro-btn sm">
                {c.feature.button} <ArrowRight />
              </Act>
            </div>
          </div>
        </div>
      ) : null,
    nav: c.chips.length ? (
      <div className="ro-cats">
        {c.chipsTitle ? <h2 className="ro-cats-h">{c.chipsTitle}</h2> : null}
        {c.chips.map((chip, i) => (
          <Act key={i} c={c} to={chip} id={`chip-${i}`} className="ro-cat">
            <span className="ro-cat-ic">{CAT_ICONS[i % CAT_ICONS.length]}</span>
            <span className="ro-cat-tx">
              <b>{chip.label}</b>
              <ArrowRight />
            </span>
          </Act>
        ))}
      </div>
    ) : null,
    catalog:
      c.catalog.items.length || c.catalog.title ? (
        <div className="ro-catalog">
          {c.catalog.label ? <span className="ro-label">( {c.catalog.label} )</span> : null}
          {c.catalog.title ? (
            <h2 className="ro-h2">
              <Lines lines={split(c.catalog.title)} />
            </h2>
          ) : null}
          {c.catalog.items.length ? (
            <div className="ro-grid">
              {c.catalog.items.map((block, i) => (
                <Item key={block.id} c={c} block={block} className="ro-car">
                  {block.label ? <span className="ro-car-tag">{block.label}</span> : null}
                  {block.imageUrl ? (
                    <span className="ro-car-img">
                      <Img src={block.imageUrl} alt={block.title} />
                    </span>
                  ) : null}
                  <b>{block.title}</b>
                  {block.description ? <span className="ro-car-specs">{specs(block.description).slice(0, 3).join(" · ")}</span> : null}
                  <span className="ro-car-foot">
                    {block.price ? <em>{price(block.price)}</em> : <span />}
                    <span className={i === 0 ? "ro-round on" : "ro-round"}>
                      <Calendar />
                    </span>
                  </span>
                </Item>
              ))}
            </div>
          ) : null}
          {first && first.buttonText ? (
            <Item c={c} block={first} className="ro-detail">
              {first.imageUrl ? (
                <span className="ro-detail-img">
                  <i />
                  <Img src={first.imageUrl} alt={first.title} />
                </span>
              ) : null}
              {first.label ? <span className="ro-tag">{first.label}</span> : null}
              <b>{first.title}</b>
              <span className="ro-stars">
                <Star />
                <Star />
                <Star />
                <Star />
                <Star />
              </span>
              {first.price ? <em>{price(first.price)}</em> : null}
              {first.description ? (
                <span className="ro-detail-specs">
                  {specs(first.description).map((spec, i) => (
                    <span key={i}>{spec}</span>
                  ))}
                </span>
              ) : null}
              <span className="ro-btn wide">
                {first.buttonText} <ArrowRight />
              </span>
            </Item>
          ) : null}
        </div>
      ) : null,
    links:
      c.links.items.length || c.links.title ? (
        <div className="ro-faq">
          {c.links.label ? <span className="ro-tag">{c.links.label}</span> : null}
          {c.links.title ? (
            <h2 className="ro-h2 ro-ac">
              <Lines lines={split(c.links.title)} />
            </h2>
          ) : null}
          <div className="ro-faq-list">
            {c.links.items.map((block, i) => (
              <Item key={block.id} c={c} block={block} className={block.subtitle ? "ro-q open" : "ro-q"}>
                <span className="ro-q-top">
                  <StatIcon index={i} />
                  <b>{block.title}</b>
                  <i>{block.subtitle ? "−" : "+"}</i>
                </span>
                {block.subtitle ? <span className="ro-q-body">{block.subtitle}</span> : null}
              </Item>
            ))}
          </div>
        </div>
      ) : null,
    promo:
      c.final.title || c.final.button ? (
        <div className="ro-final">
          {c.final.title ? (
            <h2 className="ro-h2 ro-ac">
              <Lines lines={split(c.final.title)} />
            </h2>
          ) : null}
          {c.final.text ? <p className="ro-p">{c.final.text}</p> : null}
          <Act c={c} to={{ label: c.final.button, href: c.final.href }} id="cta-final" className="ro-btn">
            {c.final.button} <ArrowRight />
          </Act>
        </div>
      ) : null,
    hours:
      c.hours.days.length || c.hours.title ? (
        <div className="ro-form">
          <div className="ro-form-card">
            {c.hours.title ? <h2>{c.hours.title}</h2> : null}
            {c.hours.days.map((day, i) => (
              <div key={i} className={`ro-field${day.highlight ? " on" : ""}${day.closed ? " off" : ""}`}>
                <small>{day.label}</small>
                <span>{day.time}</span>
              </div>
            ))}
            {c.hours.note ? <p>{c.hours.note}</p> : null}
          </div>
        </div>
      ) : null,
    footer: (
      <div className="ro-foot">
        {wordmark}
        <p>{c.footerText || `${c.brand} © ${new Date().getFullYear()}`}</p>
        <Socials c={c} className="ro-socials" />
        <div className="ro-giant" style={giant} aria-hidden>
          {c.brand}
        </div>
      </div>
    ),
  };
};
