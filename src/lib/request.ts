import "server-only";
import { headers } from "next/headers";
import { env } from "@/lib/env";

// Whether a host is the app itself (and not a client's own domain).
function isOwnHost(host: string): boolean {
  const name = host.split(":")[0].toLowerCase();
  let site = "";
  try {
    site = new URL(env.siteUrl()).hostname.toLowerCase();
  } catch {}
  return name === site || name === `www.${site}` || name.endsWith(".vercel.app") || name === "localhost" || name === "127.0.0.1";
}

// The site's public origin for links and redirects (confirmation e-mails,
// payment return addresses). It follows the request when the request came in
// on one of the app's own hosts (vmbio.pro, the vercel URL, localhost). A
// request that arrived on a client's domain never names the origin: those
// links always point at the configured site.
export async function siteOrigin(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host && isOwnHost(host)) {
      const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // Not in a request scope; fall through to the configured value.
  }
  return env.siteUrl();
}
