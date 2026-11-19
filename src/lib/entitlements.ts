import type { PageDoc } from "@/lib/page/schema";
import { normalizePlan } from "@/lib/plans";

// What each plan is allowed to do. One place, used by the editor (to show
// locks) and by the publish action (to enforce). No "server-only": the editor
// imports it too.

// One paid plan is sold today: Essencial (R$ 9,90) with everything unlocked.
// Profissional is no longer offered, but existing Profissional subscribers keep
// every feature. So "paid" (any plan but Grátis) is what unlocks features.
export function isPaid(plan: string | null | undefined): boolean {
  return normalizePlan(plan) !== "free";
}

// How many short links each plan may keep: unlimited on the paid plan, none on
// Grátis. Callers show "ilimitado" when the limit is not finite.
export function shortLinkLimit(plan: string | null | undefined): number {
  return isPaid(plan) ? Infinity : 0;
}

// The Virtú.bio signature in the footer shows only on Grátis.
export function showsBadge(plan: string | null | undefined): boolean {
  return !isPaid(plan);
}

// Premium designs (Autoridade, Presença, etc.) are on the paid plan.
export function canUsePremium(plan: string | null | undefined): boolean {
  return isPaid(plan);
}

// Cover video and the video grid block are on the paid plan.
export function canUseVideo(plan: string | null | undefined): boolean {
  return isPaid(plan);
}

// Grátis sees only the visit count; the paid plan gets the full dashboard.
export function hasFullAnalytics(plan: string | null | undefined): boolean {
  return isPaid(plan);
}

// The blue verified badge is on the paid plan.
export function canUseVerified(plan: string | null | undefined): boolean {
  return isPaid(plan);
}

// Plan ranking, so "has at least this plan" checks are simple comparisons.
// Essencial and Profissional unlock the same things.
const PLAN_RANK: Record<string, number> = { free: 0, essencial: 1, profissional: 1 };

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
  return out;
}
