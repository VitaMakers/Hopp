import "server-only";
import { createStripeProvider } from "./stripe";

// Every payment provider (Stripe today; Asaas or Mercado Pago later) plugs in
// behind this interface, so the rest of the app never calls a provider SDK.
export type AccountStatus = { detailsSubmitted: boolean; chargesEnabled: boolean };

export interface PaymentProvider {
  readonly name: string;
  createConnectedAccount(input: { email: string; ownerId: string }): Promise<{ accountId: string }>;
  createOnboardingLink(input: { accountId: string; returnUrl: string; refreshUrl: string }): Promise<string>;
  getAccountStatus(accountId: string): Promise<AccountStatus>;
}

export function getPaymentProvider(): PaymentProvider {
  return createStripeProvider();
}
