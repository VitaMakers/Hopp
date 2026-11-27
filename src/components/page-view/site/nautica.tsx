"use client";

import { Act, ArrowRight, Img, Item, Lines, Socials, split, type SiteRender } from "./kit";

const Boat = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden>
    <path d="M9 9.500 13.500 6h3l2 3.500h2.500l-1 2.500H5.500L3 10.200zM2 15.200c2 0 2.600 1.300 4.700 1.300s2.600-1.300 4.700-1.300 2.600 1.300 4.700 1.300 2.600-1.300 4.700-1.300l1.200.200v1.600c-2.100-.100-2.700 1.300-5.900 1.300-2.100 0-2.600-1.300-4.700-1.300S8.800 18.300 6.700 18.300 4.100 17 2 17z" />
  </svg>
);

// "Náutica" — boat tours and yacht charter, white and navy. Reference: a
// charter landing page (rounded sea cover with a notch for the white pill
// button, number chips on the right, image cards, featured trip, steps).
export const nautica: SiteRender = (c) => {
  const price = (text: string) => {
    const [value, unit] = text.split("/").map((s) => s.trim());
    return (
      <>
        {value}
        {unit ? <small>/ {unit}</small> : null}
      </>
    );
  };
  const tag = (text: string) =>
    text ? (
      <span className="na-tag">
        <i>
          <Boat />
        </i>
        {text}
      </span>
    ) : null;
  const pill = (label: string) => (
    <>
      <span>{label}</span>
      <i>
        <ArrowRight />
      </i>
    </>
  );
  const [authorName, ...authorRole] = c.about.author.split("·").map((s) => s.trim());
  return {
    hero: (
      <div className={`na-hero${c.hero.cta.label ? " has-cta" : ""}`} style={c.hero.coverStyle}>
        <div className="na-cover">{c.hero.photo ? <Img src={c.hero.photo} alt={c.brand} style={c.hero.photoStyle} /> : null}</div>
        <div className="na-bar">
          {c.hero.showName ? (
            <div className="na-brand">
              {c.logo ? <Img src={c.logo} alt="" className="na-logo" /> : <Boat />}
              <span>
                <b>{c.brand}</b>
                {c.brandSub ? <small>{c.brandSub}</small> : null}
              </span>
            </div>
          ) : (
            <span />
          )}
          <Act c={c} to={c.hero.cta2} id="cta2" className="na-pillbtn sm">
            {pill(c.hero.cta2.label)}
          </Act>
        </div>
        <div className="na-head">
          {c.hero.pill ? <span className="na-heropill">{c.hero.pill}</span> : null}
          {c.hero.lines.length ? (
            <h1 className="na-title">
              <Lines lines={c.hero.lines} />
            </h1>
          ) : null}
          {c.hero.sub ? <p className="na-sub">{c.hero.sub}</p> : null}
        </div>
        {c.strip.length || c.hero.card.name ? (
          <div className="na-side">
            {c.hero.card.name ? (
              <Act c={c} to={{ label: c.hero.card.name, href: c.hero.card.href }} id="hero-card" className="na-herocard">
                {c.hero.card.label ? <small>{c.hero.card.label}</small> : null}
                <b>{c.hero.card.name}</b>
                {c.hero.card.price ? <em>{price(c.hero.card.price)}</em> : null}
              </Act>
            ) : (
              <span />
            )}
            {c.strip.length ? (
              <div className="na-chips">
                {c.strip.map((word, i) => {
                  // "250+ Passeios feitos" → number on top, caption below.
                  const [value, ...rest] = word.split(" ");
                  return (
                    <div key={i}>
                      <b>{value}</b>
                      {rest.length ? <span>{rest.join(" ")}</span> : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}
        {c.hero.cta.label ? (
          <div className="na-notch">
            <Act c={c} to={c.hero.cta} id="cta" className="na-pillbtn">
              {pill(c.hero.cta.label)}
            </Act>
          </div>
        ) : null}
      </div>
    ),
    nav: c.chips.length ? (
      <div className="na-nav">
        {c.chipsTitle ? <span className="na-nav-title">{c.chipsTitle}</span> : null}
        <div className="na-nav-row">
          {c.chips.map((chip, i) => (
            <Act key={i} c={c} to={chip} id={`chip-${i}`} className={i === 0 ? "on" : undefined} />
          ))}
        </div>
      </div>
    ) : null,
    catalog:
      c.catalog.items.length || c.catalog.title ? (
        <div className="na-why">
          {tag(c.catalog.label)}
          {c.catalog.title ? (
            <h2 className="na-h">
              <Lines lines={split(c.catalog.title)} accent="" />
            </h2>
          ) : null}
          {c.catalog.items.length ? (
            <div className={`na-cards n${Math.min(c.catalog.items.length, 3)}`}>
              {c.catalog.items.map((block) => (
                <Item key={block.id} c={c} block={block} className="na-card">
                  <span className="na-card-img">
                    <Img src={block.imageUrl} alt={block.title} />
                    {block.buttonText ? (
                      <span className="na-more">
                        {block.buttonText} <ArrowRight />
                      </span>
                    ) : null}
                  </span>
                  <b>{block.title}</b>
                  {block.label ? <small>{block.label}</small> : null}
                  {block.description ? <span className="na-card-text">{block.description}</span> : null}
                  {block.price ? <em>{price(block.price)}</em> : null}
                </Item>
              ))}
            </div>
          ) : null}
        </div>
      ) : null,
    promo:
      c.final.title || c.final.button ? (
        <div className="na-final">
          {c.final.title ? (
            <h2 className="na-h">
              <Lines lines={split(c.final.title)} accent="" />
            </h2>
          ) : null}
          {c.final.text ? <p>{c.final.text}</p> : null}
          <Act c={c} to={{ label: c.final.button, href: c.final.href }} id="cta-final" className="na-btn" />
        </div>
      ) : null,
    feature:
      c.feature.title || c.feature.big ? (
        <div className="na-feature">
          {tag(c.feature.label)}
          {c.feature.image ? (
            <div className="na-feature-img">
              <Img src={c.feature.image} alt={c.feature.title} />
            </div>
          ) : null}
          {c.feature.tag ? (
            <div className="na-specs">
              {c.feature.tag.split("·").map((spec, i) => (
                <span key={i}>{spec.trim()}</span>
              ))}
            </div>
          ) : null}
          <div className="na-feature-row">
            <div>
              {c.feature.title ? <b>{c.feature.title}</b> : null}
              {c.feature.text ? <p>{c.feature.text}</p> : null}
            </div>
            {c.feature.big ? <strong>{price(c.feature.big)}</strong> : null}
          </div>
          <Act c={c} to={{ label: c.feature.button, href: c.feature.href }} id="feature" className="na-btn" />
        </div>
      ) : null,
    links:
      c.links.items.length || c.links.title ? (
        <div className="na-steps">
          <div className="na-center">
            {tag(c.links.label)}
            {c.links.title ? (
              <h2 className="na-h">
                <Lines lines={split(c.links.title)} accent="" />
              </h2>
            ) : null}
          </div>
          {c.links.items.length ? (
            <div className="na-timeline">
              {c.links.items.map((block, i) => (
                <Item key={block.id} c={c} block={block} className="na-step">
                  <span className="na-step-body">
                    <i>{block.label || i + 1}</i>
                    <b>{block.title}</b>
                    {block.subtitle ? <small>{block.subtitle}</small> : null}
                  </span>
                  <span className="na-step-img">
                    <Img src={block.imageUrl} alt={block.title} />
                  </span>
                </Item>
              ))}
            </div>
          ) : null}
          {c.links.items.length ? <Act c={c} to={c.hero.cta2} id="cta2-steps" className="na-btn" /> : null}
        </div>
      ) : null,
    text:
      c.about.title || c.about.body || c.about.quote ? (
        <div className="na-about">
          <div className="na-center">
            {tag(c.about.label)}
            {c.about.title ? (
              <h2 className="na-h">
                <Lines lines={split(c.about.title)} accent="" />
              </h2>
            ) : null}
            {c.about.body ? <p className="na-body">{c.about.body}</p> : null}
          </div>
          {c.about.image && !c.about.quote ? (
            <div className="na-about-img">
              <Img src={c.about.image} />
            </div>
          ) : null}
          {c.about.quote ? <blockquote>“{c.about.quote}”</blockquote> : null}
          {c.about.quote && (c.about.author || c.about.image) ? (
            <div className="na-author">
              {c.about.image ? (
                <span className="na-avatar">
                  <Img src={c.about.image} alt={authorName} />
                </span>
              ) : null}
              <span>
                {authorName ? <b>{authorName}</b> : null}
                {authorRole.length ? <small>{authorRole.join(" · ")}</small> : null}
              </span>
            </div>
          ) : null}
        </div>
      ) : null,
    stats: c.stats.length ? (
      <div className={`na-stats n${c.stats.length}`}>
        {c.stats.map((s, i) => (
          <div key={i}>
            <b>{s.value}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    ) : null,
    hours:
      c.hours.days.length || c.hours.title ? (
        <div className="na-hours">
          {c.hours.title ? <h2 className="na-h">{c.hours.title}</h2> : null}
          {c.hours.note ? <p>{c.hours.note}</p> : null}
          {c.hours.days.length ? (
            <div className="na-hours-list">
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
    footer: (
      <div className="na-footer">
        <span>{c.footerText || `${c.brand} © ${new Date().getFullYear()}`}</span>
        <Socials c={c} className="na-socials" max={4} />
      </div>
    ),
  };
};
