import { NextResponse } from "next/server";
import { z } from "zod";
import { getFormByCode } from "@/lib/public-data";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/server";

const bodySchema = z.object({ code: z.string().min(1).max(40) });

// Records that the public form page was opened, for the views metric.
export async function POST(request: Request) {
  if (!rateLimit(`formview:${clientIp(request)}`, 60, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const form = await getFormByCode(parsed.data.code);
  if (!form) return NextResponse.json({ ok: false }, { status: 404 });
  await createAdminClient().from("form_views").insert({ owner_id: form.ownerId, form_id: form.id });
  return NextResponse.json({ ok: true });
}
