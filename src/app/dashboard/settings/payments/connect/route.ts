import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getPaymentProvider } from "@/lib/payments";
import { createAdminClient, requireUser } from "@/lib/supabase/server";

// Starts (or resumes) payment-account onboarding and sends the creator to
// the provider's hosted form. Coming back lands on the settings page.
export async function GET() {
  const { supabase, user } = await requireUser();
  const base = env.siteUrl();
  if (!user) return NextResponse.redirect(`${base}/login`);
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, stripe_account_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return NextResponse.redirect(`${base}/onboarding`);

  try {
    const provider = getPaymentProvider();
    let accountId = profile.stripe_account_id;
    if (!accountId) {
      ({ accountId } = await provider.createConnectedAccount({ email: user.email ?? "", ownerId: user.id }));
      // The account id is protected from client writes; store it as the server.
      const { error } = await createAdminClient()
        .from("profiles")
        .update({ stripe_account_id: accountId })
        .eq("id", user.id);
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
