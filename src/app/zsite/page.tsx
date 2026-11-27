"use client";
import { PageView } from "@/components/page-view/PageView";
import { page } from "@/lib/page/templates";
import { pageDocSchema } from "@/lib/page/schema";
import { SITE_TEMPLATES } from "@/lib/page/site";

export default function Z() {
  return (
    <div style={{ display: "flex", gap: 20, padding: 20, background: "#888", alignItems: "flex-start" }}>
      {SITE_TEMPLATES.map((t) => {
        const doc = pageDocSchema.parse(page(t.name, { profile: { bio: t.bio }, socials: t.socials ?? [], theme: { premium: t.design as never, ...t.theme, font: "sans" }, premium: t.premium, blocks: t.blocks() }));
        return (
          <div key={t.id} id={`m-${t.design}`} style={{ width: 390, flex: "none", borderRadius: 28, overflow: "hidden" }}>
            <PageView doc={doc} />
          </div>
        );
      })}
    </div>
  );
}
