import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CLIENT_COOKIE } from "@/app/dashboard/context";
import { requireUser } from "@/lib/supabase/server";

// Visitors seen in the last few minutes, for the "ao vivo" banner. Counts
// distinct visit ids among recent page views of the currently selected client.
const WINDOW_MS = 5 * 60_000;

export async function GET() {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ count: 0 }, { status: 401 });

  const { data: clients } = await supabase
    .from("profiles")
    .select("id")
    .eq("account_id", user.id)
    .order("created_at", { ascending: true });
  if (!clients || clients.length === 0) return NextResponse.json({ count: 0 }, { status: 404 });

  const selectedId = (await cookies()).get(CLIENT_COOKIE)?.value;
  const ownerId = (clients.find((c) => c.id === selectedId) ?? clients[0]).id;

  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { data } = await supabase
    .from("events")
    .select("visit_id")
    .eq("owner_id", ownerId)
    .eq("kind", "page_view")
    .gte("created_at", since)
    .limit(2000);

  const count = new Set((data ?? []).map((r) => (r as { visit_id: string | null }).visit_id).filter(Boolean)).size;
  return NextResponse.json({ count });
}
