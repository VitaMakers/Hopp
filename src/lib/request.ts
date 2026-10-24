import "server-only";
import { headers } from "next/headers";
import { env } from "@/lib/env";

// The site's public origin, taken from the incoming request, so links and
// redirects follow whatever domain the app is served on (virttu.tech, the
// vercel URL, localhost) without needing a configured NEXT_PUBLIC_SITE_URL.
// Falls back to the env value (then localhost) when there is no request.
export async function siteOrigin(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // Not in a request scope; fall through to the configured value.
  }
  return env.siteUrl();
}
