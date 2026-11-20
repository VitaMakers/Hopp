import { describe, expect, it } from "vitest";
import { enforcePlan, planViolations } from "./entitlements";
import { createBlock, defaultPageDoc } from "./page/catalog";
import type { Block } from "./page/schema";

function paidPage() {
  const doc = defaultPageDoc("Teste");
  doc.theme.premium = "resto-casa" as typeof doc.theme.premium;
  doc.profile.coverType = "video";
  doc.profile.coverVideos = ["https://example.com/v.mp4"];
  doc.blocks = [createBlock("link"), { ...createBlock("form"), enabled: true } as Block, createBlock("videos")];
  return doc;
}

describe("enforcePlan", () => {
  it("leaves nothing the free plan cannot show", () => {
    const shown = enforcePlan(paidPage(), "free");
    expect(planViolations(shown, "free")).toEqual([]);
    expect(shown.theme.premium).toBe("");
    expect(shown.profile.coverType).toBe("image");
    expect(shown.blocks.map((b) => b.type)).toEqual(["link"]);
  });

  it("keeps premium and video on Essencial but drops the form block", () => {
    const shown = enforcePlan(paidPage(), "essencial");
    expect(shown.theme.premium).toBe("resto-casa");
    expect(shown.profile.coverType).toBe("video");
    expect(shown.blocks.map((b) => b.type)).toEqual(["link", "videos"]);
  });

  it("returns the same page on Profissional", () => {
    const doc = paidPage();
    expect(enforcePlan(doc, "profissional")).toBe(doc);
  });
});
