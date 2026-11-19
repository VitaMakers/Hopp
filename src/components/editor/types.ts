import type { Block, PageDoc } from "@/lib/page/schema";

// Editor updates may be a whole new doc or a function of the latest one. Async
// work (an image upload) must use the function form, so what was typed while it
// ran isn't overwritten by the snapshot taken when it started.
export type DocChange = (next: PageDoc | ((current: PageDoc) => PageDoc)) => void;
export type BlockChange = (next: Block | ((current: Block) => Block)) => void;

// A partial update, or one computed from the latest value.
export type Patch<T> = Partial<T> | ((current: T) => Partial<T>);
export function applyPatch<T extends object>(current: T, patch: Patch<T>): T {
  return { ...current, ...(typeof patch === "function" ? patch(current) : patch) };
}
