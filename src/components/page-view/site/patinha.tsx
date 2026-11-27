"use client";

import type { ReactNode } from "react";
import { Act, ArrowRight, Cart, Chevron, Heart, Img, Item, Lines, Socials, Star, split, type SiteRender } from "./kit";

const ico = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, width: "1em", height: "1em", "aria-hidden": true };

const Paw = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" aria-hidden>
    <ellipse cx="4.6" cy="10.4" rx="2.1" ry="2.7" transform="rotate(-22 4.6 10.4)" />
    <ellipse cx="9.2" cy="5.6" rx="2.2" ry="2.9" transform="rotate(-8 9.2 5.6)" />
    <ellipse cx="14.8" cy="5.6" rx="2.2" ry="2.9" transform="rotate(8 14.8 5.6)" />
    <ellipse cx="19.4" cy="10.4" rx="2.1" ry="2.7" transform="rotate(22 19.4 10.4)" />
    <path d="M12 11.2c-3.1 0-6 3.4-6 6.300 0 1.9 1.4 2.9 3 2.900 1.2 0 1.9-.600 3-.600s1.800.600 3 .600c1.600 0 3-1 3-2.900 0-2.900-2.900-6.300-6-6.300z" />
  </svg>
);
const Search = () => (
  <svg {...ico}>
    <circle cx="11" cy="11" r="6.500" />
    <path d="m16 16 4.500 4.500" />
  </svg>
);
// One icon per category of the dark panel: bone, ball, bowl, bed.
const CAT: ReactNode[] = [
  <g key="a">
    <circle cx="16.2" cy="5.8" r="1.9" />
    <circle cx="18.2" cy="7.8" r="1.9" />
    <circle cx="5.8" cy="16.2" r="1.9" />
    <circle cx="7.8" cy="18.2" r="1.9" />
    <path d="M7.4 14.200 14.200 7.400M9.800 16.600l6.800-6.800" />
  </g>,
  <g key="b">
    <circle cx="12" cy="12" r="8" />
    <path d="M6.300 6.400c3 2.400 3 8.800 0 11.200M17.700 6.400c-3 2.400-3 8.800 0 11.200" />
  </g>,
  <g key="c">
    <path d="M3.500 17.500 6 9.500h12l2.500 8a1 1 0 0 1-1 1.300h-15a1 1 0 0 1-1-1.300z" />
    <path d="M6 9.500c0-1.700 2.700-3 6-3s6 1.300 6 3" />
  </g>,
  <g key="d">
    <path d="M3 17v-4.500a2 2 0 0 1 4 0V14h10v-1.500a2 2 0 0 1 4 0V17a1.500 1.500 0 0 1-1.500 1.500h-15A1.500 1.500 0 0 1 3 17z" />
    <path d="M6 10.600V8a2.500 2.500 0 0 1 2.500-2.500h7A2.500 2.500 0 0 1 18 8v2.600" />
  </g>,
];
// Icons of the option rows: box, truck, shield, tag.
const ROW: ReactNode[] = [
  <path key="a" d="m12 3 8 4.300v9.400L12 21l-8-4.300V7.300zM4 7.300l8 4.300 8-4.300M12 11.600V21" />,
  <g key="b">
    <path d="M2.500 6.500h11v10h-11zM13.500 10h4l3 3v3.500h-7" />
    <circle cx="7" cy="17.500" r="1.800" />
    <circle cx="17" cy="17.500" r="1.800" />
  </g>,
  <path key="c" d="M12 3 5 5.800v5.700c0 4.300 2.900 7.700 7 9.500 4.100-1.800 7-5.200 7-9.500V5.800zM9 12l2.200 2.200L15.200 10" />,
  <g key="d">
    <path d="M3.500 12.200V4.500h7.700l9.300 9.300-7.700 7.700z" />
    <circle cx="8" cy="9" r="1.300" />
  </g>,
];

// "Patinha" — pet shop app in white, red and black. Reference: a pet store
// app (shop home, black showcase panel, product-detail screen).
export const patinha: SiteRender = (c) => {
  const price = (text: string) => {
    const [value, unit] = text.split("/").map((s) => s.trim());
    return (
      <>
        {value}
        {unit ? <small> / {unit}</small> : null}
      </>
    );
  };
  const chipsOf = (time: string) => time.split("·").map((s) => s.trim()).filter(Boolean);
  const featureLabel = c.feature.button || c.feature.title || c.feature.big;
  const panel = c.final.title || c.final.text || c.final.button || c.hero.photo || c.strip.length;
  return {
    hero: (
      <div className="pt-hero">
        <div className="pt-bar">
          {c.hero.showName ? (
            <div className="pt-brand">
              {c.logo ? <Img src={c.logo} alt="" className="pt-logo" /> : <Paw />}
              <span>
                <b>{c.brand}</b>
                {c.brandSub ? <small>{c.brandSub}</small> : null}
              </span>
            </div>
          ) : (
            <span />
          )}
          <Socials c={c} className="pt-socials" max={2} />
        </div>
        {c.hero.pill ? <span className="pt-hello">{c.hero.pill}</span> : null}
        {c.hero.lines.length ? (
          <h1 className="pt-title">
            <Lines lines={c.hero.lines} />
          </h1>
        ) : null}
        {c.hero.sub ? <p className="pt-sub">{c.hero.sub}</p> : null}
        {c.hero.card.name ? (
          <Act c={c} to={{ label: c.hero.card.name, href: c.hero.card.href }} id="hero-card" className="pt-herocard">
            <span>
              {c.hero.card.label ? <small>{c.hero.card.label}</small> : null}
              <b>{c.hero.card.name}</b>
            </span>
            {c.hero.card.price ? <em>{price(c.hero.card.price)}</em> : null}
          </Act>
        ) : null}
      </div>
    ),
    nav:
      c.chips.length || c.hero.cta2.label ? (
        <div className="pt-nav">
          {c.chipsTitle ? <h2 className="pt-h">{c.chipsTitle}</h2> : null}
          {c.chips.length ? (
            <div className="pt-tabs">
              {c.chips.map((chip, i) => (
                <Act key={i} c={c} to={chip} id={`chip-${i}`} className={i === 0 ? "on" : undefined} />
              ))}
            </div>
          ) : null}
          <Act c={c} to={c.hero.cta2} id="cta2" className="pt-search">
            <Search />
            <span>{c.hero.cta2.label}</span>
          </Act>
        </div>
      ) : null,
    feature:
      c.feature.title || c.feature.big || c.feature.image ? (
        <div className={`pt-banner ${c.feature.image ? "" : "noimg"}`}>
          {c.feature.image ? (
            <div className="pt-banner-img">
              <Img src={c.feature.image} />
            </div>
          ) : null}
          <div className="pt-banner-body">
            {c.feature.tag ? <span className="pt-tag">{c.feature.tag}</span> : null}
            {c.feature.label ? <small className="pt-label">{c.feature.label}</small> : null}
            {c.feature.title ? (
              <h2>
                <Lines lines={split(c.feature.title)} accent="" />
              </h2>
            ) : null}
            {c.feature.big ? <strong>{c.feature.big}</strong> : null}
            {c.feature.text ? <p>{c.feature.text}</p> : null}
            <Act c={c} to={{ label: featureLabel, href: c.feature.href }} id="feature" className="pt-round">
              <ArrowRight />
            </Act>
          </div>
        </div>
      ) : null,
    catalog:
      c.catalog.items.length || c.catalog.title ? (
        <div className="pt-catalog">
          {c.catalog.title || c.catalog.label ? (
            <div className="pt-headrow">
              <h2 className="pt-h">{c.catalog.title}</h2>
              {c.catalog.label ? <span>{c.catalog.label}</span> : null}
            </div>
          ) : null}
          {c.catalog.items.length ? (
            <div className="pt-grid">
              {c.catalog.items.map((block) => (
                <Item key={block.id} c={c} block={block} className="pt-card">
                  <span className="pt-card-img">
                    <Img src={block.imageUrl} alt={block.title} />
                    <Heart />
                  </span>
                  <span className="pt-card-foot">
                    <span className="pt-card-txt">
                      {block.label ? <small>{block.label}</small> : null}
                      <b>{block.title}</b>
                      {block.price ? <em>{price(block.price)}</em> : null}
                    </span>
                    <span className="pt-round sm">
                      <Cart />
                    </span>
                  </span>
                </Item>
              ))}
            </div>
          ) : null}
        </div>
      ) : null,
    promo: panel ? (
      <div className="pt-panel">
        {c.final.title ? (
          <h2 className="pt-panel-title">
            <Lines lines={split(c.final.title)} accent="" />
          </h2>
        ) : null}
        {c.final.text ? <p className="pt-panel-text">{c.final.text}</p> : null}
        {c.hero.photo ? (
          <div className="pt-panel-photo" style={c.hero.coverStyle}>
            <Img src={c.hero.photo} alt={c.brand} style={c.hero.photoStyle} />
          </div>
        ) : null}
        {c.strip.length ? (
          <div className="pt-cats">
            {c.strip.map((word, i) => (
              <span key={i} className={i === 0 ? "on" : undefined}>
                <i>
                  <svg {...ico}>{CAT[i % CAT.length]}</svg>
                </i>
                {word}
              </span>
            ))}
          </div>
        ) : null}
        <Act c={c} to={{ label: c.final.button, href: c.final.href }} id="cta-final" className="pt-cta">
          <span>{c.final.button}</span>
          <ArrowRight />
        </Act>
      </div>
    ) : null,
    text:
      c.about.title || c.about.body || c.about.quote || c.about.image ? (
        <div className="pt-detail">
          {c.about.image ? (
            <div className="pt-detail-img">
              <Img src={c.about.image} alt={c.about.title} />
            </div>
          ) : null}
          {c.about.label ? <small className="pt-label">{c.about.label}</small> : null}
          {c.about.title ? (
            <h2 className="pt-caps">
              <Lines lines={split(c.about.title)} accent="" />
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
      <div className="pt-stats">
        {c.stats.map((s, i) => (
          <div key={i} className={i > 0 && i === c.stats.length - 1 ? "pr" : undefined}>
            {i === 0 ? <Star /> : null}
            <b>{s.value}</b>
            {s.label ? <span>{s.label}</span> : null}
          </div>
        ))}
      </div>
    ) : null,
    hours:
      c.hours.days.length || c.hours.title ? (
        <div className="pt-opts">
          {c.hours.title ? <h2 className="pt-h">{c.hours.title}</h2> : null}
          {c.hours.days.map((day, i) => {
            const chips = chipsOf(day.time);
            const mid = Math.floor(chips.length / 2);
            return (
              <div key={i} className={`pt-opt ${day.closed ? "off" : ""}`}>
                <b>{day.label}</b>
                <span>
                  {chips.map((chip, j) => (
                    <i key={j} className={day.highlight && j === mid ? "on" : undefined}>
                      {chip}
                    </i>
                  ))}
                </span>
              </div>
            );
          })}
          {c.hours.note ? <p className="pt-note">{c.hours.note}</p> : null}
        </div>
      ) : null,
    links:
      c.links.items.length || c.links.title || c.hero.cta.label ? (
        <div className="pt-links">
          {c.links.label ? <small className="pt-label">{c.links.label}</small> : null}
          {c.links.title ? <h2 className="pt-h">{c.links.title}</h2> : null}
          {c.links.items.length ? (
            <div className="pt-rows">
              {c.links.items.map((block, i) => (
                <Item key={block.id} c={c} block={block} className="pt-row">
                  {block.imageUrl ? (
                    <span className="pt-row-img">
                      <Img src={block.imageUrl} />
                    </span>
                  ) : (
                    <svg {...ico}>{ROW[i % ROW.length]}</svg>
                  )}
                  <span className="pt-row-body">
                    <b>{block.title}</b>
                    {block.subtitle ? <small>{block.subtitle}</small> : null}
                  </span>
                  {block.label ? <em>{block.label}</em> : null}
                  <span className="pt-chev">
                    <Chevron />
                  </span>
                </Item>
              ))}
            </div>
          ) : null}
          {c.hero.cta.label ? (
            <div className="pt-buy">
              <Act c={c} to={{ label: c.feature.button, href: c.feature.href }} id="buy" className="pt-btn ghost" />
              <Act c={c} to={c.hero.cta} id="cta" className="pt-btn" />
            </div>
          ) : null}
        </div>
      ) : null,
    footer: (
      <span className="pt-footer">
        <Paw /> {c.footerText || `${c.brand} © ${new Date().getFullYear()}`}
      </span>
    ),
  };
};
