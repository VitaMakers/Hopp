import "server-only";
import { env } from "@/lib/env";

// A client's own domain (Profissional plan). The domain is stored on the
// profile; the middleware sends its visitors to the client's page. The hosting
// (Vercel) also has to know the domain to answer for it and issue the
// certificate: with VERCEL_TOKEN and VERCEL_PROJECT_ID set this is done
// automatically; without them the domain waits to be added by hand.
// VERCEL_PROJECT_ID accepts the project's id or its name.

export const DNS_A_VALUE = "76.76.21.21";
export const DNS_CNAME_VALUE = "cname.vercel-dns.com";

// "https://www.Marca.com.br/pagina" -> "marca.com.br"
export function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "")
    .replace(/^www\./, "")
    .replace(/\.$/, "");
}

export function domainError(domain: string): string | null {
  if (!domain) return "Digite o domínio.";
  if (domain.length > 253) return "Domínio longo demais.";
  if (!/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(domain)) {
    return "Digite só o domínio, como marca.com.br ou link.marca.com.br.";
  }
  const site = new URL(env.siteUrl()).hostname.replace(/^www\./, "");
  if (domain === site || domain.endsWith(`.${site}`) || domain.endsWith(".vercel.app")) {
    return "Use um domínio seu, não o endereço do Virtú.bio.";
  }
  return null;
}

function vercel() {
  const token = process.env.VERCEL_TOKEN;
  const project = process.env.VERCEL_PROJECT_ID;
  if (!token || !project) return null;
  // The team can be named by its id (team_...) or by its address in Vercel
  // (the part after vercel.com/ in the project's URL).
  const team = process.env.VERCEL_TEAM_ID
    ? `?teamId=${encodeURIComponent(process.env.VERCEL_TEAM_ID)}`
    : process.env.VERCEL_TEAM_SLUG
      ? `?slug=${encodeURIComponent(process.env.VERCEL_TEAM_SLUG)}`
      : "";
  return { token, project, team };
}

async function call(path: string, init: RequestInit & { token: string }) {
  const { token, ...rest } = init;
  return fetch(`https://api.vercel.com${path}`, {
    ...rest,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
}

// Registers the domain with the hosting. "manual" means there is no hosting
// key configured, so someone has to add the domain there by hand.
export async function attachDomain(domain: string): Promise<"ok" | "manual" | "taken" | "error"> {
  const v = vercel();
  if (!v) return "manual";
  try {
    const res = await call(`/v10/projects/${v.project}/domains${v.team}`, { method: "POST", token: v.token, body: JSON.stringify({ name: domain }) });
    if (res.ok) return "ok";
    const body = (await res.json().catch(() => null)) as { error?: { code?: string } } | null;
    const code = body?.error?.code ?? "";
    // Already on this project is fine; in use by another project is not.
    if (code === "domain_already_in_use" || code === "domain_already_exists") return res.status === 409 && code === "domain_already_in_use" ? "taken" : "ok";
    console.error("vercel attach domain", res.status, code);
    return "error";
  } catch (error) {
    console.error("vercel attach domain", error);
    return "error";
  }
}

export async function detachDomain(domain: string): Promise<void> {
  const v = vercel();
  if (!v) return;
  try {
    await call(`/v9/projects/${v.project}/domains/${encodeURIComponent(domain)}${v.team}`, { method: "DELETE", token: v.token });
  } catch (error) {
    console.error("vercel detach domain", error);
  }
}

export type DomainStatus = "active" | "pending" | "manual" | "unknown";

// Whether the domain already points here and is answering.
export async function domainStatus(domain: string): Promise<DomainStatus> {
  const v = vercel();
  if (!v) return "manual";
  try {
    const [project, config] = await Promise.all([
      call(`/v9/projects/${v.project}/domains/${encodeURIComponent(domain)}${v.team}`, { method: "GET", token: v.token }),
      call(`/v6/domains/${encodeURIComponent(domain)}/config${v.team}`, { method: "GET", token: v.token }),
    ]);
    if (!project.ok || !config.ok) return "unknown";
    const p = (await project.json()) as { verified?: boolean };
    const c = (await config.json()) as { misconfigured?: boolean };
    return p.verified && !c.misconfigured ? "active" : "pending";
  } catch {
    return "unknown";
  }
}
