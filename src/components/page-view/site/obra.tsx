"use client";

import type { ReactNode } from "react";
import { Act, ArrowUp, Chevron, Img, Item, Lines, Play, Socials, split, StatIcon, type SiteRender } from "./kit";

const ico = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, width: "1em", height: "1em", "aria-hidden": true };
const House = () => <svg {...ico} fill="currentColor" stroke="none"><path d="M12 3 3 10.500V21h6v-6h6v6h6V10.500z" /></svg>;
// One neutral outline icon per position (partner row, bento cards).
function Glyph({ index }: { index: number }) {
  const paths = [
    <path key="a" d="m12 3 9 5-9 5-9-5zM3 12.500l9 5 9-5M3 17l9 5 9-5" />,
    <path key="b" d="M14.5 5.500a4 4 0 0 0-5 5L3 17v4h4l6.500-6.500a4 4 0 0 0 5-5L16 12l-3-3z" />,
    <path key="c" d="M4 21V8l8-5 8 5v13M9 21v-6h6v6M9 10h.01M15 10h.01" />,
    <path key="d" d="M4 6h16M4 12h10M4 18h16M18 10v4" />,
    <path key="e" d="M12 3a9 9 0 1 0 0 18zM12 3a9 9 0 0 1 0 18" />,
    <path key="f" d="M6 6h.01M6 18h.01M18 6h.01M18 18h.01M12 12h.01" strokeWidth={3.4} />,
  ];
  return <svg {...ico}>{paths[index % paths.length]}</svg>;
}
const Tag = ({ children }: { children: ReactNode }) => (
  <span className="ob-tag">
    <i />
    {children}
  </span>
);
// "Tag · description" in one field: first piece is the tag, the rest the text.
const parts = (text: string) => {
  const [head, ...rest] = text.split("·").map((s) => s.trim());
  return [head ?? "", rest.join(" · ")] as const;
};
const BARS = [3, 5, 4, 7, 6, 9, 12, 8, 14, 22, 16, 11, 13, 9, 12, 15, 10];

// "Obra" — construction company, navy-black with amber and warm glass cards.
// Reference: a builder landing (cover with a progress card, bento of
// services, big numbers, client stories, steps, FAQ, giant brand word).
export const obra: SiteRender = (c) => {
  const [first, second, ...others] = c.catalog.items;
  const card = c.hero.card;
  const hasCard = !!(card.name || card.price);
  const [who, role] = parts(c.about.author);
  const words = c.feature.title.split(/\n|·/).map((s) => s.trim()).filter(Boolean);
  const mid = Math.floor((words.length - 1) / 2);
  const arrow = (
    <span className="ob-dot">
      <ArrowUp />
    </span>
  );
  return {
    hero: (
      <>
        <div className="ob-hero" style={c.hero.coverStyle}>
          {c.hero.photo ? (
            <div className="ob-photo">
              <Img src={c.hero.photo} alt={c.brand} style={c.hero.photoStyle} />
            </div>
          ) : null}
          <div className="ob-shade" />
          <div className="ob-bar">
            {c.hero.showName ? (
              <div className="ob-brand">
                {c.logo ? <Img src={c.logo} alt="" className="ob-logo" /> : <House />}
                <b>{c.brand}</b>
              </div>
            ) : (
              <span />
            )}
            <Act c={c} to={c.hero.cta2} id="cta2" className="ob-top" />
          </div>
          <div className="ob-head">
            {c.hero.pill ? <Tag>{c.hero.pill}</Tag> : null}
            {c.hero.lines.length ? (
              <h1 className="ob-title">
                <Lines lines={c.hero.lines} />
              </h1>
            ) : null}
            {c.hero.sub ? <p className="ob-sub">{c.hero.sub}</p> : null}
            <Act c={c} to={c.hero.cta} id="cta" className="ob-btn">
              {c.hero.cta.label} {arrow}
            </Act>
          </div>
          {hasCard ? (
            <Act c={c} to={{ label: card.name || card.price, href: card.href }} id="hero-card" className="ob-glass ob-progress">
              <span className="ob-progress-top">
                <span className="ob-ic">
                  <Glyph index={2} />
                </span>
                {card.label ? <small>{card.label}</small> : <span />}
                <span className="ob-dot w">
                  <ArrowUp />
                </span>
              </span>
              <span className="ob-ring">
                {card.price ? <b className="ob-led">{card.price}</b> : null}
                {card.name ? <em>{card.name}</em> : null}
              </span>
              {c.stats.length ? (
                <span className="ob-mini">
                  {c.stats.slice(0, 3).map((s, i) => (
                    <span key={i}>
                      <b>{s.value}</b>
                      <StatIcon index={i} />
                      <small>{parts(s.label)[0]}</small>
                    </span>
                  ))}
                </span>
              ) : null}
            </Act>
          ) : null}
        </div>
        {c.strip.length ? (
          <div className="ob-strip">
            {c.strip.map((word, i) => (
              <span key={i}>
                <Glyph index={i + 3} />
                {word}
              </span>
            ))}
          </div>
        ) : null}
      </>
    ),
    catalog:
      c.catalog.items.length || c.catalog.title ? (
        <div className="ob-catalog">
          <div className="ob-center">
            {c.catalog.label ? <Tag>{c.catalog.label}</Tag> : null}
            {c.catalog.title ? (
              <h2 className="ob-h">
                <Lines lines={split(c.catalog.title)} />
              </h2>
            ) : null}
          </div>
          {first ? (
            <Item c={c} block={first} className={`ob-tall${first.imageUrl ? "" : " bare"}`}>
              <Img src={first.imageUrl} alt={first.title} className="ob-tall-img" />
              {first.label || first.price || first.buttonText ? (
                <span className="ob-glass ob-widget">
                  {first.label ? (
                    <span className="ob-widget-top">
                      <span className="ob-ic">
                        <StatIcon index={0} />
                      </span>
                      {first.label}
                    </span>
                  ) : null}
                  {first.price ? <b className="ob-led">{first.price}</b> : null}
                  <span className="ob-bars" aria-hidden>
                    {BARS.map((h, i) => (
                      <i key={i} style={{ height: h * 2 }} />
                    ))}
                  </span>
                  {first.buttonText ? (
                    <span className="ob-widget-btn">
                      <span className="ob-ic">
                        <Glyph index={2} />
                      </span>
                      <span className="ob-chip">
                        {first.buttonText}
                        <span className="ob-dot w">
                          <ArrowUp />
                        </span>
                      </span>
                    </span>
                  ) : null}
                </span>
              ) : null}
              <span className="ob-tall-body">
                <b>{first.title}</b>
                {first.description ? <span>{first.description}</span> : null}
              </span>
            </Item>
          ) : null}
          {second ? (
            <Item c={c} block={second} className="ob-bx ob-wide">
              <span className="ob-sq">
                <Glyph index={2} />
              </span>
              <b>{second.title}</b>
              {second.description ? <span className="ob-txt">{second.description}</span> : null}
              {second.label || second.price || second.imageUrl ? (
                <span className="ob-glass ob-pillcard">
                  <span className="ob-ic">
                    <Glyph index={2} />
                  </span>
                  {second.imageUrl ? (
                    <span className="ob-thumb">
                      <Img src={second.imageUrl} alt="" />
                    </span>
                  ) : null}
                  <span className="ob-pillcard-txt">
                    {second.label ? <b>{second.label}</b> : null}
                    {second.price ? <small>{second.price}</small> : null}
                  </span>
                </span>
              ) : null}
              {second.buttonText ? (
                <span className="ob-chip solo">
                  {second.buttonText}
                  <span className="ob-dot w">
                    <ArrowUp />
                  </span>
                </span>
              ) : null}
            </Item>
          ) : null}
          {others.length ? (
            <div className="ob-grid">
              {others.map((block, i) => (
                <Item key={block.id} c={c} block={block} className="ob-bx">
                  {block.imageUrl ? (
                    <span className="ob-bx-img">
                      <Img src={block.imageUrl} alt={block.title} />
                    </span>
                  ) : (
                    <span className="ob-sq">
                      <Glyph index={i} />
                    </span>
                  )}
                  {block.label ? <small className="ob-over">{block.label}</small> : null}
                  <b>{block.title}</b>
                  {block.description ? <span className="ob-txt">{block.description}</span> : null}
                  {block.price ? <em>{block.price}</em> : null}
                  {block.buttonText ? (
                    <span className="ob-chip solo">
                      {block.buttonText}
                      <span className="ob-dot w">
                        <ArrowUp />
                      </span>
                    </span>
                  ) : null}
                </Item>
              ))}
            </div>
          ) : null}
        </div>
      ) : null,
    stats: c.stats.length ? (
      <div className="ob-stats">
        {c.stats.map((s, i) => {
          const [tag, text] = parts(s.label);
          return (
            <div key={i}>
              {tag ? (
                <span className="ob-tag">
                  <StatIcon index={i} />
                  {tag}
                </span>
              ) : null}
              <b>{s.value}</b>
              {text ? <p>{text}</p> : null}
            </div>
          );
        })}
      </div>
    ) : null,
    text:
      c.about.title || c.about.body || c.about.quote || c.about.image ? (
        <div className="ob-stories">
          <div className="ob-center">
            {c.about.label ? <Tag>{c.about.label}</Tag> : null}
            {c.about.title ? (
              <h2 className="ob-h">
                <Lines lines={split(c.about.title)} />
              </h2>
            ) : null}
            {c.about.body ? <p className="ob-lead">{c.about.body}</p> : null}
          </div>
          {c.about.image ? (
            <>
              <div className="ob-reel">
                <i className="ob-peek l" />
                <figure className="ob-story">
                  <Img src={c.about.image} alt={who} />
                  <figcaption>
                    <span className="ob-brand sm">
                      {c.logo ? <Img src={c.logo} alt="" className="ob-logo" /> : <House />}
                      <b>{c.brand}</b>
                    </span>
                    {who ? (
                      <span className="ob-who">
                        <b>{who}</b>
                        {role ? <small>{role}</small> : null}
                      </span>
                    ) : null}
                  </figcaption>
                </figure>
                <i className="ob-peek r" />
              </div>
              <div className="ob-ctrl" aria-hidden>
                <span className="ob-prev">
                  <Chevron />
                </span>
                <i />
                <span className="ob-play">
                  <span>
                    <Play />
                  </span>
                </span>
                <i />
                <span>
                  <Chevron />
                </span>
              </div>
            </>
          ) : null}
          {c.about.quote ? (
            <blockquote>
              “{c.about.quote}”{!c.about.image && c.about.author ? <cite>{c.about.author}</cite> : null}
            </blockquote>
          ) : null}
        </div>
      ) : null,
    hours:
      c.hours.days.length || c.hours.title ? (
        <div className="ob-steps">
          {c.hours.title ? (
            <h2 className="ob-h left">
              <Lines lines={split(c.hours.title)} />
            </h2>
          ) : null}
          {c.hours.note ? <p className="ob-lead left">{c.hours.note}</p> : null}
          {c.hours.days.length ? (
            <ol>
              {c.hours.days.map((day, i) => (
                <li key={i} className={`${day.highlight ? "on" : ""} ${day.closed ? "off" : ""}`}>
                  <i>{String(i + 1).padStart(2, "0")}.</i>
                  <span>
                    <b>{day.time || day.label}</b>
                    {day.time ? <small>{day.label}</small> : null}
                  </span>
                </li>
              ))}
            </ol>
          ) : null}
          {hasCard ? (
            <div className="ob-chart">
              <Img src={c.hero.photo} alt="" style={c.hero.photoStyle} />
              <div className="ob-glass ob-chart-card">
                <span className="ob-widget-top">
                  <span className="ob-ic">
                    <Glyph index={2} />
                  </span>
                  {card.label}
                  <span className="ob-dot w">
                    <ArrowUp />
                  </span>
                </span>
                <span className="ob-glass ob-chart-in">
                  {card.price ? <b className="ob-led">{card.price}</b> : null}
                  <svg viewBox="0 0 200 70" preserveAspectRatio="none" aria-hidden>
                    <path className="fill" d="M0 58C26 54 34 38 58 44s30 16 54 2 34-6 48-22 26-14 40-18V70H0z" />
                    <path d="M0 58C26 54 34 38 58 44s30 16 54 2 34-6 48-22 26-14 40-18" />
                  </svg>
                  {card.name ? (
                    <small>
                      <Glyph index={0} />
                      {card.name}
                    </small>
                  ) : null}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      ) : null,
    feature:
      c.feature.title || c.feature.big || c.feature.image ? (
        <div className="ob-feature">
          <Img src={c.feature.image} className="ob-feature-img" />
          <div className="ob-feature-body">
            <div className="ob-feature-main">
              {c.feature.tag ? <Tag>{c.feature.tag}</Tag> : null}
              {c.feature.big ? <strong>{c.feature.big}</strong> : null}
              {c.feature.label ? <small>{c.feature.label}</small> : null}
              {c.hero.showName ? (
                <span className="ob-brand">
                  {c.logo ? <Img src={c.logo} alt="" className="ob-logo" /> : <House />}
                  <b>{c.brand}</b>
                </span>
              ) : null}
              {words.length === 1 ? <b className="ob-feature-one">{words[0]}</b> : null}
              {c.feature.text ? <p>{c.feature.text}</p> : null}
              <Act c={c} to={{ label: c.feature.button, href: c.feature.href }} id="feature" className="ob-btn">
                {c.feature.button} {arrow}
              </Act>
            </div>
            {words.length > 1 ? (
              <div className="ob-words">
                {words.map((word, i) => (
                  <span key={i} style={{ opacity: Math.max(0.22, 1 - Math.abs(i - mid) * 0.34) }}>
                    {word}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null,
    links:
      c.links.items.length || c.links.title ? (
        <div className="ob-faq">
          {c.links.label ? <Tag>{c.links.label}</Tag> : null}
          {c.links.title ? (
            <h2 className="ob-h left">
              <Lines lines={split(c.links.title)} accent="" />
            </h2>
          ) : null}
          {c.links.items.length ? (
            <div className="ob-rows">
              {c.links.items.map((block) => (
                <Item key={block.id} c={c} block={block} className="ob-row">
                  <span className="ob-row-txt">
                    {block.label ? <small>{block.label}</small> : null}
                    <b>{block.title}</b>
                    {block.subtitle ? <span>{block.subtitle}</span> : null}
                  </span>
                  <i className={block.subtitle ? "open" : undefined} />
                </Item>
              ))}
            </div>
          ) : null}
        </div>
      ) : null,
    nav: c.chips.length ? (
      <div className="ob-nav">
        {c.chipsTitle ? <p>{c.chipsTitle}</p> : null}
        <div>
          {c.chips.map((chip, i) =>
            i === 0 ? (
              <Act key={i} c={c} to={chip} id={`chip-${i}`} className="ob-btn sm">
                {chip.label} {arrow}
              </Act>
            ) : (
              <Act key={i} c={c} to={chip} id={`chip-${i}`} className="ob-ghost" />
            ),
          )}
        </div>
      </div>
    ) : null,
    promo:
      c.final.title || c.final.button ? (
        <div className="ob-final">
          {c.final.title ? (
            <h2 className="ob-h left">
              <Lines lines={split(c.final.title)} accent="" />
            </h2>
          ) : null}
          {c.final.text ? <p className="ob-lead left">{c.final.text}</p> : null}
          <div className="ob-final-btns">
            <Act c={c} to={{ label: c.final.button, href: c.final.href }} id="cta-final" className="ob-btn sm">
              {c.final.button} {arrow}
            </Act>
            <Act c={c} to={c.hero.cta2} id="cta2-final" className="ob-ghost" />
          </div>
        </div>
      ) : null,
    footer: (
      <div className="ob-foot">
        <span className="ob-brand">
          {c.logo ? <Img src={c.logo} alt="" className="ob-logo" /> : <House />}
          <b>{c.brand}</b>
        </span>
        {c.brandSub ? <p>{c.brandSub}</p> : null}
        <Socials c={c} className="ob-socials" />
        <span className="ob-copy">{c.footerText || `${c.brand} © ${new Date().getFullYear()}`}</span>
        <span className="ob-giant" aria-hidden>
          <span>{c.brand}</span>
        </span>
      </div>
    ),
  };
};
