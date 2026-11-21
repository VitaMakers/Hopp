import "server-only";
import Stripe from "stripe";
import { stripeSecretKey, stripeWebhookSecret } from "@/lib/env";

// Platform subscriptions: the agency pays a recurring price per paid client.
// Separate from Connect (src/lib/payments/stripe.ts), which pays creators.
function client() {
  return new Stripe(stripeSecretKey());
}

// One Stripe customer per account, so every paid client shares one card/invoice.
export async function createCustomer(input: { accountId: string; email: string }): Promise<string> {
  const customer = await client().customers.create({
    email: input.email || undefined,
    metadata: { account_id: input.accountId },
  });
  return customer.id;
}

// Hosted Checkout for subscribing one client to a tier. The ids travel in the
// metadata so the webhook knows which client to activate.
export async function createClientSubscriptionCheckout(input: {
  customerId: string;
  priceId: string;
  accountId: string;
  clientId: string;
  plan: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const metadata = { account_id: input.accountId, client_id: input.clientId, plan: input.plan };
  const session = await client().checkout.sessions.create({
    mode: "subscription",
    customer: input.customerId,
    line_items: [{ price: input.priceId, quantity: 1 }],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata,
    subscription_data: { metadata },
  });
  if (!session.url) throw new Error("Stripe não retornou a URL do checkout.");
  return session.url;
}

export function constructWebhookEvent(payload: string, signature: string): Stripe.Event {
  return client().webhooks.constructEvent(payload, signature, stripeWebhookSecret());
}

// True when Stripe says the subscription doesn't exist (already gone), which
// callers can treat as "already cancelled".
function isMissing(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === "resource_missing";
}

// Ends a subscription right away (the client or the account is being deleted).
// Throws if Stripe refuses, so callers never delete while billing continues.
export async function cancelSubscriptionNow(subscriptionId: string): Promise<void> {
  try {
    await client().subscriptions.cancel(subscriptionId);
  } catch (error) {
    if (!isMissing(error)) throw error;
  }
}

// The owner cancels the plan: it stays active until the end of the period
// already paid, then Stripe ends it and the webhook drops the client to free.
export async function cancelSubscriptionAtPeriodEnd(subscriptionId: string): Promise<void> {
  try {
    await client().subscriptions.update(subscriptionId, { cancel_at_period_end: true });
  } catch (error) {
    if (!isMissing(error)) throw error;
  }
}

// Moves an existing subscription to another plan's price (upgrade or
// downgrade) instead of opening a second one. Stripe prorates the difference
// on the next invoice; the "subscription updated" webhook then sets the plan.
export async function changeSubscriptionPlan(subscriptionId: string, priceId: string, plan: string): Promise<void> {
  const stripe = client();
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const item = sub.items.data[0];
  if (!item) throw new Error("Assinatura sem item para trocar.");
  await stripe.subscriptions.update(subscriptionId, {
    items: [{ id: item.id, price: priceId }],
    proration_behavior: "create_prorations",
    cancel_at_period_end: false,
    metadata: { ...sub.metadata, plan },
  });
}

// Whether a subscription was opened by this account. A client can change
// hands while the previous account's subscription runs out its paid period;
// only the account that pays may change or reactivate it.
export async function subscriptionBelongsTo(subscriptionId: string, accountId: string): Promise<boolean> {
  try {
    const sub = await client().subscriptions.retrieve(subscriptionId);
    return sub.metadata?.account_id === accountId;
  } catch (error) {
    if (isMissing(error)) return false;
    throw error;
  }
}

// Whether a subscription is still billing (active, trialing or retrying a
// failed payment). Used to refuse a second checkout for the same client.
export async function subscriptionIsLive(subscriptionId: string): Promise<boolean> {
  try {
    const sub = await client().subscriptions.retrieve(subscriptionId);
    return ["active", "trialing", "past_due"].includes(sub.status);
  } catch (error) {
    if (isMissing(error)) return false;
    throw error;
  }
}

// One-time product sale: a direct charge on the creator's connected account, so
// the money goes straight to the creator. The price comes from the server.
export async function createProductCheckout(input: {
  accountId: string;
  name: string;
  amountCents: number;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const session = await client().checkout.sessions.create(
    {
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: { name: input.name.slice(0, 120) || "Produto" },
            unit_amount: input.amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    },
    { stripeAccount: input.accountId },
  );
  if (!session.url) throw new Error("Stripe não retornou a URL do checkout.");
  return session.url;
}

// Stripe's hosted page where the customer changes the card and sees invoices.
export async function createPortalSession(customerId: string, returnUrl: string): Promise<string> {
  const session = await client().billingPortal.sessions.create({ customer: customerId, return_url: returnUrl });
  return session.url;
}
