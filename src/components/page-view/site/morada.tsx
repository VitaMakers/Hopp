"use client";

import { Act, ArrowUp, Img, Item, Lines, Pin, Socials, Star, split, type SiteRender } from "./kit";

const line = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, width: "1em", height: "1em", "aria-hidden": true };
// One line icon per row of the benefits list (house, shield, layers, headset).
const ROW_ICONS = [
  <path key="a" d="M4 11.500 12 4l8 7.500V20H4zM9.500 20v-5.500h5V20" />,
  <path key="b" d="M12 3.500 5 6v5.500c0 4.300 2.900 7.400 7 9 4.100-1.600 7-4.700 7-9V6zM9 12l2.200 2.200L15.200 10" />,
  <path key="c" d="m12 4 8 4-8 4-8-4zM4 12l8 4 8-4M4 16l8 4 8-4" />,
  <path key="d" d="M5 14v-2a7 7 0 0 1 14 0v2M5 13.500h2.500V18H6a1 1 0 0 1-1-1zM19 13.500h-2.500V18H18a1 1 0 0 0 1-1zM17.500 18c0 1.500-1.500 2.500-4 2.500" />,
];

// "Morada" — real estate, cream and orange with dark brown surfaces.
// Reference: a property landing (giant brand word behind the house, dark
// floating property card, featured grid, dark offer, benefits, categories).
export const morada: SiteRender = (c) => {
  const items = c.catalog.items;
  // Link blocks with a small label (price) are category cards; the others
  // are the benefit rows. The first row image is the art of that section.
  const cats = c.links.items.filter((b) => b.label.trim());
  const rows = c.links.items.filter((b) => !b.label.trim());
  const art = rows.find((b) => b.imageUrl)?.imageUrl ?? "";
  const thumb = items[0]?.imageUrl || c.hero.photo;
  const details = items[0]?.buttonText ?? "";
  const thumbs = items.slice(1, 3).filter((b) => b.imageUrl);
  const price = (text: string) => {
    const [value, unit] = text.split("/").map((s) => s.trim());
    return (
      <>
        {value}
        {unit ? <small> / {unit}</small> : null}
      </>
    );
  };
  // The giant word always spans the column, whatever the brand length.
  const giant = { fontSize: `clamp(34px, ${(150 / Math.max(c.brand.length, 3)).toFixed(1)}cqi, 132px)` };
  const contact = { label: c.final.button, href: c.final.href };
  return {
    hero: (
      <div className="mo-hero">
        <div className="mo-bar">
          {c.hero.showName ? (
            <div className="mo-brand">
              {c.logo ? <Img src={c.logo} alt="" className="mo-logo" /> : null}
              <b>{c.brand}</b>
            </div>
          ) : (
            <span />
          )}
          <Act c={c} to={contact} id="bar" className="mo-btn dark sm">
            {contact.label} <ArrowUp />
          </Act>
        </div>
        {c.hero.showName ? (
          <div className="mo-giant" style={giant} aria-hidden>
            {c.brand}
          </div>
        ) : null}
        {c.hero.photo ? (
          <div className={`mo-house ${c.hero.showName ? "" : "solo"}`} style={c.hero.coverStyle}>
            <Img src={c.hero.photo} alt={c.brand} style={c.hero.photoStyle} />
          </div>
        ) : null}
        {c.hero.card.name ? (
          <Act c={c} to={{ label: c.hero.card.name, href: c.hero.card.href }} id="hero-card" className={`mo-card ${c.hero.photo ? "up" : ""}`}>
            <span className="mo-card-top">
              <span>
                <b>{c.hero.card.name}</b>
                {c.hero.card.label ? <small>{c.hero.card.label}</small> : null}
              </span>
              {c.hero.card.price ? <em>{c.hero.card.price}</em> : null}
            </span>
            {thumb ? (
              <span className="mo-card-img">
                <Img src={thumb} alt={c.hero.card.name} />
              </span>
            ) : null}
            {details || c.hero.cta.label ? (
              <span className="mo-card-btns">
                {details ? <span className="mo-btn line sm">{details}</span> : null}
                {c.hero.cta.label ? <span className="mo-btn sm">{c.hero.cta.label}</span> : null}
              </span>
            ) : null}
          </Act>
        ) : null}
        <div className="mo-intro">
          {c.hero.pill ? <span className="mo-label">{c.hero.pill}</span> : null}
          {c.hero.lines.length ? (
            <h1 className="mo-h">
              <Lines lines={c.hero.lines} />
            </h1>
          ) : null}
          {c.hero.sub ? <p className="mo-lead">{c.hero.sub}</p> : null}
          {c.hero.cta2.label || contact.label ? (
            <div className="mo-btns">
              <Act c={c} to={c.hero.cta2} id="cta2" className="mo-btn line">
                {c.hero.cta2.label} <ArrowUp />
              </Act>
              <Act c={c} to={contact} id="cta" className="mo-btn">
                {contact.label} <ArrowUp />
              </Act>
            </div>
          ) : null}
        </div>
      </div>
    ),
    catalog:
      items.length || c.catalog.title ? (
        <div className="mo-sec soft">
          {c.catalog.label ? <span className="mo-label">{c.catalog.label}</span> : null}
          {c.catalog.title ? (
            <h2 className="mo-h">
              <Lines lines={split(c.catalog.title)} />
            </h2>
          ) : null}
          {c.strip.length ? (
            <div className="mo-pills">
              {c.strip.map((word, i) => (
                <span key={i} className={i === 0 ? "on" : undefined}>
                  {i === 0 ? <i /> : null}
                  {word}
                </span>
              ))}
            </div>
          ) : null}
          {items.length ? (
            <div className="mo-grid">
              {items.map((block) => (
                <Item key={block.id} c={c} block={block} className="mo-prop">
                  <span className="mo-prop-img">
                    <Img src={block.imageUrl} alt={block.title} />
                  </span>
                  <span className="mo-prop-body">
                    <b>{block.title}</b>
                    {block.label ? (
                      <small>
                        <Pin /> {block.label}
                      </small>
                    ) : null}
                    {block.description ? <span className="mo-prop-desc">{block.description}</span> : null}
                    {block.price ? <em>{price(block.price)}</em> : null}
                  </span>
                </Item>
              ))}
            </div>
          ) : null}
          <div className="mo-center">
            <Act c={c} to={c.hero.cta2} id="catalog-all" className="mo-btn dark">
              {c.hero.cta2.label} <ArrowUp />
            </Act>
          </div>
        </div>
      ) : null,
    links:
      rows.length || c.links.title ? (
        <div className="mo-sec">
          {c.links.label ? <span className="mo-label">{c.links.label}</span> : null}
          {c.links.title ? (
            <h2 className="mo-h big">
              <Lines lines={split(c.links.title)} />
            </h2>
          ) : null}
          {rows.length ? (
            <div className="mo-rows">
              {rows.map((block, i) => (
                <Item key={block.id} c={c} block={block} className="mo-row">
                  <svg {...line}>{ROW_ICONS[i % ROW_ICONS.length]}</svg>
                  <span>
                    <b>{block.title}</b>
                    {block.subtitle ? <small>{block.subtitle}</small> : null}
                  </span>
                </Item>
              ))}
            </div>
          ) : null}
          {art ? (
            <div className="mo-art">
              <i />
              <span>
                <Img src={art} />
              </span>
            </div>
          ) : null}
        </div>
      ) : null,
    text:
      c.about.title || c.about.body || c.about.quote ? (
        <div className="mo-sec card">
          {c.about.label ? <span className="mo-label">{c.about.label}</span> : null}
          {c.about.image ? (
            <div className={`mo-duo ${c.hero.photo ? "two" : ""}`}>
              <span>
                <Img src={c.about.image} />
              </span>
              {c.hero.photo ? (
                <span>
                  <Img src={c.hero.photo} />
                </span>
              ) : null}
            </div>
          ) : null}
          {c.about.title ? (
            <h2 className="mo-h mid">
              <Lines lines={split(c.about.title)} />
            </h2>
          ) : null}
          {c.about.body ? <p className="mo-p">{c.about.body}</p> : null}
          {c.about.quote ? (
            <div className="mo-rating">
              <span className="mo-faces">
                <i>
                  <Star />
                </i>
                <i>
                  <Star />
                </i>
                <i>
                  <Star />
                </i>
              </span>
              <span>
                <b>{c.about.quote}</b>
                {c.about.author ? <small>{c.about.author}</small> : null}
              </span>
            </div>
          ) : null}
        </div>
      ) : null,
    stats: c.stats.length ? (
      <div className="mo-stats">
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
        <div className="mo-offer">
          {c.feature.image ? (
            <div className="mo-offer-img">
              <Img src={c.feature.image} />
            </div>
          ) : null}
          {c.feature.tag ? <span className="mo-tag">{c.feature.tag}</span> : null}
          {c.feature.big ? <strong>{c.feature.big}</strong> : null}
          {c.feature.label ? <span className="mo-offer-sub">{c.feature.label}</span> : null}
          {c.feature.title ? <b>{c.feature.title}</b> : null}
          {c.feature.text ? <p>{c.feature.text}</p> : null}
          <Act c={c} to={{ label: c.feature.button, href: c.feature.href }} id="feature" className="mo-btn sm">
            {c.feature.button} <ArrowUp />
          </Act>
          {thumbs.length ? (
            <div className="mo-offer-thumbs">
              {thumbs.map((block) => (
                <span key={block.id}>
                  <Img src={block.imageUrl} alt={block.title} />
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null,
    nav:
      c.chips.length || c.chipsTitle || cats.length ? (
        <div className="mo-sec soft">
          {c.chipsTitle ? <h2 className="mo-h mid">{c.chipsTitle}</h2> : null}
          {c.chips.length ? (
            <div className="mo-chips">
              {c.chips.map((chip, i) => (
                <Act key={i} c={c} to={chip} id={`chip-${i}`} className={i === 0 ? "on" : undefined} />
              ))}
            </div>
          ) : null}
          {cats.length ? (
            <div className="mo-grid">
              {cats.map((block) => (
                <Item key={block.id} c={c} block={block} className="mo-prop cat">
                  <span className="mo-prop-img">
                    <Img src={block.imageUrl} alt={block.title} />
                  </span>
                  <span className="mo-prop-body">
                    <b>{block.title}</b>
                    {block.subtitle ? <span className="mo-prop-desc">{block.subtitle}</span> : null}
                    <span className="mo-cat-foot">
                      <em>{block.label}</em>
                      <i>
                        <ArrowUp />
                      </i>
                    </span>
                  </span>
                </Item>
              ))}
            </div>
          ) : null}
          {cats.length ? (
            <div className="mo-center">
              <Act c={c} to={c.hero.cta2} id="nav-all" className="mo-btn dark sm">
                {c.hero.cta2.label} <ArrowUp />
              </Act>
            </div>
          ) : null}
        </div>
      ) : null,
    hours:
      c.hours.days.length || c.hours.title ? (
        <div className="mo-sec card">
          {c.hours.title ? (
            <h2 className="mo-h mid">
              <Lines lines={split(c.hours.title)} />
            </h2>
          ) : null}
          {c.hours.note ? <p className="mo-p">{c.hours.note}</p> : null}
          {c.hours.days.length ? (
            <div className="mo-faq">
              {c.hours.days.map((day, i) => (
                <div key={i} className={`${day.highlight ? "on" : ""} ${day.closed ? "off" : ""}`}>
                  <span>
                    <b>{day.label}</b>
                    {day.time ? <small>{day.time}</small> : null}
                  </span>
                  <i aria-hidden>{day.highlight ? "–" : "+"}</i>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null,
    promo:
      c.final.title || c.final.button ? (
        <div className="mo-final">
          <div className="mo-final-body">
            {c.final.title ? (
              <h2 className="mo-h mid">
                <Lines lines={split(c.final.title)} />
              </h2>
            ) : null}
            {c.final.text ? <p className="mo-p">{c.final.text}</p> : null}
            <div className="mo-btns">
              <Act c={c} to={contact} id="cta-final" className="mo-btn sm">
                {contact.label} <ArrowUp />
              </Act>
              <Act c={c} to={c.hero.cta2} id="cta-final2" className="mo-btn line sm">
                {c.hero.cta2.label} <ArrowUp />
              </Act>
            </div>
          </div>
          <div className={`mo-art ${c.hero.photo ? "" : "bare"}`}>
            <i />
            {c.hero.photo ? (
              <span>
                <Img src={c.hero.photo} />
              </span>
            ) : null}
          </div>
        </div>
      ) : null,
    footer: (
      <div className="mo-foot">
        <div className="mo-foot-top">
          <span className="mo-foot-brand">
            <b>{c.brand}</b>
            {c.brandSub ? <small>{c.brandSub}</small> : null}
          </span>
          <Socials c={c} className="mo-socials" max={4} />
        </div>
        <span className="mo-foot-note">{c.footerText || `${c.brand} © ${new Date().getFullYear()}`}</span>
      </div>
    ),
  };
};
