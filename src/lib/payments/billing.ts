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

// Cancels a client's subscription immediately. The webhook then confirms the
// downgrade to free.
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await client().subscriptions.cancel(subscriptionId);
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
