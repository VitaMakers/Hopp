import type { PageDoc } from "./schema";

// Older pages stored one cover video in profile.coverVideo, which played over
// any cover image the owner later uploaded. Move it into the "Vídeo" cover type
// so the editor's Imagem / Carrossel / Vídeo chooser controls it.
export function normalizeLegacyCover(doc: PageDoc): PageDoc {
  const p = doc.profile;
  if (!p.coverVideo) return doc;
  return {
    ...doc,
    profile: {
      ...p,
      coverType: "video",
      coverVideos: p.coverVideos.some(Boolean) ? p.coverVideos : [p.coverVideo],
      coverVideo: "",
    },
  };
}

// Sample numbers used by older templates, e.g. "(11) 99999-0000".
const SAMPLE_WHATSAPP = /\(?11\)?\s?9(\d)\1{3}-?0{4}/;

// A social link that points only at the network's home page (template sample).
function isSampleSocial(url: string): boolean {
  return /^https?:\/\/(www\.)?[a-z0-9-]+\.[a-z.]+\/?$/i.test(url.trim());
}

// Applying a model changes the blocks and the look, never who the page is:
// the owner's name, bio, photo, logo, cover, socials, WhatsApp and SEO stay.
// Template samples (generic social links, fake numbers) never replace or
// survive as real data.
export function applyTemplateKeepingProfile(current: PageDoc, next: PageDoc): PageDoc {
  const cur = current.profile;
  const name = cur.name.trim() && cur.name !== "Adicione seu nome" ? cur.name : next.profile.name;
  const hasOwnCover = !!cur.coverUrl || cur.coverImages.some((i) => i.url) || cur.coverVideos.some(Boolean) || !!cur.coverVideo;
  const whatsapp = cur.floatingWhatsapp && !SAMPLE_WHATSAPP.test(cur.floatingWhatsapp) ? cur.floatingWhatsapp : "";
  const ownSocials = current.socials.filter((s) => s.url && !isSampleSocial(s.url));

  const merged: PageDoc = {
    ...next,
    profile: {
      ...next.profile,
      name,
      bio: cur.bio.trim() ? cur.bio : next.profile.bio,
      avatarUrl: cur.avatarUrl || next.profile.avatarUrl,
      logo: cur.logo || next.profile.logo,
      verified: cur.verified,
      floatingWhatsapp: whatsapp,
      ...(hasOwnCover
        ? {
            coverUrl: cur.coverUrl,
            coverVideo: "",
            coverType: cur.coverVideo ? "video" : cur.coverType,
            coverImages: cur.coverImages,
            coverVideos: cur.coverVideos.some(Boolean) ? cur.coverVideos : cur.coverVideo ? [cur.coverVideo] : [],
            coverSeconds: cur.coverSeconds,
            coverPosX: cur.coverPosX,
            coverPosY: cur.coverPosY,
          }
        : {}),
    },
    // The owner's own links win; otherwise keep the model's networks with an
    // empty address so the owner fills them in (nothing fake goes live).
    socials: ownSocials.length ? ownSocials : next.socials.map((s) => ({ ...s, url: isSampleSocial(s.url) ? "" : s.url })),
    seo: current.seo,
    integrations: current.integrations,
    hideBrand: current.hideBrand,
  };
  return normalizeLegacyCover(merged);
}
