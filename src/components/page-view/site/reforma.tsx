"use client";

import { useRef, useState, type ReactNode } from "react";
import { Act, ArrowRight, ArrowUp, Calendar, Clock, Img, Item, Pin, Socials, StatIcon, split, type SiteCtx, type SiteRender } from "./kit";

const ico = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, width: "1em", height: "1em", "aria-hidden": true };
const Roller = () => <svg {...ico}><rect x="4" y="4" width="13" height="5" rx="1.2" /><path d="M17 6.500h2a1 1 0 0 1 1 1V11a1 1 0 0 1-1 1h-6a1 1 0 0 0-1 1v2M11 15h2v5h-2z" /></svg>;
const Badge = () => <svg {...ico}><path d="M12 3 5 6v5c0 4.500 3 8 7 10 4-2 7-5.500 7-10V6z" /><path d="m9 12 2 2 4-4" /></svg>;
const Home = () => <svg {...ico}><path d="M4 11 12 4l8 7M6 10v9h12v-9M10 19v-5h4v5" /></svg>;
const Building = () => <svg {...ico}><path d="M5 20V6l8-2v16M13 9h6v11M3 20h18M8 9h2M8 13h2M16 13h1M16 16h1" /></svg>;
const Sparkle = () => <svg {...ico}><path d="m11 4 1.700 4.300L17 10l-4.300 1.700L11 16l-1.700-4.300L5 10l4.300-1.700zM18 15l.800 1.900 1.900.800-1.900.800L18 20.400l-.800-1.900-1.900-.800 1.900-.800z" /></svg>;
const Grid = () => <svg {...ico}><rect x="4" y="4" width="7" height="7" rx="1.500" /><rect x="13" y="4" width="7" height="7" rx="1.500" /><rect x="4" y="13" width="7" height="7" rx="1.500" /><rect x="13" y="13" width="7" height="7" rx="1.500" /></svg>;
const Frames = () => <svg {...ico}><rect x="4" y="7" width="13" height="13" rx="2" /><path d="M8 4h10a2 2 0 0 1 2 2v10" /></svg>;
const Down = () => <svg {...ico}><path d="m6 9 6 6 6-6" /></svg>;
const ArrowLeft = () => <svg {...ico}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>;

const STAT_ICONS = [<Roller key="a" />, <StatIcon key="b" index={1} />, <Badge key="c" />, <Pin key="d" />];
const SERVICE_ICONS = [<Roller key="a" />, <Home key="b" />, <Home key="c" />, <Building key="d" />, <Sparkle key="e" />, <Badge key="f" />];
const WHY_ICONS = [<Roller key="a" />, <Badge key="b" />, <Sparkle key="c" />, <Clock key="d" />];
const STRIP_ICONS = [<Roller key="a" />, <Badge key="b" />, <Home key="c" />];

// Title lines: the last one is the accent (hand-drawn underline). `stacked`
// keeps every line on its own row; otherwise the accent follows the previous
// line, like a highlighted word.
function title(list: string[], stacked = false): ReactNode {
  if (list.length < 2) return list[0] ?? null;
  const last = list.length - 1;
  return list.map((line, i) =>
    i === last ? (
      <span key={i} className="rf-ac">
        {line}
      </span>
    ) : (
      <span key={i} className={stacked || i < last - 1 ? "rf-ln" : undefined}>
        {line}{" "}
      </span>
    ),
  );
}

// Project cards on a horizontal rail, filtered by the cards' own tags.
function Projects({ c }: { c: SiteCtx }) {
  const rail = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState("");
  const [pos, setPos] = useState(0);
  const items = c.catalog.items;
  const tags = [...new Set(items.map((b) => b.label.trim()).filter(Boolean))];
  const active = tags.includes(tab) ? tab : "";
  const shown = active ? items.filter((b) => b.label.trim() === active) : items;
  const pick = (tag: string) => {
    setTab(tag);
    setPos(0);
    rail.current?.scrollTo({ left: 0 });
  };
  const move = (dir: number) => rail.current?.scrollBy({ left: dir * 242, behavior: "smooth" });
  const onScroll = () => {
    const el = rail.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setPos(max > 0 ? Math.min(1, Math.max(0, el.scrollLeft / max)) : 0);
  };
  const part = 100 / Math.max(shown.length, 1);
  return (
    <>
      {tags.length > 1 ? (
        <div className="rf-filters">
          <button type="button" className={active ? undefined : "on"} onClick={() => pick("")} aria-label="Todos">
            <Grid />
          </button>
          {tags.map((tag) => (
            <button key={tag} type="button" className={active === tag ? "on" : undefined} onClick={() => pick(tag)}>
              {tag}
            </button>
          ))}
        </div>
      ) : null}
      {shown.length ? (
        <div className="rf-rail" ref={rail} onScroll={onScroll}>
          {shown.map((block) => (
            <Item key={block.id} c={c} block={block} className="rf-card">
              <span className="rf-card-img">
                <Img src={block.imageUrl} alt={block.title} />
                {block.label ? <span className="rf-tag">{block.label}</span> : null}
                <i>
                  <Frames />
                </i>
              </span>
              <span className="rf-card-body">
                <span className="rf-card-txt">
                  <b>{block.title}</b>
                  {block.description ? (
                    <small>
                      <Pin />
                      <span>{block.description}</span>
                    </small>
                  ) : null}
                  {block.price ? <em>{block.price}</em> : null}
                </span>
                {block.buttonText ? (
                  <span className="rf-view">
                    {block.buttonText} <ArrowRight />
                  </span>
                ) : null}
              </span>
            </Item>
          ))}
        </div>
      ) : null}
      {shown.length > 1 ? (
        <div className="rf-pager">
          <button type="button" onClick={() => move(-1)} aria-label="Anterior">
            <ArrowLeft />
          </button>
          <button type="button" className="on" onClick={() => move(1)} aria-label="Próximo">
            <ArrowRight />
          </button>
          <span>
            <i style={{ width: `${part}%`, marginLeft: `${pos * (100 - part)}%` }} />
          </span>
        </div>
      ) : null}
    </>
  );
}

// "Reforma" — house painting / home services, royal blue, lime and white.
// Reference: a painting company landing (blue cover, frosted estimate card,
// project rail, numbered services, call banner, "why choose" cards).
export const reforma: SiteRender = (c) => {
  const [quote, ...quoteRest] = c.about.quote.split(" — ");
  const whyImage = c.links.items.find((b) => b.imageUrl)?.imageUrl ?? "";
  const estimate = c.final.button || c.hero.cta.label;
  return {
    hero: (
      <div className="rf-hero" style={c.hero.coverStyle}>
        {c.hero.photo ? (
          <div className="rf-photo">
            <Img src={c.hero.photo} alt={c.brand} style={c.hero.photoStyle} />
          </div>
        ) : null}
        <div className="rf-bar">
          {c.hero.showName ? (
            <div className="rf-brand">
              {c.logo ? <Img src={c.logo} alt="" className="rf-logo" /> : null}
              <b>{c.brand}</b>
            </div>
          ) : (
            <span />
          )}
          {c.hero.card.name ? (
            <Act c={c} to={{ label: c.hero.card.name, href: c.hero.card.href }} id="hero-card" className="rf-btn sm">
              {c.hero.card.label ? <small>{c.hero.card.label}</small> : null}
              <span>
                {c.hero.card.name}
                {c.hero.card.price ? ` · ${c.hero.card.price}` : ""}
              </span>
              <ArrowRight />
            </Act>
          ) : (
            <Socials c={c} className="rf-socials" max={2} />
          )}
        </div>
        <div className="rf-head">
          {c.hero.pill ? (
            <span className="rf-tag">
              <Sparkle />
              {c.hero.pill}
            </span>
          ) : null}
          {c.hero.lines.length ? <h1 className="rf-title">{title(c.hero.lines, true)}</h1> : null}
          {c.hero.sub ? <p className="rf-sub">{c.hero.sub}</p> : null}
          {c.hero.cta.label || c.hero.cta2.label ? (
            <div className="rf-btns">
              <Act c={c} to={c.hero.cta} id="cta" className="rf-btn">
                <span>{c.hero.cta.label}</span> <ArrowRight />
              </Act>
              <Act c={c} to={c.hero.cta2} id="cta2" className="rf-btn line">
                <span>{c.hero.cta2.label}</span>
              </Act>
            </div>
          ) : null}
        </div>
      </div>
    ),
    hours:
      c.hours.days.length || c.hours.title ? (
        <div className="rf-form">
          {c.hours.title ? <b className="rf-form-title">{c.hours.title}</b> : null}
          {c.hours.days.length ? (
            <div className="rf-fields">
              {c.hours.days.map((day, i) => (
                <div key={i} className={`${day.highlight ? "on" : ""} ${day.closed ? "off" : ""}`}>
                  <small>{day.label}</small>
                  <span>
                    <b>{day.time}</b>
                    {i > 0 && i === c.hours.days.length - 1 ? <Calendar /> : <Down />}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          {c.strip.length || c.hours.note ? (
            <div className="rf-services">
              {c.hours.note ? <small>{c.hours.note}</small> : null}
              {c.strip.map((word, i) => (
                <span key={i}>{word}</span>
              ))}
            </div>
          ) : null}
          <Act c={c} to={{ label: estimate, href: c.hero.cta.href ?? c.final.href }} id="estimate" className="rf-btn blue wide">
            <span>{estimate}</span> <ArrowRight />
          </Act>
        </div>
      ) : null,
    stats: c.stats.length ? (
      <div className="rf-stats">
        {c.stats.map((s, i) => (
          <div key={i}>
            <i>{STAT_ICONS[i % STAT_ICONS.length]}</i>
            <span>
              <b>{s.value}</b>
              <small>{s.label}</small>
            </span>
          </div>
        ))}
      </div>
    ) : null,
    catalog:
      c.catalog.items.length || c.catalog.title ? (
        <div className="rf-sec">
          {c.catalog.label ? (
            <span className="rf-tag">
              <Sparkle />
              {c.catalog.label}
            </span>
          ) : null}
          {c.catalog.title ? <h2 className="rf-h">{title(split(c.catalog.title))}</h2> : null}
          <Projects c={c} />
        </div>
      ) : null,
    text:
      c.about.title || c.about.body || c.about.quote ? (
        <div className="rf-sec rf-story">
          {c.about.image || c.about.label || c.about.quote ? (
            <div className="rf-story-top">
              {c.about.image ? (
                <div className="rf-story-img">
                  <Img src={c.about.image} />
                </div>
              ) : null}
              <div className="rf-story-body">
                {c.about.label ? (
                  <span className="rf-tag">
                    <Sparkle />
                    {c.about.label}
                  </span>
                ) : null}
                {c.about.quote ? (
                  <blockquote>
                    “{quote}
                    {quoteRest.length ? <span> — {quoteRest.join(" — ")}</span> : null}”
                  </blockquote>
                ) : null}
                {c.about.author ? <cite>{c.about.author}</cite> : null}
              </div>
            </div>
          ) : null}
          {c.about.title ? <h2 className="rf-h">{title(split(c.about.title))}</h2> : null}
          {c.about.body ? <p className="rf-p">{c.about.body}</p> : null}
        </div>
      ) : null,
    nav:
      c.chips.length || c.chipsTitle ? (
        <div className="rf-sec rf-nav">
          {c.chipsTitle ? <h3 className="rf-h3">{c.chipsTitle}</h3> : null}
          {c.chips.map((chip, i) => (
            <Act key={i} c={c} to={chip} id={`chip-${i}`} className={`rf-svc${i === 0 ? " on" : ""}`}>
              <small>{String(i + 1).padStart(2, "0")}</small>
              {SERVICE_ICONS[i % SERVICE_ICONS.length]}
              <b>{chip.label}</b>
              <i>
                <ArrowRight />
              </i>
            </Act>
          ))}
        </div>
      ) : null,
    feature:
      c.feature.title || c.feature.big ? (
        <div className="rf-banner">
          {c.feature.image ? <Img src={c.feature.image} className="rf-banner-img" /> : null}
          <div className="rf-banner-body">
            {c.feature.tag ? <span className="rf-tag">{c.feature.tag}</span> : null}
            {c.feature.big ? <strong>{c.feature.big}</strong> : null}
            {c.feature.title ? <h2>{title(split(c.feature.title))}</h2> : null}
            {c.feature.text ? <p>{c.feature.text}</p> : null}
            <Act c={c} to={{ label: c.feature.button, href: c.feature.href }} id="feature" className="rf-btn sm">
              <span>{c.feature.button}</span> <ArrowRight />
            </Act>
          </div>
          {c.feature.label ? (
            <div className="rf-banner-strip">
              {c.feature.label.split("·").map((word, i) =>
                word.trim() ? (
                  <span key={i}>
                    {STRIP_ICONS[i % STRIP_ICONS.length]}
                    {word.trim()}
                  </span>
                ) : null,
              )}
            </div>
          ) : null}
        </div>
      ) : null,
    links:
      c.links.items.length || c.links.title ? (
        <div className="rf-why">
          {c.links.label ? (
            <span className="rf-tag">
              <Sparkle />
              {c.links.label}
            </span>
          ) : null}
          {c.links.title ? <h2 className="rf-h">{title(split(c.links.title))}</h2> : null}
          {whyImage ? (
            <div className="rf-why-img">
              <Img src={whyImage} />
            </div>
          ) : null}
          {c.links.items.length ? (
            <div className="rf-why-grid">
              {c.links.items.map((block, i) => (
                <Item key={block.id} c={c} block={block} className="rf-why-card">
                  <span className="rf-why-top">
                    <i>{WHY_ICONS[i % WHY_ICONS.length]}</i>
                    {block.label ? <span className="rf-tag">{block.label}</span> : <ArrowUp />}
                  </span>
                  <b>{block.title}</b>
                  {block.subtitle ? <small>{block.subtitle}</small> : null}
                </Item>
              ))}
            </div>
          ) : null}
        </div>
      ) : null,
    promo:
      c.final.title || c.final.button ? (
        <div className="rf-sec rf-final">
          {c.final.title ? <h2 className="rf-h">{title(split(c.final.title))}</h2> : null}
          {c.final.text ? <p className="rf-p">{c.final.text}</p> : null}
          <Act c={c} to={{ label: c.final.button, href: c.final.href }} id="cta-final" className="rf-btn">
            <span>{c.final.button}</span> <ArrowRight />
          </Act>
        </div>
      ) : null,
    footer: (
      <div className="rf-footer">
        <div>
          <b>{c.brand}</b>
          {c.brandSub ? <small>{c.brandSub}</small> : null}
        </div>
        <Socials c={c} className="rf-socials" />
        <span>{c.footerText || `${c.brand} © ${new Date().getFullYear()}`}</span>
      </div>
    ),
  };
};
