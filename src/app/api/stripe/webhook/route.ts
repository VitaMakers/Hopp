import { revalidatePath } from "next/cache";
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

  // Refresh a client's public page right away when its plan changes (badge,
  // footer brand, premium design).
  const refresh = (rows: { handle: string | null }[] | null) => {
    for (const row of rows ?? []) if (row.handle) revalidatePath(`/${row.handle}`);
  };

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const clientId = session.metadata?.client_id;
      const plan = normalizePlan(session.metadata?.plan);
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
      if (clientId && plan !== "free" && subscriptionId) {
        const { data } = await admin
          .from("profiles")
          .update({ plan, stripe_subscription_id: subscriptionId })
          .eq("id", clientId)
          .select("handle");
        refresh(data);
      }
    } else if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const clientId = sub.metadata?.client_id;
      if (clientId) {
        // Only the client's current subscription can drop it to Grátis; an old
        // or duplicate subscription ending must not downgrade a paying client.
        const { data } = await admin
          .from("profiles")
          .update({ plan: "free", stripe_subscription_id: null })
          .eq("id", clientId)
          .eq("stripe_subscription_id", sub.id)
          .select("handle");
        refresh(data);
      }
    } else if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription;
      const clientId = sub.metadata?.client_id;
      const plan = normalizePlan(sub.metadata?.plan);
      if (clientId && plan !== "free") {
        // past_due = Stripe is still retrying the card: keep the plan (grace
        // period). Only a subscription that has really stopped downgrades.
        const ended = ["unpaid", "canceled", "incomplete_expired"].includes(sub.status);
        const live = ["active", "trialing", "past_due"].includes(sub.status);
        if (ended) {
          const { data } = await admin
            .from("profiles")
            .update({ plan: "free", stripe_subscription_id: null })
            .eq("id", clientId)
            .eq("stripe_subscription_id", sub.id)
            .select("handle");
          refresh(data);
        } else if (live) {
          const { data } = await admin
            .from("profiles")
            .update({ plan })
            .eq("id", clientId)
            .eq("stripe_subscription_id", sub.id)
            .select("handle");
          refresh(data);
        }
      }
    }
  } catch (error) {
    console.error("stripe webhook handling failed", error);
    return new Response("handler error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
