import { NextResponse } from "next/server";
import { z } from "zod";
import { getPaymentProvider } from "@/lib/payments";
import { createProductCheckout } from "@/lib/payments/billing";
import { getPublishedPage } from "@/lib/public-data";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { siteOrigin } from "@/lib/request";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const bodySchema = z.object({ handle: z.string().min(1).max(60), blockId: z.string().min(1).max(64) });

// Starts a Stripe Checkout for a product block that sells with Stripe. The
// price comes from the published page (never the client), and the charge is a
// direct charge on the creator's connected account.
export async function POST(request: Request) {
  if (!rateLimit(`buy:${clientIp(request)}`, 20, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const { handle, blockId } = parsed.data;

  const page = await getPublishedPage(handle);
  const block = page?.doc.blocks.find((b) => b.id === blockId);
  if (!page || block?.type !== "product" || !block.enabled || !block.payWithStripe || block.amountCents <= 0) {
    return NextResponse.json({ ok: false, error: "indisponivel" }, { status: 404 });
  }

  // The seller must have a connected Stripe account that can accept charges.
  const { data: profile } = await createAdminClient()
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", page.ownerId)
    .maybeSingle();
  const accountId = profile?.stripe_account_id;
  if (!accountId) return NextResponse.json({ ok: false, error: "sem_pagamento" }, { status: 409 });

  try {
    const status = await getPaymentProvider().getAccountStatus(accountId);
    if (!status.chargesEnabled) return NextResponse.json({ ok: false, error: "sem_pagamento" }, { status: 409 });

    const base = await siteOrigin();
    const url = await createProductCheckout({
      accountId,
      name: block.title,
      amountCents: block.amountCents,
      successUrl: `${base}/${encodeURIComponent(handle)}?comprado=1`,
      cancelUrl: `${base}/${encodeURIComponent(handle)}`,
    });
    return NextResponse.json({ ok: true, url });
  } catch (error) {
    console.error("product checkout failed", error);
    return NextResponse.json({ ok: false, error: "erro" }, { status: 500 });
  }
}
