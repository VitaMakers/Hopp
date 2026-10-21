"use client";

import type { PageDoc } from "@/lib/page/schema";
import { PageView } from "./PageView";

// A small, non-interactive preview of a model's page, shown in the gallery.
// The page is rendered at phone width (390px) and scaled down to fill a fixed
// frame, so the thumbnail looks like the real page in a phone.
const PHONE = 390;

export function ModelThumb({ doc, width = 176, height = 320 }: { doc: PageDoc; width?: number; height?: number }) {
  const hasVideo = !!doc.profile.coverVideo.trim();
  return (
    <div
      className="pointer-events-none relative overflow-hidden rounded-[18px] bg-black ring-1 ring-black/10"
      style={{ width, height }}
      aria-hidden="true"
    >
      <div style={{ width: PHONE, transformOrigin: "top left", transform: `scale(${width / PHONE})` }}>
        <PageView doc={doc} still />
      </div>
      {hasVideo ? (
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
          <span aria-hidden="true">▶</span> Vídeo
        </span>
      ) : null}
    </div>
  );
}
