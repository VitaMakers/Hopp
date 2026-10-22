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

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "virtu.bio";

// The brand signature line, shown on the landing and login pages.
export const APP_TAGLINE = process.env.NEXT_PUBLIC_APP_TAGLINE ?? "Uma página. Todas as suas possibilidades.";

export function serviceRoleKey(): string {
  return required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function stripeSecretKey(): string {
  return required("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY);
}
