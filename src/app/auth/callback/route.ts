import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Landing point of the confirmation e-mail: trade the code for a session.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  // Only same-site relative paths are honored, so the link can't bounce the
  // fresh session off to another origin.
  const next = request.nextUrl.searchParams.get("next");
  const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/onboarding";
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(dest, request.url));
  }
  return NextResponse.redirect(new URL("/login", request.url));
}
