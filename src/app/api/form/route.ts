import { NextResponse } from "next/server";
import { z } from "zod";
import { getPublishedPage } from "@/lib/public-data";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  handle: z.string().min(1).max(60),
  blockId: z.string().min(1).max(64),
  answers: z.array(z.object({ label: z.string().max(120), value: z.string().max(2000) })).max(30),
});

// Saves a form submission. Accepted only for a form block that is live on the
// published page; the answers are written as the server (service role).
export async function POST(request: Request) {
  if (!rateLimit(`form:${clientIp(request)}`, 15, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const { handle, blockId, answers } = parsed.data;

  const page = await getPublishedPage(handle);
  const block = page?.doc.blocks.find((b) => b.id === blockId);
  if (!page || block?.type !== "form" || !block.enabled) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const { error } = await createAdminClient()
    .from("form_responses")
    .insert({ owner_id: page.ownerId, block_id: blockId, answers });
  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true });
}
