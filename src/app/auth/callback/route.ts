import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Landing point of the confirmation e-mail: trade the code for a session.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  // Only same-site relative paths are honored, so the link can't bounce the
  // fresh session off to another origin.
  const next = request.nextUrl.searchParams.get("next");
  // Browsers read "\\" as "/", so "/\\evil.com" would leave the site: after
  // the syntax check, the resolved address must still be on this origin.
  const looksLocal = !!next && next.startsWith("/") && !next.startsWith("//") && !/[\\\s]/.test(next);
  const dest = looksLocal && new URL(next!, request.url).origin === request.nextUrl.origin ? next! : "/onboarding";
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(dest, request.url));
  }
  // The link was already used, expired, or was opened in a different browser
  // from the one that asked for it: say so instead of a bare login screen.
  return NextResponse.redirect(new URL("/login?erro=link", request.url));
}
