import { describe, expect, it } from "vitest";
import { localDay, summarize, type EventRow } from "./analytics";

const row = (kind: string, created_at: string, extra: Partial<EventRow> = {}): EventRow =>
  ({ kind, block_id: null, short_link_id: null, target: null, referrer: null, visit_id: null, created_at, ...extra }) as EventRow;

describe("summarize", () => {
  const now = new Date("2026-11-20T15:00:00Z");
  it("does not count time-on-page records as clicks", () => {
    const s = summarize(
      [row("page_view", "2026-11-20T12:00:00Z"), row("session", "2026-11-20T12:01:00Z"), row("block_click", "2026-11-20T12:00:30Z", { block_id: "b1" })],
      7,
      now,
    );
    expect(s.views).toBe(1);
    expect(s.clicks).toBe(1);
  });
  it("puts an evening visit on its own day in Brasília time", () => {
    // 22:30 in São Paulo on the 19th is already the 20th in UTC.
    const s = summarize([row("page_view", "2026-11-20T01:30:00Z")], 7, now);
    expect(localDay("2026-11-20T01:30:00Z")).toBe("2026-11-19");
    expect(s.daily.find((d) => d.day === "2026-11-19")?.views).toBe(1);
    expect(s.daily.find((d) => d.day === "2026-11-20")?.views).toBe(0);
    expect(s.daily).toHaveLength(7);
  });
});
