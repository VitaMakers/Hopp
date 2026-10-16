import { NextResponse, type NextRequest } from "next/server";
import { safeHttpUrl } from "@/lib/handles";
import { createAdminClient } from "@/lib/supabase/server";

// Short link: record the click, then redirect to the destination.
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const admin = createAdminClient();
  const { data: link, error } = await admin
    .from("short_links")
    .select("id, owner_id, target_url")
    .eq("code", code)
    .maybeSingle();
  if (error) throw new Error(`Supabase (service role): ${error.message}`);
  const target = link ? safeHttpUrl(link.target_url) : null;
  if (!link || !target) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  await admin.from("events").insert({
    owner_id: link.owner_id,
    kind: "short_link_click",
    short_link_id: link.id,
    target,
    referrer: request.headers.get("referer")?.slice(0, 500) ?? null,
  });
  return NextResponse.redirect(target, 302);
}
