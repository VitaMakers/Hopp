import { NextResponse } from "next/server";
import { z } from "zod";
import { getFormByCode, getPublishedPage } from "@/lib/public-data";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/server";

const answersSchema = z.array(z.object({ label: z.string().max(120), value: z.string().max(2000) })).max(40);

// Standalone form (own link): { code, answers }.
const standaloneSchema = z.object({ code: z.string().min(1).max(40), answers: answersSchema });
// Form block embedded on a bio page: { handle, blockId, answers }.
const blockSchema = z.object({ handle: z.string().min(1).max(60), blockId: z.string().min(1).max(64), answers: answersSchema });

// Saves a form submission, for either a standalone form or a page's form block.
export async function POST(request: Request) {
  if (!rateLimit(`form:${clientIp(request)}`, 15, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  const payload = await request.json().catch(() => null);

  const standalone = standaloneSchema.safeParse(payload);
  if (standalone.success) {
    const form = await getFormByCode(standalone.data.code);
    if (!form) return NextResponse.json({ ok: false }, { status: 404 });
    const { error } = await createAdminClient()
      .from("form_responses")
      .insert({ owner_id: form.ownerId, form_id: form.id, answers: standalone.data.answers });
    if (error) return NextResponse.json({ ok: false }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const block = blockSchema.safeParse(payload);
  if (block.success) {
    const page = await getPublishedPage(block.data.handle);
    const found = page?.doc.blocks.find((b) => b.id === block.data.blockId);
    if (!page || found?.type !== "form" || !found.enabled) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }
    const { error } = await createAdminClient()
      .from("form_responses")
      .insert({ owner_id: page.ownerId, block_id: block.data.blockId, answers: block.data.answers });
    if (error) return NextResponse.json({ ok: false }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
