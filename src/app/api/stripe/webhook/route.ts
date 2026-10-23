import type Stripe from "stripe";
import { constructWebhookEvent } from "@/lib/payments/billing";
import { normalizePlan } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/server";

// Stripe calls this when a subscription is paid, changed or cancelled. The
// signature is verified against STRIPE_WEBHOOK_SECRET, and the client's plan is
// written as the server (service role), the only role allowed to change a plan.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature") ?? "";
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch (error) {
    console.error("stripe webhook signature failed", error);
    return new Response("invalid signature", { status: 400 });
  }

  const admin = createAdminClient();

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const clientId = session.metadata?.client_id;
      const plan = normalizePlan(session.metadata?.plan);
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
      if (clientId && plan !== "free") {
        await admin.from("profiles").update({ plan, stripe_subscription_id: subscriptionId }).eq("id", clientId);
      }
    } else if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const clientId = sub.metadata?.client_id;
      if (clientId) {
        // Subscription ended: the client drops back to the free tier.
        await admin.from("profiles").update({ plan: "free", stripe_subscription_id: null }).eq("id", clientId);
      }
    } else if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription;
      const clientId = sub.metadata?.client_id;
      const plan = normalizePlan(sub.metadata?.plan);
      if (clientId) {
        const active = sub.status === "active" || sub.status === "trialing";
        await admin
          .from("profiles")
          .update({ plan: active ? plan : "free", stripe_subscription_id: active ? sub.id : null })
          .eq("id", clientId);
      }
    }
  } catch (error) {
    console.error("stripe webhook handling failed", error);
    return new Response("handler error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
