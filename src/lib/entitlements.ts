import type { PageDoc } from "@/lib/page/schema";
import { normalizePlan } from "@/lib/plans";

// What each plan is allowed to do. One place, used by the editor (to show
// locks) and by the publish action (to enforce). No "server-only": the editor
// imports it too.

// How many short links each plan may keep.
export function shortLinkLimit(plan: string | null | undefined): number {
  const p = normalizePlan(plan);
  return p === "profissional" ? 7 : p === "essencial" ? 3 : 0;
}

// The brand signature in the footer shows on every plan except Profissional.
export function showsBadge(plan: string | null | undefined): boolean {
  return normalizePlan(plan) !== "profissional";
}

// Premium designs (Autoridade, Presença, etc.) are Profissional only.
export function canUsePremium(plan: string | null | undefined): boolean {
  return normalizePlan(plan) === "profissional";
}

// Cover video and the video grid block are available on paid plans.
export function canUseVideo(plan: string | null | undefined): boolean {
  return normalizePlan(plan) !== "free";
}

// Free sees only the visit count; paid plans get the full dashboard.
export function hasFullAnalytics(plan: string | null | undefined): boolean {
  return normalizePlan(plan) !== "free";
}

// The blue verified badge is a Profissional-only perk.
export function canUseVerified(plan: string | null | undefined): boolean {
  return normalizePlan(plan) === "profissional";
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
    out.push("modelo Premium (disponível no Profissional)");
  }
  if (!canUseVideo(plan)) {
    const usesVideo = !!doc.profile.coverVideo || doc.blocks.some((b) => b.type === "videos");
    if (usesVideo) out.push("vídeo — capa ou grade de vídeos (disponível no Essencial ou Profissional)");
  }
  return out;
}
