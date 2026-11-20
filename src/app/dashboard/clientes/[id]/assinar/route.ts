import { NextResponse } from "next/server";
import { stripePriceId } from "@/lib/env";
import { siteOrigin } from "@/lib/request";
import { createCustomer, createClientSubscriptionCheckout, subscriptionBelongsTo, subscriptionIsLive } from "@/lib/payments/billing";
import { normalizePlan } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/server";
import { getOwner } from "../../../context";

// Subscribes one client to a paid plan (?plan=essencial|profissional).
// A client that already has a live subscription is never sent to a second
// checkout: switching plans changes the existing subscription's price, so
// nobody is billed twice.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, clients } = await getOwner();
  const { id } = await params;
  const base = await siteOrigin();

  // Only a client this account manages, and only a real paid tier.
  const client = clients.find((c) => c.id === id);
  if (!client) return NextResponse.redirect(`${base}/dashboard/clientes`);
  const asked = normalizePlan(new URL(req.url).searchParams.get("plan"));
  const plan: "essencial" | "profissional" = asked === "profissional" ? "profissional" : "essencial";

  try {
    const admin = createAdminClient();
    const { data: current } = await admin.from("profiles").select("plan, stripe_subscription_id").eq("id", client.id).maybeSingle();
    // A live subscription opened by this account is never duplicated. Opening
    // this address can't change it either: the switch is a confirmed action on
    // the plans page (a link alone must never touch billing). A subscription
    // left by a previous account (the client was transferred) is not this
    // account's to change, so the new owner gets a checkout of their own.
    if (
      current?.stripe_subscription_id &&
      (await subscriptionIsLive(current.stripe_subscription_id)) &&
      (await subscriptionBelongsTo(current.stripe_subscription_id, user.id))
    ) {
      if (normalizePlan(current.plan) === plan) return NextResponse.redirect(`${base}/dashboard/clientes?ja-assinado=1`);
      return NextResponse.redirect(`${base}/dashboard/plans?trocar=${plan}`);
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
