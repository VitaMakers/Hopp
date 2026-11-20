import type { PageDoc } from "@/lib/page/schema";
import { normalizePlan } from "@/lib/plans";

// What each plan is allowed to do. One place, used by the editor (to show
// locks) and by the publish action (to enforce). No "server-only": the editor
// imports it too.

// Two paid plans:
// - Essencial (R$ 9,90): premium models, video, full statistics, unlimited
//   short links.
// - Profissional (R$ 19,90): everything in Essencial plus custom forms, the
//   verified badge and a page without the Virtú.bio mark.
export function isPaid(plan: string | null | undefined): boolean {
  return normalizePlan(plan) !== "free";
}

export function isProfissional(plan: string | null | undefined): boolean {
  return normalizePlan(plan) === "profissional";
}

// Short links: unlimited on any paid plan, none on Grátis. Callers show
// "ilimitado" when the limit is not finite.
export function shortLinkLimit(plan: string | null | undefined): number {
  return isPaid(plan) ? Infinity : 0;
}

// The Virtú.bio signature in the footer: removed only on Profissional.
export function showsBadge(plan: string | null | undefined): boolean {
  return !isProfissional(plan);
}

// Premium designs (Autoridade, Presença, restaurants, etc.): any paid plan.
export function canUsePremium(plan: string | null | undefined): boolean {
  return isPaid(plan);
}

// Cover video and the video grid block: any paid plan.
export function canUseVideo(plan: string | null | undefined): boolean {
  return isPaid(plan);
}

// Grátis sees only the visit count; paid plans get the full dashboard.
export function hasFullAnalytics(plan: string | null | undefined): boolean {
  return isPaid(plan);
}

// The blue verified badge: Profissional.
// The owner's own pixels and analytics accounts on the page: Profissional.
export function canUseIntegrations(plan: string | null | undefined): boolean {
  return isProfissional(plan);
}

// A domain of the client's own in front of the page: Profissional.
export function canUseCustomDomain(plan: string | null | undefined): boolean {
  return isProfissional(plan);
}

export function canUseVerified(plan: string | null | undefined): boolean {
  return isProfissional(plan);
}

// Custom forms (Formulários area and the form block): Profissional.
export function canUseForms(plan: string | null | undefined): boolean {
  return isProfissional(plan);
}

// Plan ranking, so "has at least this plan" checks are simple comparisons.
const PLAN_RANK: Record<string, number> = { free: 0, essencial: 1, profissional: 2 };

// True when the user's plan is at least the required tier.
export function planAllows(userPlan: string | null | undefined, requiredPlan: string | null | undefined): boolean {
  return PLAN_RANK[normalizePlan(userPlan)] >= PLAN_RANK[normalizePlan(requiredPlan)];
}

// Which paid-only features a page uses beyond its plan, as human labels.
// Empty means the page is fine to publish on that plan.
export function planViolations(doc: PageDoc, plan: string | null | undefined): string[] {
  const out: string[] = [];
  if (!canUsePremium(plan) && doc.theme.premium) {
    out.push("modelo Premium (disponível no plano Essencial)");
  }
  if (!canUseVideo(plan)) {
    // Only videos that actually show count: a list left behind after switching
    // the cover to an image doesn't block publishing.
    const usesVideo =
      !!doc.profile.coverVideo ||
      (doc.profile.coverType === "video" && doc.profile.coverVideos.some(Boolean)) ||
      doc.blocks.some((b) => b.type === "videos");
    if (usesVideo) out.push("vídeo de capa ou grade de vídeos (disponível no plano Essencial)");
  }
  if (!canUseForms(plan) && doc.blocks.some((b) => b.type === "form" && b.enabled)) {
    out.push("bloco de formulário (disponível no plano Profissional)");
  }
  return out;
}

// The published page as the plan allows it to be shown. Publishing already
// refuses what the plan doesn't cover, but a page can outlive its plan (a
// cancelled subscription) or be written around the dashboard, so the public
// page applies the same rules when it is read: a premium design falls back to
// the simple layout, videos give way to the cover image, and form blocks are
// left out.
export function enforcePlan(doc: PageDoc, plan: string | null | undefined): PageDoc {
  const hasIntegrations = Object.values(doc.integrations ?? {}).some(Boolean);
  if (planViolations(doc, plan).length === 0 && (canUseIntegrations(plan) || !hasIntegrations)) return doc;
  let next = doc;
  // Integrations never block publishing; they just don't load without the plan.
  if (!canUseIntegrations(plan) && hasIntegrations) {
    next = { ...next, integrations: { metaPixel: "", tiktokPixel: "", googleAnalytics: "", clarity: "" } };
  }
  if (!canUsePremium(plan) && next.theme.premium) {
    next = { ...next, theme: { ...next.theme, premium: "" } };
  }
  if (!canUseVideo(plan)) {
    next = {
      ...next,
      profile: {
        ...next.profile,
        coverVideo: "",
        coverVideos: [],
        coverType: next.profile.coverType === "video" ? "image" : next.profile.coverType,
      },
      blocks: next.blocks.filter((b) => b.type !== "videos"),
    };
  }
  if (!canUseForms(plan)) {
    next = { ...next, blocks: next.blocks.filter((b) => b.type !== "form") };
  }
  return next;
}
