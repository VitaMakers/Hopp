import { NextResponse } from "next/server";
import { siteOrigin } from "@/lib/request";
import { getPaymentProvider } from "@/lib/payments";
import { createAdminClient } from "@/lib/supabase/server";
import { getOwner } from "../../../context";

// Starts (or resumes) payment-account onboarding for the selected client and
// sends the creator to the provider's hosted form. Coming back lands on the
// settings page.
export async function GET() {
  const { user, profile } = await getOwner();
  const base = await siteOrigin();

  try {
    const provider = getPaymentProvider();
    let accountId = profile.stripe_account_id;
    if (!accountId) {
      ({ accountId } = await provider.createConnectedAccount({ email: user.email ?? "", ownerId: profile.id }));
      // The account id is protected from client writes; store it as the server.
      const { error } = await createAdminClient()
        .from("profiles")
        .update({ stripe_account_id: accountId })
        .eq("id", profile.id);
      if (error) throw error;
    }
    const url = await provider.createOnboardingLink({
      accountId,
      returnUrl: `${base}/dashboard/settings?payments=returned`,
      refreshUrl: `${base}/dashboard/settings/payments/connect`,
    });
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("payments connect failed", error);
    return NextResponse.redirect(`${base}/dashboard/settings?payments=error`);
  }
}
