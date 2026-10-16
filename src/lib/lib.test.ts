import { describe, expect, it } from "vitest";
import { summarize, type EventRow } from "./analytics";
import { toCsv } from "./csv";
import { handleError, normalizeHandle, safeHttpUrl, shortCodeError } from "./handles";
import { BLOCK_CATALOG, createBlock, defaultPageDoc, THEME_PRESETS } from "./page/catalog";
import { spotifyEmbedUrl, youtubeEmbedUrl } from "./page/embed";
import { linkHref, socialHref, vCard, whatsappHref } from "./page/links";
import { pageDocSchema, type BlockType } from "./page/schema";

describe("youtubeEmbedUrl", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?t=10", "dQw4w9WgXcQ"],
    ["https://m.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ])("embeds %s", (input, id) => {
    expect(youtubeEmbedUrl(input)).toBe(`https://www.youtube-nocookie.com/embed/${id}`);
  });

  it.each(["", "not a url", "https://vimeo.com/123", "https://youtube.com/watch?v=<script>"])(
    "rejects %s",
    (input) => expect(youtubeEmbedUrl(input)).toBeNull(),
  );
});

describe("spotifyEmbedUrl", () => {
  it("embeds tracks and locale-prefixed playlists", () => {
    expect(spotifyEmbedUrl("https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=x")).toBe(
      "https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC",
    );
    expect(spotifyEmbedUrl("https://open.spotify.com/intl-pt/playlist/37i9dQZF1DXcBWIGoYBM5M")).toBe(
      "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M",
    );
  });

  it("rejects other hosts and unknown kinds", () => {
    expect(spotifyEmbedUrl("https://evil.com/track/4uLU6hMCjMI75M1A2tKUQC")).toBeNull();
    expect(spotifyEmbedUrl("https://open.spotify.com/user/abc")).toBeNull();
  });
});

describe("handles", () => {
  it("normalizes case and a leading @", () => {
    expect(normalizeHandle("  @Maria.Silva ")).toBe("maria.silva");
  });

  it.each(["maria", "loja-da-ana", "a_b.c9"])("accepts %s", (handle) => {
    expect(handleError(handle)).toBeNull();
  });

  it.each(["ab", "maria silva", "-maria", "maria.", "dashboard", "l", "a".repeat(31)])("rejects %s", (handle) => {
    expect(handleError(handle)).not.toBeNull();
  });

  it("validates short link codes", () => {
    expect(shortCodeError("promo-10")).toBeNull();
    expect(shortCodeError("a")).not.toBeNull();
    expect(shortCodeError("promo/10")).not.toBeNull();
  });

  it("only allows http(s) URLs", () => {
    expect(safeHttpUrl("https://exemplo.com/a")).toBe("https://exemplo.com/a");
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("ftp://exemplo.com")).toBeNull();
  });
});

describe("links", () => {
  it("builds social hrefs per platform", () => {
    expect(socialHref({ platform: "email", url: "ana@exemplo.com" })).toBe("mailto:ana@exemplo.com");
    expect(socialHref({ platform: "whatsapp", url: "+55 (11) 99999-0000" })).toBe("https://wa.me/5511999990000");
    expect(socialHref({ platform: "instagram", url: "instagram.com/ana" })).toBe("https://instagram.com/ana");
    expect(socialHref({ platform: "website", url: "" })).toBeNull();
    expect(socialHref({ platform: "email", url: "not-an-email" })).toBeNull();
  });

  it("never lets a script URL through", () => {
    expect(linkHref("javascript:alert(1)")).toBeNull();
    expect(socialHref({ platform: "website", url: "javascript:alert(1)" })).toBeNull();
    expect(linkHref("tel:+5511999990000")).toBe("tel:+5511999990000");
  });
});

describe("whatsappHref", () => {
  it("adds Brazil's code to local numbers and encodes the message", () => {
    expect(whatsappHref("(11) 99999-0000", "Olá, tudo bem?")).toBe("https://wa.me/5511999990000?text=Ol%C3%A1%2C%20tudo%20bem%3F");
    expect(whatsappHref("+55 11 99999-0000", "")).toBe("https://wa.me/5511999990000");
    expect(whatsappHref("+1 415 555 0100", "")).toBe("https://wa.me/14155550100");
    expect(whatsappHref("123", "oi")).toBeNull();
  });
});

describe("vCard", () => {
  it("escapes separators and skips empty fields", () => {
    expect(vCard({ name: "Ana; Silva", company: "", phone: "+55 (11) 99999-0000", email: "" })).toBe(
      "BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Ana\\; Silva\r\nN:Ana\\; Silva;;;;\r\nTEL;TYPE=CELL:+5511999990000\r\nEND:VCARD\r\n",
    );
  });
});

describe("page document", () => {
  it("fills new fields with defaults on pages saved before them", () => {
    const doc = defaultPageDoc("Ana");
    const oldProfile: Partial<typeof doc.profile> = { ...doc.profile };
    delete oldProfile.verified;
    const oldTheme = {
      layout: "classic",
      font: "sans",
      background: "#ffffff",
      text: "#000000",
      buttonBackground: "#000000",
      buttonText: "#ffffff",
      buttonShape: "pill",
      buttonStyle: "fill",
    };
    const parsed = pageDocSchema.parse({
      ...doc,
      profile: oldProfile,
      theme: oldTheme,
      blocks: [{ id: "a", enabled: true, type: "link", title: "Site", url: "https://exemplo.com" }],
    });
    expect(parsed.profile.verified).toBe(false);
    expect(parsed.theme.backgroundType).toBe("solid");
    expect(parsed.theme.socialStyle).toBe("icons");
    expect(parsed.blocks[0]).toMatchObject({ imageUrl: "", highlight: false });
  });

  it("default page and every new block pass the schema", () => {
    const doc = defaultPageDoc("Ana");
    doc.blocks = (Object.keys(BLOCK_CATALOG) as BlockType[]).map(createBlock);
    expect(pageDocSchema.safeParse(doc).success).toBe(true);
  });

  it("every theme preset passes the schema", () => {
    for (const { theme } of THEME_PRESETS) {
      expect(pageDocSchema.safeParse({ ...defaultPageDoc("Ana"), theme }).success).toBe(true);
    }
  });

  it("rejects unknown block types and bad colors", () => {
    const doc = defaultPageDoc("Ana");
    expect(pageDocSchema.safeParse({ ...doc, blocks: [{ id: "x", enabled: true, type: "nope" }] }).success).toBe(false);
    expect(pageDocSchema.safeParse({ ...doc, theme: { ...doc.theme, text: "red" } }).success).toBe(false);
  });
});

describe("summarize", () => {
  const now = new Date("2026-10-16T12:00:00Z");
  const event = (kind: EventRow["kind"], created_at: string, extra: Partial<EventRow> = {}): EventRow => ({
    kind,
    block_id: null,
    short_link_id: null,
    target: null,
    visit_id: null,
    created_at,
    ...extra,
  });

  it("counts views, clicks and groups them", () => {
    const summary = summarize(
      [
        event("page_view", "2026-10-16T10:00:00Z", { visit_id: "v1" }),
        event("page_view", "2026-10-15T10:00:00Z", { visit_id: "v2" }),
        event("block_click", "2026-10-16T10:01:00Z", { block_id: "b1", visit_id: "v1" }),
        event("block_click", "2026-10-16T10:02:00Z", { block_id: "b1", visit_id: "v1" }),
        event("social_click", "2026-10-16T10:03:00Z", { target: "instagram", visit_id: "v1" }),
        event("short_link_click", "2026-10-14T10:00:00Z", { short_link_id: "s1" }),
      ],
      3,
      now,
    );
    expect(summary.views).toBe(2);
    expect(summary.clicks).toBe(3);
    // Three clicks, but only one of the two visits clicked.
    expect(summary.clickRate).toBe(0.5);
    expect(summary.byBlock.get("b1")).toBe(2);
    expect(summary.bySocial.get("instagram")).toBe(1);
    expect(summary.byShortLink.get("s1")).toBe(1);
    expect(summary.daily).toEqual([
      { day: "2026-10-14", views: 0, clicks: 0 },
      { day: "2026-10-15", views: 1, clicks: 0 },
      { day: "2026-10-16", views: 1, clicks: 3 },
    ]);
  });

  it("keeps the click rate within 100%", () => {
    const summary = summarize(
      [
        event("page_view", "2026-10-16T10:00:00Z", { visit_id: "v1" }),
        event("block_click", "2026-10-16T10:01:00Z", { block_id: "b1", visit_id: "v1" }),
        event("social_click", "2026-10-16T10:02:00Z", { target: "instagram", visit_id: "v1" }),
        // Clicks from a visit outside the window, or with no visit id, don't count.
        event("block_click", "2026-10-16T10:03:00Z", { block_id: "b1", visit_id: "old" }),
        event("block_click", "2026-10-16T10:04:00Z", { block_id: "b1" }),
      ],
      3,
      now,
    );
    expect(summary.clicks).toBe(4);
    expect(summary.clickRate).toBe(1);
  });

  it("handles no traffic", () => {
    const summary = summarize([], 7, now);
    expect(summary.clickRate).toBe(0);
    expect(summary.daily).toHaveLength(7);
  });
});

describe("toCsv", () => {
  it("quotes cells and neutralises formulas", () => {
    expect(toCsv(["a", "b"], [['say "hi"', "=SUM(A1)"]])).toBe('﻿"a","b"\r\n"say ""hi""","\'=SUM(A1)"\r\n');
  });
});
