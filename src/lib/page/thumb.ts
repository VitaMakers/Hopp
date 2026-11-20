import type { PageDoc } from "./schema";

// A copy of a page whose stock photos are requested at thumbnail size. Models
// ship with large photos (they are meant to fill a phone screen); a miniature
// drawn at a third of that size would download several megabytes for nothing.
export function lightImages(doc: PageDoc, width = 480): PageDoc {
  const text = JSON.stringify(doc).replace(/https:\/\/images\.unsplash\.com\/[^"\\]+/g, (url) =>
    url.replace(/([?&])w=(\d+)/, (_, sep: string, w: string) => `${sep}w=${Math.min(Number(w), width)}`).replace(/([?&])q=\d+/, "$1q=60"),
  );
  return JSON.parse(text) as PageDoc;
}
