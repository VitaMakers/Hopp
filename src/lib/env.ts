// Read lazily so `next build` works without secrets; a missing value fails
// the request that needs it, with a message that names the variable.
function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Variável de ambiente ausente: ${name}`);
  return value;
}

export const env = {
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: () =>
    required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  siteUrl: () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Virtú.bio";

// The brand signature line, shown on the landing and login pages.
export const APP_TAGLINE = process.env.NEXT_PUBLIC_APP_TAGLINE ?? "Uma página. Todas as suas possibilidades.";

export function serviceRoleKey(): string {
  return required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function stripeSecretKey(): string {
  return required("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY);
}

// Verifies Stripe webhook signatures. From Dashboard → Developers → Webhooks.
export function stripeWebhookSecret(): string {
  return required("STRIPE_WEBHOOK_SECRET", process.env.STRIPE_WEBHOOK_SECRET);
}

// The recurring price for each paid client tier. Set them to the Stripe price
// ids (price_...) so changing a price never needs a deploy.
export function stripePriceId(plan: "essencial" | "profissional"): string {
  const name = plan === "profissional" ? "STRIPE_PRICE_PROFISSIONAL" : "STRIPE_PRICE_ESSENCIAL";
  return required(name, process.env[name]);
}
