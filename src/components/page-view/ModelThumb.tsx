"use client";

import type { PageDoc } from "@/lib/page/schema";
import { PageView } from "./PageView";

// A small, non-interactive preview of a model's page, shown in the gallery.
// The page is rendered at phone width (390px) and scaled down to fill a fixed
// frame, so the thumbnail looks like the real page in a phone.
const PHONE = 390;

export function ModelThumb({ doc, width = 176, height = 320 }: { doc: PageDoc; width?: number; height?: number }) {
  return (
    <div
      className="pointer-events-none relative overflow-hidden rounded-[18px] bg-black ring-1 ring-black/10"
      style={{ width, height }}
      aria-hidden="true"
    >
      <div style={{ width: PHONE, transformOrigin: "top left", transform: `scale(${width / PHONE})` }}>
        <PageView doc={doc} still />
      </div>
    </div>
  );
}
