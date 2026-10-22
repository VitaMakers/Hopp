import "server-only";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";

// Who can see the platform admin area. Set ADMIN_EMAILS (comma-separated) to
// change it; defaults to the Vita Makers owner.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "contato@vitamakers.com.br")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function isAdmin(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

// Monthly price of the paid plan, used only to estimate platform revenue
// (there is no subscription billing yet). Change PRO_PRICE_BRL to match.
export const PRO_PRICE_BRL = Number(process.env.PRO_PRICE_BRL ?? "29.90") || 29.9;

// Sends non-admins back to their own dashboard. Call before reading any
// platform-wide (service-role) data.
export async function requireAdmin() {
  const { user } = await requireUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.email)) redirect("/dashboard");
  return { user };
}
