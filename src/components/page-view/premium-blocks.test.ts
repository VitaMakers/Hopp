import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { defaultPageDoc } from "@/lib/page/catalog";
import { PREMIUM_DESIGNS, pageDocSchema, type PageDoc, type Theme } from "@/lib/page/schema";
import { TEMPLATES } from "@/lib/page/templates";
import { PremiumView } from "./PremiumView";
import { getPremiumSections, PremiumSectionBody, premiumSectionSummary } from "../editor/PremiumSections";

type Design = Exclude<Theme["premium"], "">;
const DESIGNS = PREMIUM_DESIGNS.filter((d): d is Design => d !== "");

// A representative doc for each premium design: prefer a real template that
// uses it; otherwise start from the default doc and switch on the design (its
// premium fields come from the schema defaults).
function docFor(design: Design): PageDoc {
  const template = TEMPLATES.find((t) => t.tab === "premium" && t.build("Ana").theme.premium === design);
  if (template) return template.build("Ana");
  const base = defaultPageDoc("Ana");
  return pageDocSchema.parse({ ...base, theme: { ...base.theme, premium: design } });
}

describe("premium models — Blocos editing", () => {
  it("every premium design has sections, each fully editable (no unhandled section)", () => {
    for (const design of DESIGNS) {
      const doc = docFor(design);
      const sections = getPremiumSections(design);
      expect(sections.length, design).toBeGreaterThan(0);
      for (const section of sections) {
        // The editor card body for this section must render real controls.
        const markup = renderToStaticMarkup(
          createElement(PremiumSectionBody, { id: section.id, doc, onChange: () => {} }),
        );
        expect(markup, `${design} → ${section.id}`).not.toBe("");
        expect(markup, `${design} → ${section.id}`).toMatch(/<(input|textarea|button|select|label|svg)/);
        // The collapsed-card summary never throws and is a string.
        expect(typeof premiumSectionSummary(section.id, doc)).toBe("string");
      }
    }
  });

  it("every premium design renders on the public page and in the editor", () => {
    for (const design of DESIGNS) {
      const doc = docFor(design);
      // Public page.
      expect(() => renderToStaticMarkup(createElement(PremiumView, { doc, handle: "ana" })), design).not.toThrow();
      // Editor preview (click-to-edit wiring active).
      const editor = renderToStaticMarkup(createElement(PremiumView, { doc, onEdit: () => {} }));
      expect(editor, design).not.toBe("");
    }
  });

  it("the Loja/store preview tags its parts for click-to-edit", () => {
    const doc = docFor("store");
    const editor = renderToStaticMarkup(createElement(PremiumView, { doc, onEdit: () => {} }));
    for (const tag of ["premium:hero", "premium:promo", "premium:size", "premium:nav"]) {
      expect(editor, tag).toContain(`data-edit="${tag}"`);
    }
  });

  it("exposes the expected cards (colors first) for the main models", () => {
    const ids = (design: Design) => getPremiumSections(design).map((s) => s.id);
    // Colors is always the first card.
    for (const design of DESIGNS) expect(ids(design)[0], design).toBe("premium:colors");
    // Loja Black Friday / store family shows all shop cards.
    for (const id of ["premium:hero", "premium:promo", "premium:feature", "premium:size", "premium:nav"]) {
      expect(ids("store"), id).toContain(id);
    }
    // Restaurant designs add a text card on top of the shop cards.
    for (const design of ["bistro", "bar", "casa"] as Design[]) {
      expect(ids(design), design).toContain("premium:text");
      expect(ids(design), design).toContain("premium:hero");
    }
  });
});
