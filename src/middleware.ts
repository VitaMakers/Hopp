import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Two jobs:
// 1. A client's own domain (Profissional plan) opens that client's page.
// 2. On the app itself, keep the Supabase session cookie fresh and send
//    signed-out visitors of the dashboard to the login page.

const SITE = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
})();

// The app's own addresses; anything else is treated as a client's domain.
function isAppHost(host: string): boolean {
  // Without a configured site address there is no way to tell the app from a
  // client's domain, so nothing is treated as one.
  if (!process.env.NEXT_PUBLIC_SITE_URL) return true;
  const main = SITE.hostname.replace(/^www\./, "");
  return host === main || host === `www.${main}` || host === "localhost" || host === "127.0.0.1" || host.endsWith(".vercel.app");
}

// Which page a custom domain opens, remembered for a minute per instance so a
// visit doesn't ask the database every time.
const known = new Map<string, { handle: string | null; until: number }>();

async function handleForDomain(domain: string): Promise<string | null> {
  const hit = known.get(domain);
  if (hit && hit.until > Date.now()) return hit.handle;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  let handle: string | null = null;
  try {
    const res = await fetch(`${url}/rest/v1/profiles?custom_domain=ilike.${encodeURIComponent(domain)}&select=handle,plan&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (res.ok) {
      const rows = (await res.json()) as { handle: string; plan: string }[];
      const row = rows[0];
      // Only while the client is on the plan that includes a domain.
      if (row && (row.plan === "profissional" || row.plan === "pro")) handle = row.handle;
    }
  } catch {
    return null; // Don't remember a failed lookup.
  }
  known.set(domain, { handle, until: Date.now() + (handle ? 60_000 : 30_000) });
  return handle;
}

// What a visitor on a client's domain may reach besides the page itself.
function isSharedPath(path: string): boolean {
  return path.startsWith("/_next") || path.startsWith("/api/track") || path.startsWith("/api/form") || path.startsWith("/api/buy") || path.startsWith("/l/") || path.startsWith("/f/") || /\.[a-z0-9]+$/i.test(path);
}

export async function middleware(request: NextRequest) {
  const host = (request.headers.get("host") ?? request.headers.get("x-forwarded-host") ?? "").split(":")[0].toLowerCase();
  const path = request.nextUrl.pathname;

  if (host && !isAppHost(host)) {
    if (isSharedPath(path)) return NextResponse.next();
    const handle = await handleForDomain(host.replace(/^www\./, ""));
    // Unknown domain, or anything that isn't the page: back to the app.
    if (!handle || path !== "/") return NextResponse.redirect(new URL(handle ? path : "/", SITE));
    const page = request.nextUrl.clone();
    page.pathname = `/${handle}`;
    return NextResponse.rewrite(page);
  }

  // Public pages of the app need no session work.
  if (!(path.startsWith("/dashboard") || path.startsWith("/onboarding") || path === "/login" || path.startsWith("/auth"))) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && (path.startsWith("/dashboard") || path.startsWith("/onboarding"))) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  // Everything except build assets, so a client's domain is recognised on any
  // path; requests to the app's public pages return right away above.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
