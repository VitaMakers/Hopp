"use client";

import { Act, ArrowRight, Img, Item, Lines, Socials, split, type SiteRender } from "./kit";

// Line icons of the services strip, one per position.
const line = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const STRIP_ICONS = [
  <path key="a" d="M4 10.5 12 4l8 6.500V20H4z" />,
  <path key="b" d="M3 20h18M5 20v-8h4v8M9 20V5h5v15M14 20V10h5v10" />,
  <path key="c" d="M3.500 8h17v11h-17zM9 8V5.500h6V8M3.500 12.500h17M11 12.500v1.500h2v-1.500" />,
  <path key="d" d="m12 4 8.500 4.500L12 13 3.500 8.500zM3.500 12 12 16.500 20.500 12M3.500 15.500 12 20l8.500-4.500" />,
];

// "Áurea" — high-end real estate, black page and burnt-orange sunset cover.
// Reference: an estate agency landing (washed cover, services strip, intro
// with outlined button, row of tall photo cards).
export const aurea: SiteRender = (c) => {
  const price = (text: string) => {
    const [value, unit] = text.split("/").map((s) => s.trim());
    return (
      <>
        {value}
        {unit ? <small> / {unit}</small> : null}
      </>
    );
  };
  const card = c.hero.card;
  const cardNote = [card.label, card.price].filter(Boolean).join(" · ");
  return {
    hero: (
      <>
        <div className={`au-hero ${c.hero.photo ? "" : "np"}`} style={c.hero.coverStyle}>
          <div className="au-photo">{c.hero.photo ? <Img src={c.hero.photo} alt={c.brand} style={c.hero.photoStyle} /> : null}</div>
          <div className="au-bar">
            {c.hero.showName ? (
              <div className="au-brand">
                {c.logo ? <Img src={c.logo} alt="" className="au-logo" /> : null}
                <span>
                  <b>{c.brand}</b>
                  {c.brandSub ? <small>{c.brandSub}</small> : null}
                </span>
              </div>
            ) : (
              <span />
            )}
            {/* Contact pill of the top bar: the cover tag, linked like the main button */}
            <Act c={c} to={{ label: c.hero.pill, href: c.hero.cta.href }} id="hero-pill" className="au-pill">
              <span>{c.hero.pill}</span>
              <i>
                <ArrowRight />
              </i>
            </Act>
          </div>
          <div className="au-head">
            {c.hero.lines.length ? (
              <h1 className="au-title">
                <Lines lines={c.hero.lines} />
              </h1>
            ) : null}
            {c.hero.sub ? <p className="au-sub">{c.hero.sub}</p> : null}
            {c.hero.cta.label || c.hero.cta2.label ? (
              <div className="au-actions">
                <Act c={c} to={c.hero.cta} id="cta" className="au-btn">
                  <span>{c.hero.cta.label}</span>
                  <i>
                    <ArrowRight />
                  </i>
                </Act>
                <Act c={c} to={c.hero.cta2} id="cta2" className="au-under" />
              </div>
            ) : null}
          </div>
          {card.name || cardNote ? (
            <Act c={c} to={{ label: card.name || cardNote, href: card.href }} id="hero-card" className="au-cap">
              {card.name ? <b>{card.name}</b> : null}
              {cardNote ? <small>{cardNote}</small> : null}
            </Act>
          ) : null}
        </div>
        {c.strip.length ? (
          <div className={`au-strip n${c.strip.length}`}>
            {c.strip.map((word, i) => (
              <span key={i}>
                <svg {...line}>{STRIP_ICONS[i % STRIP_ICONS.length]}</svg>
                <em>{word}</em>
              </span>
            ))}
          </div>
        ) : null}
      </>
    ),
    text:
      c.about.title || c.about.body || c.about.quote ? (
        <div className="au-about">
          {c.about.label ? <span className="au-label">{c.about.label}</span> : null}
          {c.about.title ? (
            <h2 className="au-h">
              <Lines lines={split(c.about.title)} accent="" />
            </h2>
          ) : null}
          {c.about.body ? <p>{c.about.body}</p> : null}
          {c.about.image ? (
            <div className="au-about-img">
              <Img src={c.about.image} />
            </div>
          ) : null}
          {c.about.quote ? (
            <blockquote>
              “{c.about.quote}”{c.about.author ? <cite>{c.about.author}</cite> : null}
            </blockquote>
          ) : null}
        </div>
      ) : null,
    nav: c.chips.length ? (
      <div className="au-nav">
        {c.chipsTitle ? <span className="au-label">{c.chipsTitle}</span> : null}
        <div className="au-outs">
          {c.chips.map((chip, i) => (
            <Act key={i} c={c} to={chip} id={`chip-${i}`} className="au-out">
              <span>{chip.label}</span>
              <ArrowRight />
            </Act>
          ))}
        </div>
      </div>
    ) : null,
    links:
      c.links.items.length || c.links.title ? (
        <div className="au-links">
          {c.links.label || c.links.title ? (
            <div className="au-sechead">
              {c.links.label ? <span className="au-label">{c.links.label}</span> : null}
              {c.links.title ? (
                <h2 className="au-h sm">
                  <Lines lines={split(c.links.title)} accent="" />
                </h2>
              ) : null}
            </div>
          ) : null}
          {c.links.items.length ? (
            <div className="au-row">
              {c.links.items.map((block) => (
                <Item key={block.id} c={c} block={block} className={`au-tall ${block.imageUrl ? "" : "ni"}`}>
                  <Img src={block.imageUrl} alt={block.title} />
                  <span className="au-tall-cap">
                    <span className="au-tall-txt">
                      {block.label ? <small>{block.label}</small> : null}
                      <b>{block.title}</b>
                      {block.subtitle ? <em>{block.subtitle}</em> : null}
                    </span>
                    <ArrowRight />
                  </span>
                </Item>
              ))}
            </div>
          ) : null}
        </div>
      ) : null,
    stats: c.stats.length ? (
      <div className="au-stats">
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
        <div className={`au-feature ${c.feature.image ? "" : "ni"}`}>
          {c.feature.image ? <Img src={c.feature.image} className="au-feature-img" /> : null}
          <div className="au-feature-body">
            {c.feature.tag ? <span className="au-label">{c.feature.tag}</span> : null}
            {c.feature.big ? <strong>{c.feature.big}</strong> : null}
            {c.feature.label ? <small>{c.feature.label}</small> : null}
            {c.feature.title ? <b>{c.feature.title}</b> : null}
            {c.feature.text ? <p>{c.feature.text}</p> : null}
            <Act c={c} to={{ label: c.feature.button, href: c.feature.href }} id="feature" className="au-btn sm">
              <span>{c.feature.button}</span>
              <i>
                <ArrowRight />
              </i>
            </Act>
          </div>
        </div>
      ) : null,
    catalog:
      c.catalog.items.length || c.catalog.title ? (
        <div className="au-catalog">
          {c.catalog.label ? <span className="au-label">{c.catalog.label}</span> : null}
          {c.catalog.title ? (
            <h2 className="au-h sm">
              <Lines lines={split(c.catalog.title)} accent="" />
            </h2>
          ) : null}
          {c.catalog.items.length ? (
            <div className="au-list">
              {c.catalog.items.map((block) => (
                <Item key={block.id} c={c} block={block} className={`au-prop ${block.imageUrl ? "" : "ni"}`}>
                  <span className="au-prop-img">
                    <Img src={block.imageUrl} alt={block.title} />
                    <span className="au-prop-cap">
                      <span className="au-tall-txt">
                        {block.label ? <small>{block.label}</small> : null}
                        <b>{block.title}</b>
                      </span>
                      {block.price ? <strong>{price(block.price)}</strong> : null}
                    </span>
                  </span>
                  {block.description || block.buttonText ? (
                    <span className="au-prop-foot">
                      {block.description ? <span>{block.description}</span> : null}
                      {block.buttonText ? (
                        <span className="au-out sm">
                          <span>{block.buttonText}</span>
                          <ArrowRight />
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
    hours:
      c.hours.days.length || c.hours.title ? (
        <div className="au-hours">
          {c.hours.title ? <h2 className="au-h sm">{c.hours.title}</h2> : null}
          {c.hours.note ? <p>{c.hours.note}</p> : null}
          {c.hours.days.length ? (
            <div className="au-days">
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
        <div className="au-final">
          {c.final.title ? (
            <h2 className="au-h">
              <Lines lines={split(c.final.title)} accent="" />
            </h2>
          ) : null}
          {c.final.text ? <p>{c.final.text}</p> : null}
          <Act c={c} to={{ label: c.final.button, href: c.final.href }} id="cta-final" className="au-btn wide">
            <span>{c.final.button}</span>
            <i>
              <ArrowRight />
            </i>
          </Act>
        </div>
      ) : null,
    footer: (
      <div className="au-footer">
        <span>{c.footerText || `${c.brand} © ${new Date().getFullYear()}`}</span>
        <Socials c={c} className="au-socials" max={4} />
      </div>
    ),
  };
};
