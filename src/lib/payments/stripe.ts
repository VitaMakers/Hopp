import "server-only";
import Stripe from "stripe";
import { stripeSecretKey } from "@/lib/env";
import type { PaymentProvider } from "./index";

// Stripe Connect: each creator gets an Express account and is paid directly;
// the platform can take an application fee per sale.
export function createStripeProvider(): PaymentProvider {
  // Fail fast instead of hanging ~80s if Stripe is slow, and retry transient
  // network errors automatically so a blip doesn't surface as a hard failure.
  const stripe = new Stripe(stripeSecretKey(), { timeout: 20000, maxNetworkRetries: 2 });
  return {
    name: "stripe",
    async createConnectedAccount({ email, ownerId }) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "BR",
        email,
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        metadata: { owner_id: ownerId },
      });
      return { accountId: account.id };
    },
    async createOnboardingLink({ accountId, returnUrl, refreshUrl }) {
      const link = await stripe.accountLinks.create({
        account: accountId,
        type: "account_onboarding",
        return_url: returnUrl,
        refresh_url: refreshUrl,
      });
      return link.url;
    },
    async getAccountStatus(accountId) {
      const account = await stripe.accounts.retrieve(accountId);
      return { detailsSubmitted: account.details_submitted, chargesEnabled: account.charges_enabled };
    },
  };
}
