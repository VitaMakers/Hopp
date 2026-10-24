"use client";

import { useTransition } from "react";
import { PLANS, PLAN_LABEL, normalizePlan } from "@/lib/plans";
import { setClientPlan } from "./actions";

// Admin-only dropdown to set a client's plan. Changes apply on select.
export function PlanSelect({ profileId, plan }: { profileId: string; plan: string }) {
  const [pending, start] = useTransition();
  const current = normalizePlan(plan);
  const color =
    current === "profissional" ? "text-amber-800" : current === "essencial" ? "text-sky-800" : "text-stone-600";
  return (
    <select
      defaultValue={current}
      disabled={pending}
      onChange={(e) => start(() => setClientPlan(profileId, e.target.value))}
      className={`rounded-md border border-stone-300 px-2 py-1 text-xs font-medium ${color} disabled:opacity-50`}
      aria-label="Plano do cliente"
    >
      {PLANS.map((p) => (
        <option key={p} value={p}>
          {PLAN_LABEL[p]}
        </option>
      ))}
    </select>
  );
}
