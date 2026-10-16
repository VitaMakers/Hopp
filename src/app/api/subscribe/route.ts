import { NextResponse } from "next/server";
import { z } from "zod";
import { getPublishedPage } from "@/lib/public-data";
import { createAdminClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  handle: z.string().min(1).max(60),
  blockId: z.string().min(1).max(64),
  email: z.string().trim().max(254),
  phone: z.string().trim().max(30),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const { handle, blockId, email, phone } = parsed.data;
  if (!z.email().safeParse(email).success) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  // Accept submissions only for a subscribe block that is live on the page.
  const page = await getPublishedPage(handle);
  const block = page?.doc.blocks.find((item) => item.id === blockId);
  if (!page || block?.type !== "subscribe" || !block.enabled) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const { error } = await createAdminClient()
    .from("contacts")
    .insert({
      owner_id: page.ownerId,
      block_id: blockId,
      email: email.toLowerCase(),
      phone: block.collectPhone && phone ? phone : null,
    });
  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true });
}
