// The database API hands back at most 1000 rows per request, whatever
// `.limit()` asks for. This reads a query page by page (a few pages at a
// time) until it runs out of rows or reaches `cap`, so counts built from the
// rows don't silently stop at 1000.
const PAGE = 1000;
const WAVE = 4;

type PageResult = { data: unknown; error: unknown };

export async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<PageResult>,
  cap: number,
): Promise<{ data: T[]; error: unknown }> {
  const rows: T[] = [];
  for (let from = 0; from < cap; from += PAGE * WAVE) {
    const starts: number[] = [];
    for (let i = 0; i < WAVE && from + i * PAGE < cap; i++) starts.push(from + i * PAGE);
    const results = await Promise.all(starts.map((start) => page(start, Math.min(start + PAGE, cap) - 1)));
    let done = false;
    for (const result of results) {
      if (result.error) return { data: rows, error: rows.length ? null : result.error };
      const batch = (result.data ?? []) as T[];
      rows.push(...batch);
      if (batch.length < PAGE) {
        done = true;
        break;
      }
    }
    if (done) break;
  }
  return { data: rows, error: null };
}
