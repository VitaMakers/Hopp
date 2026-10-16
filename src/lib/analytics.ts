export type EventRow = {
  kind: "page_view" | "block_click" | "social_click" | "short_link_click";
  block_id: string | null;
  short_link_id: string | null;
  target: string | null;
  created_at: string;
};

export type Summary = {
  views: number;
  clicks: number;
  clickRate: number;
  daily: { day: string; views: number; clicks: number }[];
  byBlock: Map<string, number>;
  bySocial: Map<string, number>;
  byShortLink: Map<string, number>;
};

// Groups raw events into the numbers the analytics screen shows. `days`
// fixes the window so every day appears, including days with no traffic.
export function summarize(events: EventRow[], days: number, now = new Date()): Summary {
  const daily = new Map<string, { views: number; clicks: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 86_400_000).toISOString().slice(0, 10);
    daily.set(day, { views: 0, clicks: 0 });
  }
  const byBlock = new Map<string, number>();
  const bySocial = new Map<string, number>();
  const byShortLink = new Map<string, number>();
  const bump = (map: Map<string, number>, key: string | null) => {
    if (key) map.set(key, (map.get(key) ?? 0) + 1);
  };

  let views = 0;
  let clicks = 0;
  for (const event of events) {
    const bucket = daily.get(event.created_at.slice(0, 10));
    if (event.kind === "page_view") {
      views++;
      if (bucket) bucket.views++;
      continue;
    }
    // Short links are opened outside the page, so they don't count toward
    // the page's clicks or click rate (which could otherwise exceed 100%).
    if (event.kind === "short_link_click") {
      bump(byShortLink, event.short_link_id);
      continue;
    }
    clicks++;
    if (bucket) bucket.clicks++;
    if (event.kind === "block_click") bump(byBlock, event.block_id);
    if (event.kind === "social_click") bump(bySocial, event.target);
  }

  return {
    views,
    clicks,
    clickRate: views ? clicks / views : 0,
    daily: [...daily].map(([day, counts]) => ({ day, ...counts })),
    byBlock,
    bySocial,
    byShortLink,
  };
}
