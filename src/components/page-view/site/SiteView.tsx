"use client";

import { Fragment } from "react";
import { APP_NAME } from "@/lib/env";
import type { PageDoc } from "@/lib/page/schema";
import { footerHidden, textOn } from "../PremiumView";
import { buildSiteCtx, SITE_PARTS, type SiteNodes } from "./kit";
import { SITE_RENDERS } from "./designs";

// Shell of the "site" family: builds the shared content, asks the chosen
// design to draw each part and lays them out in the owner's order, skipping
// the hidden ones. The footer always stays last.
export function SiteView({ doc, handle, plan, extra }: { doc: PageDoc; handle?: string; plan?: string; extra?: React.ReactNode }) {
  const design = doc.theme.premium;
  const render = SITE_RENDERS[design];
  if (!render) return null;
  const { theme, premium } = doc;
  const brand = doc.profile.name || APP_NAME;
  const ctx = buildSiteCtx(doc, handle, brand);
  const nodes = render(ctx);
  const order = [...premium.partOrder.filter((id) => SITE_PARTS.includes(id)), ...SITE_PARTS.filter((id) => !premium.partOrder.includes(id))];
  const dark = textOn(theme.background) === "#ffffff";
  const footer = footerHidden(doc, plan) ? null : nodes.footer;
  return (
    <div className="site-wrap" style={{ "--s-bg": theme.background } as React.CSSProperties}>
    <div
      className={`vita-premium site site-${design} ${dark ? "site-dark" : "site-light"}`}
      style={{ "--s-bg": theme.background, "--s-text": theme.text, "--s-accent": theme.accent, "--s-on-accent": textOn(theme.accent) === "#ffffff" ? "#ffffff" : "#111111" } as React.CSSProperties}
    >
      {order.map((id) => {
        if (premium.hiddenParts.includes(id)) return null;
        const node = nodes[id.slice(8) as keyof SiteNodes];
        return node ? (
          <section key={id} data-edit={id} className={`sp sp-${id.slice(8)}`}>
            {node}
          </section>
        ) : null;
      })}
      {extra ? <div className="sp sp-extra">{extra}</div> : null}
      {footer ? <footer className="sp sp-footer">{footer}</footer> : <Fragment />}
    </div>
    </div>
  );
}
