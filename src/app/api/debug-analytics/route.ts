import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// TEMPORARY diagnostic: reports whether events are stored and under which
// owner_id, so an analytics mismatch can be found. Remove after debugging.
export async function GET(request: Request) {
  const handle = (new URL(request.url).searchParams.get("handle") ?? "").toLowerCase().trim();
  if (!handle) return NextResponse.json({ error: "handle required" }, { status: 400 });
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, account_id, handle, plan")
    .eq("handle", handle)
    .maybeSingle();

  if (!profile) return NextResponse.json({ profile: null, note: "no profile for handle" });

  const [{ count: eventsForOwner }, { count: totalEvents }, { data: recent }] = await Promise.all([
    admin.from("events").select("id", { count: "exact", head: true }).eq("owner_id", profile.id),
    admin.from("events").select("id", { count: "exact", head: true }),
    admin.from("events").select("owner_id, kind, created_at").order("created_at", { ascending: false }).limit(8),
  ]);

  return NextResponse.json({
    profile,
    eventsForOwner: eventsForOwner ?? 0,
    totalEventsInTable: totalEvents ?? 0,
    recentEvents: recent ?? [],
  });
}
