"use client";

import type { ReactNode } from "react";
import { Act, ArrowUp, Img, Item, Play, Socials, split, type SiteRender } from "./kit";

const svg = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, width: "1em", height: "1em", "aria-hidden": true };
// Decorative marks: brand glyph, row arrow, section bullets, tab and partner icons.
const Mark = () => <svg {...svg} strokeWidth={2.6}><path d="M5 19 12 5l7 14M9 14h6" /></svg>;
const ArrowDown = () => <svg {...svg}><path d="M17 7 7 17M15 17H7V9" /></svg>;
const Spark = () => <svg {...svg} fill="currentColor" stroke="none"><path d="M12 3l2 7 7 2-7 2-2 7-2-7-7-2 7-2z" /></svg>;
const TAB_ICONS: ReactNode[] = [
  <><rect x="5" y="9" width="14" height="10" rx="3" /><path d="M12 9V5M9 14h.01M15 14h.01M3 14h2M19 14h2" /></>,
  <path d="M13 3 5 13h6l-1 8 8-10h-6z" />,
  <><rect x="4" y="4" width="11" height="11" rx="2" /><path d="M9 20h9a2 2 0 0 0 2-2V9" /></>,
  <><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.600 5.600l2.100 2.100M16.300 16.300l2.100 2.100M5.600 18.400l2.100-2.100M16.300 7.700l2.100-2.100" /></>,
];
const LOGO_ICONS: ReactNode[] = [
  <><circle cx="12" cy="12" r="8" /><path d="M12 4v16M4 12h16" /></>,
  <path d="M4 17h16M7 12h10M10 7h4" />,
  <><circle cx="8" cy="12" r="4" /><circle cx="16" cy="12" r="4" /></>,
  <><rect x="5" y="5" width="14" height="14" rx="3" /><path d="M9 15V9l6 6V9" /></>,
];

// Two-tone title: the first line in the text colour, the rest muted.
const Tone = ({ text }: { text: string }) => (
  <>
    {split(text).map((line, i) => (
      <span key={i} className={i ? "mu" : undefined}>
        {line}
      </span>
    ))}
  </>
);

// "Neon" — AI / automation agency, near-black with neon green. Reference: an
// agency landing (glowing shape on the cover, partner card, numbered services).
export const neon: SiteRender = (c) => {
  const top = c.hero.lines.length > 1 ? c.hero.lines.slice(0, -1) : c.hero.lines;
  const last = c.hero.lines.length > 1 ? c.hero.lines[c.hero.lines.length - 1] : "";
  // White pill with the accent circle (main button of the design).
  const pill = (label: string) => (
    <>
      <span>{label}</span>
      <i>
        <ArrowUp />
      </i>
    </>
  );
  const who = c.about.author.split(/\s*[·—|]\s*/);
  const finalText = c.final.text.split("\n").map((s) => s.trim()).filter(Boolean);
  return {
    hero: (
      <div className="nn-hero" style={c.hero.coverStyle}>
        <div className="nn-blob" aria-hidden={!c.hero.photo}>
          <span className="nn-blob-in">{c.hero.photo ? <Img src={c.hero.photo} alt={c.brand} style={c.hero.photoStyle} /> : null}</span>
          <i />
          <i />
        </div>
        <div className="nn-bar">
          {c.hero.showName ? (
            <div className="nn-brand">
              {c.logo ? <Img src={c.logo} alt="" className="nn-logo" /> : <Mark />}
              <b>{c.brand}</b>
            </div>
          ) : (
            <span />
          )}
          <Act c={c} to={c.hero.cta} id="cta-top" className="nn-pillbtn sm">
            {pill(c.hero.cta.label)}
          </Act>
        </div>
        <div className="nn-head">
          {c.hero.pill ? <span className="nn-tag">{`// ${c.hero.pill}`}</span> : null}
          {top.length ? (
            <h1 className="nn-title">
              {top.map((line, i) => (
                <span key={i}>{line}</span>
              ))}
            </h1>
          ) : null}
          {c.hero.cta.label || c.hero.cta2.label ? (
            <div className="nn-actions">
              <Act c={c} to={c.hero.cta} id="cta" className="nn-pillbtn">
                {pill(c.hero.cta.label)}
              </Act>
              <Act c={c} to={c.hero.cta2} id="cta2" className="nn-textlink">
                {c.hero.cta2.label} <ArrowUp />
              </Act>
            </div>
          ) : null}
        </div>
        <div className="nn-foot">
          {c.hero.card.name ? (
            <Act c={c} to={{ label: c.hero.card.name, href: c.hero.card.href }} id="hero-card" className="nn-herocard">
              {c.hero.card.label ? <small>{c.hero.card.label}</small> : null}
              <b>{c.hero.card.name}</b>
              {c.hero.card.price ? <em>{c.hero.card.price}</em> : null}
            </Act>
          ) : null}
          {c.hero.sub ? <p className="nn-sub">{c.hero.sub}</p> : null}
          {last ? <p className="nn-title nn-title-b">{last}</p> : null}
        </div>
      </div>
    ),
    feature:
      c.feature.title || c.feature.big || c.feature.text || c.strip.length ? (
        <div className="nn-trust">
          {c.strip.length ? (
            <div className="nn-logos">
              {c.strip.map((word, i) => (
                <span key={i}>
                  <svg {...svg}>{LOGO_ICONS[i % LOGO_ICONS.length]}</svg>
                  {word}
                </span>
              ))}
            </div>
          ) : null}
          {c.strip.length ? <hr /> : null}
          {c.feature.tag ? <span className="nn-tag">{`// ${c.feature.tag}`}</span> : null}
          {c.feature.big ? <strong>{c.feature.big}</strong> : null}
          {c.feature.label ? <small>{c.feature.label}</small> : null}
          {c.feature.title ? (
            <h2 className="nn-h">
              <Tone text={c.feature.title} />
            </h2>
          ) : null}
          {c.feature.text ? <p>{c.feature.text}</p> : null}
          <Act c={c} to={{ label: c.feature.button, href: c.feature.href }} id="feature" className="nn-underlink">
            {c.feature.button} <ArrowUp />
          </Act>
        </div>
      ) : null,
    stats: c.stats.length ? (
      <div className="nn-stats">
        {c.stats.map((s, i) => (
          <div key={i}>
            <b>{s.value}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    ) : null,
    text:
      c.about.title || c.about.body || c.about.image || c.about.quote ? (
        <div className="nn-about">
          {c.about.label ? (
            <span className="nn-label">
              <i>
                <Spark />
              </i>
              {c.about.label}
            </span>
          ) : null}
          {c.about.title ? <h2 className="nn-lead">{c.about.title}</h2> : null}
          {c.about.body ? <p className="nn-body">{c.about.body}</p> : null}
          {c.about.image ? (
            <div className="nn-video">
              <Img src={c.about.image} alt={who[0]} />
              {who[0] ? (
                <span className="nn-video-who">
                  <b>{who[0]}</b>
                  {who.length > 1 ? <small>{who.slice(1).join(" · ")}</small> : null}
                </span>
              ) : null}
              {c.about.quote ? (
                <span className="nn-video-play">
                  <i>
                    <Play />
                  </i>
                  <span>{c.about.quote}</span>
                </span>
              ) : null}
            </div>
          ) : c.about.quote ? (
            <blockquote>
              “{c.about.quote}”{c.about.author ? <cite>{c.about.author}</cite> : null}
            </blockquote>
          ) : null}
        </div>
      ) : null,
    nav:
      c.chips.length || c.chipsTitle ? (
        <div className={`nn-serv ${c.chipsTitle ? "" : "bare"}`}>
          <div className="nn-leaf" aria-hidden>
            <i />
            <i />
            <i />
          </div>
          {c.chipsTitle ? (
            <h2 className="nn-h big">
              <Tone text={c.chipsTitle} />
            </h2>
          ) : null}
          {c.chips.length ? (
            <div className="nn-tabs">
              {c.chips.map((chip, i) => (
                <Act key={i} c={c} to={chip} id={`chip-${i}`} className={i === 0 ? "on" : undefined}>
                  <svg {...svg}>{TAB_ICONS[i % TAB_ICONS.length]}</svg>
                  {chip.label}
                </Act>
              ))}
            </div>
          ) : null}
        </div>
      ) : null,
    links:
      c.links.items.length || c.links.title ? (
        <div className="nn-steps">
          {c.links.title || c.links.label ? (
            <div className="nn-steps-top">
              {c.links.title ? <h3>{c.links.title}</h3> : <span />}
              {c.links.label ? <span className="nn-tag">{`/ ${c.links.label}`}</span> : null}
            </div>
          ) : null}
          {c.links.items.map((block, i) => (
            <Item key={block.id} c={c} block={block} className={`nn-row ${block.subtitle || block.imageUrl ? "open" : ""}`}>
              <span className="nn-row-top">
                <small>{String(i + 1).padStart(2, "0")}</small>
                <b>{block.title}</b>
                <ArrowDown />
              </span>
              {block.subtitle || block.imageUrl ? (
                <span className="nn-row-body">
                  {block.imageUrl ? (
                    <span className="nn-row-img">
                      <Img src={block.imageUrl} alt="" />
                    </span>
                  ) : null}
                  {block.label ? <span className="nn-tag">{`/ ${block.label}`}</span> : null}
                  {block.subtitle ? <span className="nn-row-text">{block.subtitle}</span> : null}
                  {block.buttonText ? <span className="nn-pillbtn sm">{pill(block.buttonText)}</span> : null}
                </span>
              ) : null}
            </Item>
          ))}
        </div>
      ) : null,
    hours:
      c.hours.days.length || c.hours.title ? (
        <div className="nn-ind">
          {c.hours.title ? (
            <h2 className="nn-h">
              <Tone text={c.hours.title} />
            </h2>
          ) : null}
          {c.hours.note ? <p className="nn-ind-note">{c.hours.note}</p> : null}
          {c.hours.days.length || c.feature.image ? (
            <div className={`nn-ind-grid ${c.feature.image && c.hours.days.length ? "" : "one"}`}>
              {c.hours.days.length ? (
                <ul>
                  {c.hours.days.map((day, i) => (
                    <li key={i} className={`${day.highlight ? "on" : ""} ${day.closed ? "off" : ""}`}>
                      <i>{day.highlight ? <Spark /> : null}</i>
                      <span>
                        {day.label} {day.time}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {c.feature.image ? (
                <div className="nn-ind-img">
                  <Img src={c.feature.image} alt="" />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null,
    catalog:
      c.catalog.items.length || c.catalog.title ? (
        <div className="nn-works">
          {c.catalog.label ? (
            <span className="nn-label">
              <i>
                <Spark />
              </i>
              {c.catalog.label}
            </span>
          ) : null}
          {c.catalog.title ? (
            <h2 className="nn-h">
              <Tone text={c.catalog.title} />
            </h2>
          ) : null}
          {c.catalog.items.length ? (
            <div className={`nn-cards ${c.catalog.items.length === 1 ? "one" : ""}`}>
              {c.catalog.items.map((block) => (
                <Item key={block.id} c={c} block={block} className="nn-card">
                  <b>{block.title}</b>
                  <span className="nn-card-img">{block.imageUrl ? <Img src={block.imageUrl} alt={block.title} /> : <Mark />}</span>
                  <span className="nn-card-foot">
                    <span className="nn-card-meta">
                      {block.label ? <small>{block.label}</small> : null}
                      {block.description ? <small>{block.description}</small> : null}
                      {block.price ? <em>{block.price}</em> : null}
                      {block.buttonText ? <u>{block.buttonText}</u> : null}
                    </span>
                    <i>
                      <ArrowUp />
                    </i>
                  </span>
                </Item>
              ))}
            </div>
          ) : null}
        </div>
      ) : null,
    promo:
      c.final.title || c.final.button ? (
        <div className="nn-contact">
          <div className="nn-bolt" aria-hidden>
            <i />
            <i />
          </div>
          {c.final.title ? (
            <h2 className="nn-h">
              {split(c.final.title).map((line, i) => (
                <span key={i}>{line}</span>
              ))}
            </h2>
          ) : null}
          {finalText.length > 1 ? (
            <p className="nn-contact-who">
              <b>{finalText[0]}</b>
              <small>{finalText.slice(1).join(" ")}</small>
            </p>
          ) : finalText.length ? (
            <p className="nn-contact-text">{finalText[0]}</p>
          ) : null}
          <Act c={c} to={{ label: c.final.button, href: c.final.href }} id="cta-final" className="nn-pillbtn sm">
            {pill(c.final.button)}
          </Act>
        </div>
      ) : null,
    footer: (
      <div className="nn-footer">
        <div className="nn-footer-top">
          <div className="nn-footer-brand">
            {c.logo ? <Img src={c.logo} alt="" className="nn-logo" /> : <Mark />}
            <span>
              <b>{c.brand}</b>
              {c.brandSub ? <small>{c.brandSub}</small> : null}
            </span>
          </div>
          <Socials c={c} className="nn-socials" max={4} />
        </div>
        <span className="nn-copy">{c.footerText || `${c.brand} © ${new Date().getFullYear()}`}</span>
      </div>
    ),
  };
};
