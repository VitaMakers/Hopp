"use client";

import type { ReactNode } from "react";
import { Act, ArrowRight, ArrowUp, Img, Item, Lines, Pin, Socials, split, type SiteCtx, type SiteRender } from "./kit";

const ico = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, width: "1em", height: "1em", "aria-hidden": true };
const Bell = () => <svg {...ico}><path d="M6.5 16.500V11a5.500 5.500 0 0 1 11 0v5.500l1.500 2H5z" /><path d="M10 20.500a2.200 2.200 0 0 0 4 0" /></svg>;
const Bars = () => <svg {...ico} strokeWidth={2.2}><path d="M7 18v-5M12 18V7M17 18v-8" /></svg>;
const Building = () => <svg {...ico}><path d="M5 20V6l8-2v16M13 9h6v11M3 20h18M8 9h2M8 12.500h2M8 16h2M16 12.500h.5M16 16h.5" /></svg>;
const SPEC_ICONS: ReactNode[] = [
  <svg key="bed" {...ico}><path d="M3 18v-6.500a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2V18M3 15.500h18M6 9.500V7a1.500 1.500 0 0 1 1.500-1.500h9A1.500 1.500 0 0 1 18 7v2.500M3 18v1.500M21 18v1.500" /></svg>,
  <svg key="bath" {...ico}><path d="M3 12h18v2.500a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zM6 12V6.500a2 2 0 0 1 4 0M7 18.500l-1 2M17 18.500l1 2" /></svg>,
  <svg key="area" {...ico}><rect x="4" y="4" width="16" height="16" rx="1.5" /><path d="M4 9h3M4 15h3M17 9h3M17 15h3" /></svg>,
];
const ROW_ICONS: ReactNode[] = [
  <svg key="plan" {...ico}><rect x="4" y="4" width="16" height="16" rx="1.5" /><path d="M12 4v5M12 13v7M4 13h4M16 13h4" /></svg>,
  <svg key="layers" {...ico}><path d="m12 4 9 4.500-9 4.500-9-4.500zM3 12.500l9 4.500 9-4.500M3 16.500 12 21l9-4.500" /></svg>,
];

// "Label: value" in one field (falls back to value only).
const pair = (text: string): [string, string] => {
  const i = text.indexOf(":");
  return i > 0 ? [text.slice(0, i).trim(), text.slice(i + 1).trim()] : ["", text];
};
// "200 m² Área total" -> ["200 m²", "Área total"].
const spec = (text: string): [string, string] => {
  const m = text.match(/^(\S+(?:\s(?:m²|m2|km|ha|vagas?))?)\s+(.+)$/i);
  return m ? [m[1], m[2]] : [text, ""];
};
// Bar height from "62%" (any number inside the text); 4–100.
const height = (time: string) => {
  const n = parseFloat(time.replace(",", "."));
  return Number.isFinite(n) ? Math.min(100, Math.max(4, n)) : 55;
};
const hidden = (c: SiteCtx, part: string) => c.doc.premium.hiddenParts.includes(`premium:${part}`);

// "Lume" — real estate, sky blue fading to white, yellow pills and one dark
// panel. Reference: a property app (cover, property overview, insights).
export const lume: SiteRender = (c) => {
  const tabs = (inside: boolean) =>
    c.chips.length ? (
      <div className="lm-tabs-wrap" data-edit={inside ? "premium:nav" : undefined}>
        {c.chipsTitle ? <span className="lm-label">{c.chipsTitle}</span> : null}
        <div className="lm-tabs">
          {c.chips.map((chip, i) => (
            <Act key={i} c={c} to={chip} id={`chip-${i}`} className={i === 0 ? "on" : undefined} />
          ))}
        </div>
      </div>
    ) : null;
  const card = c.hero.card;
  const hasCard = !!(card.name || card.price || card.label);
  const [location, ...specs] = c.feature.text.split("·").map((s) => s.trim()).filter(Boolean);
  const [availLabel, availValue] = pair(c.feature.button);
  const top = c.stats.slice(0, 2);
  const tiles = c.stats.slice(2, 4);
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
      <div className="lm-hero">
        <div className="lm-bar">
          {c.hero.showName ? (
            <div className="lm-brand">
              {c.logo ? <Img src={c.logo} alt="" className="lm-logo" /> : null}
              <span>
                <b>{c.brand}</b>
                {c.brandSub ? <small>{c.brandSub}</small> : null}
              </span>
            </div>
          ) : (
            <span />
          )}
          <span className="lm-round">
            <Bell />
          </span>
        </div>
        <div className="lm-head">
          {c.hero.pill ? <span className="lm-pill">{c.hero.pill}</span> : null}
          {c.hero.lines.length ? (
            <h1 className="lm-title">
              <Lines lines={c.hero.lines} />
            </h1>
          ) : null}
          {c.hero.sub ? <p className="lm-sub">{c.hero.sub}</p> : null}
          {hidden(c, "nav") ? null : tabs(true)}
        </div>
        {c.hero.photo || hasCard || c.hero.cta.label || c.hero.cta2.label ? (
          <div className={`lm-cover ${c.hero.photo ? "" : "nop"}`} style={c.hero.photo ? c.hero.coverStyle : undefined}>
            {c.hero.photo ? (
              <div className="lm-photo">
                <Img src={c.hero.photo} alt={c.brand} style={c.hero.photoStyle} />
              </div>
            ) : null}
            <div className="lm-over">
              {hasCard ? (
                <Act c={c} to={{ label: card.name || card.price || card.label, href: card.href }} id="hero-card" className="lm-prop">
                  {card.name ? <b>{card.name}</b> : null}
                  {card.label ? (
                    <span>
                      <Pin /> {card.label}
                    </span>
                  ) : null}
                  {card.price ? <em>{price(card.price)}</em> : null}
                </Act>
              ) : null}
              <Act c={c} to={c.hero.cta} id="cta" className="lm-cta">
                <span>{c.hero.cta.label}</span> <ArrowRight />
              </Act>
              <Act c={c} to={c.hero.cta2} id="cta2" className="lm-cta ghost">
                <span>{c.hero.cta2.label}</span> <ArrowRight />
              </Act>
              <div className="lm-dots" aria-hidden>
                <i />
                <i />
                <i />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    ),
    // The tabs live inside the cover; alone only when the cover is hidden.
    nav: hidden(c, "hero") && c.chips.length ? <div className="lm-nav">{tabs(false)}</div> : null,
    feature:
      c.feature.title || c.feature.big || c.feature.image || c.feature.label ? (
        <div className="lm-panel">
          {c.feature.title ? (
            <h2 className="lm-title lm-title2">
              <Lines lines={split(c.feature.title)} />
            </h2>
          ) : null}
          {c.feature.label ? <p className="lm-name">{c.feature.label}</p> : null}
          {location ? (
            <p className="lm-loc">
              <Pin /> {location}
            </p>
          ) : null}
          {c.feature.image ? (
            <div className="lm-panel-img">
              <Img src={c.feature.image} alt={c.feature.label} />
            </div>
          ) : null}
          {specs.length ? (
            <div className="lm-specs">
              {specs.slice(0, 3).map((text, i) => {
                const [value, label] = spec(text);
                return (
                  <div key={i}>
                    {SPEC_ICONS[i % SPEC_ICONS.length]}
                    <span>
                      <b>{value}</b>
                      {label ? <small>{label}</small> : null}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}
          {c.feature.tag || c.feature.big || c.feature.button ? (
            <div className="lm-duo">
              {c.feature.tag || c.feature.big ? (
                <div className="lm-box blue">
                  {c.feature.tag ? <small>{c.feature.tag}</small> : null}
                  {c.feature.big ? <b>{c.feature.big}</b> : null}
                </div>
              ) : null}
              <Act c={c} to={{ label: c.feature.button, href: c.feature.href }} id="feature" className="lm-box yellow">
                {availLabel ? <small>{availLabel}</small> : null}
                <b>{availValue}</b>
              </Act>
            </div>
          ) : null}
        </div>
      ) : null,
    links:
      c.links.items.length || c.links.title ? (
        <div className="lm-panel lm-rows">
          {c.links.label ? <span className="lm-label">{c.links.label}</span> : null}
          {c.links.title ? <h2 className="lm-h">{c.links.title}</h2> : null}
          {c.links.items.map((block, i) => (
            <Item key={block.id} c={c} block={block} className="lm-row">
              <span className="lm-row-ico">{block.imageUrl ? <Img src={block.imageUrl} alt="" /> : ROW_ICONS[i % ROW_ICONS.length]}</span>
              <span className="lm-row-body">
                <b>{block.title}</b>
                {block.subtitle ? <small>{block.subtitle}</small> : null}
              </span>
              {block.label ? <em>{block.label}</em> : null}
              <ArrowRight />
            </Item>
          ))}
        </div>
      ) : null,
    text:
      c.about.title || c.about.body || c.about.quote || c.about.image ? (
        <div className="lm-about">
          {c.about.label ? <span className="lm-label">{c.about.label}</span> : null}
          {c.about.title ? (
            <h2 className="lm-title lm-title2">
              <Lines lines={split(c.about.title)} />
            </h2>
          ) : null}
          {c.about.image ? (
            <div className="lm-about-img">
              <Img src={c.about.image} alt={c.about.title} />
            </div>
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
      <div className="lm-stats">
        <div className="lm-card lm-values">
          {top.map((s, i) => (
            <div key={i}>
              <small>{s.label}</small>
              <b>{s.value}</b>
            </div>
          ))}
        </div>
        {tiles.length ? (
          <div className="lm-duo">
            {tiles.map((s, i) => (
              <div key={i} className={`lm-tile ${i === 0 ? "yellow" : "blue"}`}>
                <i>{i === 0 ? <ArrowUp /> : <Bars />}</i>
                <span>
                  <small>{s.label}</small>
                  <b>{s.value}</b>
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    ) : null,
    hours:
      c.hours.days.length || c.hours.title || c.strip.length ? (
        <div className="lm-insights">
          {c.hours.days.length || c.hours.title ? (
            <div className="lm-card lm-chart">
              {c.hours.title || c.hours.note ? (
                <div className="lm-chart-top">
                  <b>{c.hours.title}</b>
                  {c.hours.note ? <span>{c.hours.note}</span> : null}
                </div>
              ) : null}
              {c.hours.days.length ? (
                <div className="lm-bars">
                  {c.hours.days.map((day, i) => (
                    <div key={i} className={`${day.highlight ? "on" : ""} ${day.closed ? "off" : ""}`} title={day.time}>
                      <span>
                        <i style={{ height: `${day.closed ? 4 : height(day.time)}%` }} />
                      </span>
                      <small>{day.label}</small>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {c.strip.length ? (
            <div className="lm-duo">
              {c.strip.map((word, i) => {
                const [label, value] = pair(word);
                return (
                  <div key={i} className="lm-card lm-info">
                    <i>{i % 2 === 0 ? <Pin /> : <Building />}</i>
                    <span>
                      {label ? <small>{label}</small> : null}
                      <b>{value}</b>
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null,
    catalog:
      c.catalog.items.length || c.catalog.title ? (
        <div className="lm-catalog">
          {c.catalog.label ? <span className="lm-label">{c.catalog.label}</span> : null}
          {c.catalog.title ? (
            <h2 className="lm-title lm-title2">
              <Lines lines={split(c.catalog.title)} />
            </h2>
          ) : null}
          <div className={`lm-grid ${c.catalog.items.length === 1 ? "one" : ""}`}>
            {c.catalog.items.map((block) => (
              <Item key={block.id} c={c} block={block} className="lm-card lm-item">
                {block.imageUrl ? (
                  <span className="lm-item-img">
                    <Img src={block.imageUrl} alt={block.title} />
                  </span>
                ) : null}
                <b>{block.title}</b>
                {block.label ? (
                  <small>
                    <Pin /> {block.label}
                  </small>
                ) : null}
                {block.description ? <span className="lm-item-desc">{block.description}</span> : null}
                {block.price ? <em>{price(block.price)}</em> : null}
                {block.buttonText ? (
                  <span className="lm-cta sm">
                    <span>{block.buttonText}</span> <ArrowRight />
                  </span>
                ) : null}
              </Item>
            ))}
          </div>
        </div>
      ) : null,
    promo:
      c.final.title || c.final.button ? (
        <div className="lm-panel lm-final">
          {c.final.title ? (
            <h2 className="lm-title lm-title2">
              <Lines lines={split(c.final.title)} />
            </h2>
          ) : null}
          {c.final.text ? <p>{c.final.text}</p> : null}
          <Act c={c} to={{ label: c.final.button, href: c.final.href }} id="cta-final" className="lm-cta">
            <span>{c.final.button}</span> <ArrowRight />
          </Act>
        </div>
      ) : null,
    footer: (
      <div className="lm-footer">
        <Socials c={c} className="lm-socials" />
        <span>{c.footerText || `${c.brand} © ${new Date().getFullYear()}`}</span>
      </div>
    ),
  };
};
