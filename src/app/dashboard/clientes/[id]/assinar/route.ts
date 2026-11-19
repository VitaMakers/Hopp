import { NextResponse } from "next/server";
import { stripePriceId } from "@/lib/env";
import { siteOrigin } from "@/lib/request";
import { createCustomer, createClientSubscriptionCheckout, subscriptionIsLive } from "@/lib/payments/billing";
import { createAdminClient } from "@/lib/supabase/server";
import { getOwner } from "../../../context";

// Sends the agency to Stripe Checkout to subscribe one client to the paid plan.
// Only "essencial" is sold (Profissional is no longer offered; existing
// Profissional subscriptions keep working). A client that already has a live
// subscription is never sent to a second checkout, so nobody is billed twice.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, clients } = await getOwner();
  const { id } = await params;
  const base = await siteOrigin();

  // Only a client this account manages, and only a real paid tier.
  const client = clients.find((c) => c.id === id);
  if (!client) return NextResponse.redirect(`${base}/dashboard/clientes`);
  const plan = "essencial" as const;

  try {
    const admin = createAdminClient();
    const { data: current } = await admin.from("profiles").select("stripe_subscription_id").eq("id", client.id).maybeSingle();
    if (current?.stripe_subscription_id && (await subscriptionIsLive(current.stripe_subscription_id))) {
      return NextResponse.redirect(`${base}/dashboard/clientes?ja-assinado=1`);
    }

    // One Stripe customer per account (created on first paid client).
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
