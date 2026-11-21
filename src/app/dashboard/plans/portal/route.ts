import { NextResponse } from "next/server";
import { createPortalSession } from "@/lib/payments/billing";
import { siteOrigin } from "@/lib/request";
import { createAdminClient, requireUser } from "@/lib/supabase/server";

// Sends the signed-in account to Stripe's own page for its payment method and
// invoices. Only the account that pays has a customer on file, so nobody can
// open somebody else's.
export async function GET() {
  const base = await siteOrigin();
  const { user } = await requireUser();
  if (!user) return NextResponse.redirect(`${base}/login`);
  const { data } = await createAdminClient().from("account_billing").select("stripe_customer_id").eq("account_id", user.id).maybeSingle();
  if (!data?.stripe_customer_id) return NextResponse.redirect(`${base}/dashboard/plans?erro=portal`);
  try {
    return NextResponse.redirect(await createPortalSession(data.stripe_customer_id, `${base}/dashboard/plans`));
  } catch (error) {
    console.error("billing portal failed", error);
    return NextResponse.redirect(`${base}/dashboard/plans?erro=portal`);
  }
}
