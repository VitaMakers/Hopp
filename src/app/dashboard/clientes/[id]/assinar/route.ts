import { NextResponse } from "next/server";
import { stripePriceId } from "@/lib/env";
import { siteOrigin } from "@/lib/request";
import { changeSubscriptionPlan, createCustomer, createClientSubscriptionCheckout, subscriptionIsLive } from "@/lib/payments/billing";
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
    if (current?.stripe_subscription_id && (await subscriptionIsLive(current.stripe_subscription_id))) {
      if (normalizePlan(current.plan) === plan) return NextResponse.redirect(`${base}/dashboard/clientes?ja-assinado=1`);
      // Changing a paid subscription needs an explicit confirmation step, so a
      // link prefetch or an accidental click can never switch the plan.
      if (new URL(req.url).searchParams.get("confirmar") !== "1") {
        return NextResponse.redirect(`${base}/dashboard/plans?trocar=${plan}`);
      }
      await changeSubscriptionPlan(current.stripe_subscription_id, stripePriceId(plan), plan);
      await admin.from("profiles").update({ plan }).eq("id", client.id);
      return NextResponse.redirect(`${base}/dashboard/plans?plano=${plan}`);
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
