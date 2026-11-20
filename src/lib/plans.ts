// The three subscription tiers. Prices are in BRL and configurable by env, so
// they can change without a deploy. There is no billing yet, so they are used
// only to label plans and to estimate platform revenue in the admin panel.
export const PLANS = ["free", "essencial", "profissional"] as const;
export type Plan = (typeof PLANS)[number];

export const PLAN_LABEL: Record<Plan, string> = {
  free: "Grátis",
  essencial: "Essencial",
  profissional: "Profissional",
};

const price = (name: string, fallback: number) => Number(process.env[name] ?? fallback) || fallback;

export const PLAN_PRICE_BRL: Record<Plan, number> = {
  free: 0,
  essencial: price("ESSENCIAL_PRICE_BRL", 9.9),
  profissional: price("PROFISSIONAL_PRICE_BRL", 19.9),
};

// Accepts the legacy "pro" value and anything unknown, always returning a tier.
export function normalizePlan(value: string | null | undefined): Plan {
  if (value === "pro") return "profissional";
  return (PLANS as readonly string[]).includes(value ?? "") ? (value as Plan) : "free";
}

// Plans sold today, in display order.
export const PLANS_FOR_SALE = ["free", "essencial", "profissional"] as const;

// The price a new paid client adds to the monthly bill.
export function nextClientPriceBRL(): number {
  return PLAN_PRICE_BRL.essencial;
}

// Estimated monthly total for an account: every paid client bills at its plan's
// price; clients on Grátis cost nothing.
export function accountMonthlyBRL(plans: Array<string | null | undefined>): number {
  return plans.reduce<number>((sum, p) => sum + PLAN_PRICE_BRL[normalizePlan(p)], 0);
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
