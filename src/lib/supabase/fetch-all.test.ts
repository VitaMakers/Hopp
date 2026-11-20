import { describe, expect, it } from "vitest";
import { fetchAll } from "./fetch-all";

const source = (total: number) => {
  const calls: [number, number][] = [];
  const page = async (from: number, to: number) => {
    calls.push([from, to]);
    const rows = [];
    for (let i = from; i <= to && i < total; i++) rows.push(i);
    return { data: rows, error: null };
  };
  return { page, calls };
};

describe("fetchAll", () => {
  it("reads past the 1000-row page", async () => {
    const { page } = source(2500);
    const { data } = await fetchAll<number>(page, 50_000);
    expect(data).toHaveLength(2500);
    expect(new Set(data).size).toBe(2500);
    expect(data[2499]).toBe(2499);
  });
  it("stops at the cap", async () => {
    const { page } = source(9000);
    const { data } = await fetchAll<number>(page, 5000);
    expect(data).toHaveLength(5000);
  });
  it("handles an exact multiple and an empty table", async () => {
    expect((await fetchAll<number>(source(4000).page, 50_000)).data).toHaveLength(4000);
    expect((await fetchAll<number>(source(0).page, 50_000)).data).toHaveLength(0);
  });
  it("reports an error only when nothing was read", async () => {
    const res = await fetchAll<number>(async () => ({ data: null, error: new Error("x") }), 5000);
    expect(res.error).toBeTruthy();
    expect(res.data).toHaveLength(0);
  });
});
