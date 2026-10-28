import { NextResponse } from "next/server";
import { z } from "zod";
import { ownerIdForHandle } from "@/lib/public-data";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  handle: z.string().min(1).max(60),
  kind: z.enum(["page_view", "block_click", "social_click", "session"]),
  blockId: z.string().max(64).optional(),
  target: z.string().max(500).optional(),
  referrer: z.string().max(500).optional(),
  visitId: z.uuid().optional(),
  duration: z.number().int().min(0).max(86_400).optional(),
});

export async function POST(request: Request) {
  if (!rateLimit(`track:${clientIp(request)}`, 120, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const { handle, kind, blockId, target, referrer, visitId, duration } = parsed.data;
  const ownerId = await ownerIdForHandle(handle);
  if (!ownerId) return NextResponse.json({ ok: false }, { status: 404 });
  await createAdminClient()
    .from("events")
    .insert({
      owner_id: ownerId,
      kind,
      block_id: blockId ?? null,
      target: target ?? null,
      referrer: referrer || null,
      visit_id: visitId ?? null,
      duration_ms: kind === "session" && duration != null ? duration * 1000 : null,
    });
  return NextResponse.json({ ok: true });
}
