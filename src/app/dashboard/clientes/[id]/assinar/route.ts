import { NextResponse } from "next/server";
import { env, stripePriceId } from "@/lib/env";
import { createCustomer, createClientSubscriptionCheckout } from "@/lib/payments/billing";
import { createAdminClient } from "@/lib/supabase/server";
import { normalizePlan } from "@/lib/plans";
import { getOwner } from "../../../context";

// Sends the agency to Stripe Checkout to subscribe one client to a tier.
// ?plan=essencial|profissional
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, clients } = await getOwner();
  const { id } = await params;
  const base = env.siteUrl();

  // Only a client this account manages, and only a real paid tier.
  const client = clients.find((c) => c.id === id);
  if (!client) return NextResponse.redirect(`${base}/dashboard/clientes`);
  const planParam = new URL(req.url).searchParams.get("plan");
  const plan = normalizePlan(planParam);
  if (plan === "free") return NextResponse.redirect(`${base}/dashboard/clientes`);

  try {
    // One Stripe customer per account (created on first paid client).
    const admin = createAdminClient();
    const { data: billing } = await admin
      .from("account_billing")
      .select("stripe_customer_id")
      .eq("account_id", user.id)
      .maybeSingle();
    let customerId = billing?.stripe_customer_id ?? null;
    if (!customerId) {
      customerId = await createCustomer({ accountId: user.id, email: user.email ?? "" });
      await admin.from("account_billing").upsert({ account_id: user.id, stripe_customer_id: customerId });
    }

    const url = await createClientSubscriptionCheckout({
      customerId,
      priceId: stripePriceId(plan),
      accountId: user.id,
      clientId: client.id,
      plan,
      successUrl: `${base}/dashboard/clientes?assinado=1`,
      cancelUrl: `${base}/dashboard/clientes?cancelado=1`,
    });
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("client subscription checkout failed", error);
    return NextResponse.redirect(`${base}/dashboard/clientes?erro=cobranca`);
  }
}
