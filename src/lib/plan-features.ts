import { PLAN_LABEL, PLAN_PRICE_BRL, type Plan } from "@/lib/plans";

// One source of truth for how the plans are presented (pricing page, onboarding
// lock notes). The booleans mirror src/lib/entitlements.ts, so what is sold is
// exactly what is enforced.
export type PlanFeature = {
  label: string;
  // Which plans include it. A string value shows that text instead of a check.
  free: boolean | string;
  essencial: boolean | string;
  profissional: boolean | string;
  // Shorter name used on the plan cards when the value is partial (e.g. "Métricas: só visitas").
  short?: string;
};

export const PLAN_FEATURES: PlanFeature[] = [
  { label: "Página no seu endereço (vmbio.pro/voce)", free: true, essencial: true, profissional: true },
  { label: "Blocos de links, produtos e captação de contatos", free: true, essencial: true, profissional: true },
  { label: "Modelos essenciais prontos", free: true, essencial: true, profissional: true },
  { label: "Modelos premium exclusivos", free: false, essencial: true, profissional: true },
  { label: "Métricas completas (cliques, origem, tempo na página)", short: "Métricas", free: "Só visitas", essencial: true, profissional: true },
  { label: "Vídeo de capa e grade de vídeos", free: false, essencial: true, profissional: true },
  { label: "Links curtos próprios", free: false, essencial: "Ilimitados", profissional: "Ilimitados" },
  { label: "Formulários próprios, com as respostas no painel", free: false, essencial: false, profissional: true },
  { label: "Selo verificado azul", free: false, essencial: false, profissional: true },
  { label: "Sem a marca Virtú.bio no rodapé", free: false, essencial: false, profissional: true },
];

// Short pitch shown under each plan's price.
export const PLAN_PITCH: Record<Plan, string> = {
  free: "Para começar e colocar sua página no ar hoje.",
  essencial: "Modelos premium, vídeo e métricas completas.",
  profissional: "Tudo do Essencial, mais formulários, selo verificado e sua página sem a marca Virtú.bio.",
};

export const PLAN_ORDER: Plan[] = ["free", "essencial", "profissional"];

export { PLAN_LABEL, PLAN_PRICE_BRL };
