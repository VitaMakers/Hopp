"use client";

import { Act, ArrowRight, Check, Chevron, Img, Item, Lines, Play, Socials, split, type SiteRender } from "./kit";

const ico = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, width: "1em", height: "1em", "aria-hidden": true };
const Dumbbell = () => <svg {...ico}><path d="M3 9.500v5M6.5 7v10M17.5 7v10M21 9.500v5M6.5 12h11" /></svg>;
const Ring = () => <svg {...ico} strokeWidth={3}><path d="M12 4a8 8 0 1 0 8 8" /><path d="M15.5 4.800a8 8 0 0 1 3.700 3.700" opacity=".45" /></svg>;
const Flame = () => <svg {...ico}><path d="M12 21c-3.600 0-6-2.500-6-5.800 0-2.300 1.300-3.900 2.600-5.300.400 1.300 1.100 2 2 2.300C10.300 8.500 11.500 5.500 14 3c.300 3 4 5.500 4 11.200 0 3.800-2.400 6.800-6 6.800z" /><path d="M12 21c-1.400 0-2.400-1-2.400-2.500 0-1.500 1.200-2.300 2.400-3.900 1.200 1.600 2.400 2.400 2.400 3.900S13.400 21 12 21z" /></svg>;
const Pulse = () => <svg {...ico}><path d="M12 20s-7-4.400-7-10a4 4 0 0 1 7-2.600A4 4 0 0 1 19 10c0 5.600-7 10-7 10z" /></svg>;
const Clock = () => <svg {...ico}><circle cx="12" cy="12" r="8.500" /><path d="M12 7.500V12l3 2" /></svg>;
const Bars = () => <svg {...ico} strokeWidth={2.600}><path d="M6 19v-4M12 19v-9M18 19V5" /></svg>;
const Layers = () => <svg {...ico}><path d="m12 4 8 4-8 4-8-4zM4 12l8 4 8-4M4 16l8 4 8-4" /></svg>;
const Search = () => <svg {...ico}><circle cx="11" cy="11" r="6.500" /><path d="m16 16 4 4" /></svg>;
const STAT = [Dumbbell, Ring, Flame, Pulse];
const META = [Clock, Bars, Layers];

// "Forja" — gym / fitness, black and orange-red, heavy italic condensed
// titles, greyscale photos. Reference: a training app (cover with the
// athlete, membership card, numbers, workout of the day, light panel with
// the workout list, progress rows).
export const forja: SiteRender = (c) => {
  const [due, ...days] = c.hours.days;
  const parts = (text: string) => text.split(/[|·]/).map((s) => s.trim()).filter(Boolean);
  const num = (n: number) => String(n).padStart(2, "0");
  return {
    hero: (
      <div className="fj-hero" style={c.hero.coverStyle}>
        {c.hero.photo ? (
          <div className="fj-photo">
            <Img src={c.hero.photo} alt={c.brand} style={c.hero.photoStyle} />
          </div>
        ) : null}
        <div className="fj-bar">
          {c.hero.showName ? (
            <div className="fj-brand">
              {c.logo ? (
                <Img src={c.logo} alt="" className="fj-logo" />
              ) : (
                <i className="fj-slash">
                  <span />
                  <span />
                </i>
              )}
              <span>
                <b>{c.brand}</b>
                {c.brandSub ? <small>{c.brandSub}</small> : null}
              </span>
            </div>
          ) : (
            <span />
          )}
          <Socials c={c} className="fj-socials" max={2} />
        </div>
        <div className="fj-head">
          {c.hero.pill ? <span className="fj-label">{c.hero.pill}</span> : null}
          {c.hero.lines.length ? (
            <h1 className="fj-title">
              <Lines lines={c.hero.lines} />
            </h1>
          ) : null}
          {c.hero.sub ? <p className="fj-sub">{c.hero.sub}</p> : null}
        </div>
      </div>
    ),
    hours:
      c.hours.days.length || c.hours.title || c.hours.note ? (
        <div className="fj-member">
          <div className="fj-member-top">
            {c.hours.title || c.hours.note ? (
              <span className="fj-member-id">
                {c.hours.title ? <small>{c.hours.title}</small> : null}
                {c.hours.note ? (
                  <b>
                    <i className="fj-dot" />
                    {c.hours.note}
                  </b>
                ) : null}
              </span>
            ) : null}
            {due ? (
              <span className={`fj-renew ${due.highlight ? "on" : ""} ${due.closed ? "off" : ""}`}>
                <span>
                  {due.label}
                  {due.time ? ": " : ""}
                  <b>{due.time}</b>
                </span>
                <Chevron />
              </span>
            ) : null}
          </div>
          {days.length ? (
            <div className="fj-member-rows">
              {days.map((day, i) => (
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
      <div className="fj-stats">
        {c.stats.map((s, i) => {
          const Icon = STAT[i % STAT.length];
          return (
            <div key={i}>
              <Icon />
              <b>{s.value}</b>
              <span>{s.label}</span>
            </div>
          );
        })}
      </div>
    ) : null,
    feature:
      c.feature.title || c.feature.big ? (
        <div className="fj-today">
          {c.feature.image ? (
            <div className="fj-today-img">
              <Img src={c.feature.image} alt={c.feature.title} />
            </div>
          ) : null}
          <div className="fj-today-body">
            {c.feature.tag ? <small className="fj-today-tag">{c.feature.tag}</small> : null}
            {c.feature.big ? <strong>{c.feature.big}</strong> : null}
            {c.feature.label ? <span className="fj-label">{c.feature.label}</span> : null}
            {c.feature.title ? <b>{c.feature.title}</b> : null}
            {c.feature.text ? (
              <span className="fj-today-meta">
                {parts(c.feature.text).map((t, i) => (
                  <span key={i}>{t}</span>
                ))}
              </span>
            ) : null}
          </div>
          <Act c={c} to={{ label: c.feature.button || c.feature.title || c.feature.big, href: c.feature.href }} id="feature" className={`fj-play ${c.feature.button ? "txt" : ""}`}>
            {c.feature.button}
            <Play />
          </Act>
        </div>
      ) : null,
    nav:
      c.chips.length || c.hero.card.name || c.hero.cta.label ? (
        <div className="fj-nav">
          {c.chipsTitle ? <h2 className="fj-h">{c.chipsTitle}</h2> : null}
          {c.chips.length ? (
            <div className="fj-chips">
              {c.chips.map((chip, i) => (
                <Act key={i} c={c} to={chip} id={`chip-${i}`} className={i === 0 ? "on" : undefined} />
              ))}
            </div>
          ) : null}
          {c.hero.card.name ? (
            <Act c={c} to={{ label: c.hero.card.name, href: c.hero.card.href }} id="hero-card" className="fj-pick">
              <span className="fj-pick-pic">{c.logo ? <Img src={c.logo} alt="" /> : <Dumbbell />}</span>
              <span className="fj-pick-body">
                {c.hero.card.label ? <small>{c.hero.card.label}</small> : null}
                <b>{c.hero.card.name}</b>
              </span>
              {c.hero.card.price ? <em>{c.hero.card.price}</em> : null}
              <Chevron />
            </Act>
          ) : null}
          <Act c={c} to={c.hero.cta} id="cta" className="fj-cta">
            <span>{c.hero.cta.label}</span> <ArrowRight />
          </Act>
        </div>
      ) : null,
    catalog:
      c.catalog.items.length || c.catalog.title ? (
        <div className="fj-panel">
          {c.catalog.title ? (
            <h2 className="fj-title fj-title2">
              <Lines lines={split(c.catalog.title)} />
            </h2>
          ) : null}
          {c.catalog.label ? (
            <div className="fj-search">
              <Search />
              <span>{c.catalog.label}</span>
            </div>
          ) : null}
          {c.strip.length ? (
            <div className="fj-pills">
              {c.strip.map((word, i) => (
                <span key={i} className={i === 0 ? "on" : undefined}>
                  {word}
                </span>
              ))}
            </div>
          ) : null}
          {c.catalog.items.length ? (
            <div className="fj-cards">
              {c.catalog.items.map((block) => (
                <Item key={block.id} c={c} block={block} className="fj-card">
                  {block.imageUrl ? (
                    <span className="fj-card-img">
                      <Img src={block.imageUrl} alt={block.title} />
                    </span>
                  ) : null}
                  {block.price ? <em className="fj-card-price">{block.price}</em> : null}
                  <span className="fj-card-body">
                    {block.label ? <small>{block.label}</small> : null}
                    <b>{block.title}</b>
                    {block.description ? (
                      <span className="fj-card-meta">
                        {parts(block.description).map((t, i) => {
                          const Icon = META[i % META.length];
                          return (
                            <span key={i}>
                              <Icon />
                              {t}
                            </span>
                          );
                        })}
                      </span>
                    ) : null}
                  </span>
                  <span className={`fj-go ${block.buttonText ? "txt" : ""}`}>
                    {block.buttonText}
                    <Chevron />
                  </span>
                </Item>
              ))}
            </div>
          ) : null}
          <Act c={c} to={c.hero.cta2} id="cta2" className="fj-cta">
            <span>{c.hero.cta2.label}</span> <ArrowRight />
          </Act>
        </div>
      ) : null,
    text:
      c.about.title || c.about.body || c.about.quote ? (
        <div className="fj-about">
          {c.about.image ? (
            <div className="fj-about-img">
              <Img src={c.about.image} alt={c.about.title} />
            </div>
          ) : null}
          <div className={`fj-about-head ${c.about.image ? "pic" : ""}`}>
            {c.about.label ? <span className="fj-label">{c.about.label}</span> : null}
            {c.about.title ? (
              <h2 className="fj-title fj-title2">
                <Lines lines={split(c.about.title)} accent="" />
              </h2>
            ) : null}
            {c.about.quote ? (
              <div className="fj-set">
                <b>{c.about.quote}</b>
                <span className="fj-segs" aria-hidden>
                  <i className="on" />
                  <i className="on" />
                  <i className="on" />
                  <i />
                </span>
                {c.about.author ? <small>{c.about.author}</small> : null}
              </div>
            ) : null}
          </div>
          {c.about.body ? <p>{c.about.body}</p> : null}
        </div>
      ) : null,
    links:
      c.links.items.length || c.links.title ? (
        <div className="fj-links">
          {c.links.title || c.links.label ? (
            <div className="fj-links-top">
              <h2 className="fj-h">{c.links.title}</h2>
              {c.links.label ? <span>{c.links.label}</span> : null}
            </div>
          ) : null}
          {c.links.items.length ? (
            <>
              <span className="fj-segs wide" aria-hidden>
                {c.links.items.map((block, i) => (
                  <i key={block.id} className={i * 2 < c.links.items.length ? "on" : undefined} />
                ))}
              </span>
              <div className="fj-steps">
                {c.links.items.map((block, i) => (
                  <Item key={block.id} c={c} block={block} className="fj-step">
                    <span className="fj-step-n">
                      {num(i + 1)}
                      <small> / {num(c.links.items.length)}</small>
                    </span>
                    <span className="fj-step-body">
                      {block.label ? <small>{block.label}</small> : null}
                      <b>{block.title}</b>
                      {block.subtitle ? <span>{block.subtitle}</span> : null}
                      <span className="fj-track" aria-hidden>
                        <i style={{ width: `${((i + 1) / c.links.items.length) * 100}%` }} />
                      </span>
                    </span>
                    {block.imageUrl ? (
                      <span className="fj-step-img">
                        <Img src={block.imageUrl} alt="" />
                      </span>
                    ) : null}
                    <Chevron />
                  </Item>
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : null,
    promo:
      c.final.title || c.final.button ? (
        <div className="fj-final">
          {c.final.title ? (
            <h2 className="fj-title fj-title2">
              <Lines lines={split(c.final.title)} />
            </h2>
          ) : null}
          {c.final.text ? <p>{c.final.text}</p> : null}
          <Act c={c} to={{ label: c.final.button, href: c.final.href }} id="cta-final" className="fj-cta">
            <span>{c.final.button}</span> <Check />
          </Act>
        </div>
      ) : null,
    footer: <span className="fj-footer">{c.footerText || `${c.brand} © ${new Date().getFullYear()}`}</span>,
  };
};
