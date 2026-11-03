import { NextResponse } from "next/server";
import { z } from "zod";
import { ownerIdForHandle } from "@/lib/public-data";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  handle: z.string().min(1).max(60),
  kind: z.enum(["page_view", "block_click", "social_click", "session"]),
  blockId: z.string().max(64).optional(),
  target: z.string().max(500).optional(),
  referrer: z.string().max(500).optional(),
  visitId: z.uuid().optional(),
  duration: z.number().int().min(0).max(86_400).optional(),
  utmSource: z.string().max(120).optional(),
  utmMedium: z.string().max(120).optional(),
  utmCampaign: z.string().max(120).optional(),
});

// Device, OS and browser from the User-Agent. Order matters: Edge/Opera UAs
// also contain "chrome"/"safari", and Chrome contains "safari".
function parseUA(ua: string): { device: string; os: string; browser: string } {
  const u = ua.toLowerCase();
  const tablet = /ipad|tablet|playbook|silk|kindle|(android(?!.*mobile))/.test(u);
  const mobile = !tablet && /mobi|iphone|ipod|android|blackberry|opera mini|iemobile|windows phone/.test(u);
  const device = tablet ? "Tablet" : mobile ? "Celular" : "Computador";
  let os = "Outro";
  if (/iphone|ipad|ipod/.test(u)) os = "iOS";
  else if (/android/.test(u)) os = "Android";
  else if (/windows/.test(u)) os = "Windows";
  else if (/mac os x|macintosh/.test(u)) os = "macOS";
  else if (/linux/.test(u)) os = "Linux";
  let browser = "Outro";
  if (/edg\//.test(u)) browser = "Edge";
  else if (/opr\/|opera/.test(u)) browser = "Opera";
  else if (/chrome|crios/.test(u)) browser = "Chrome";
  else if (/firefox|fxios/.test(u)) browser = "Firefox";
  else if (/safari/.test(u)) browser = "Safari";
  return { device, os, browser };
}

export async function POST(request: Request) {
  if (!rateLimit(`track:${clientIp(request)}`, 120, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const { handle, kind, blockId, target, referrer, visitId, duration, utmSource, utmMedium, utmCampaign } = parsed.data;
  const ownerId = await ownerIdForHandle(handle);
  if (!ownerId) return NextResponse.json({ ok: false }, { status: 404 });

  // Only a "session" event references duration_ms, so normal clicks/views keep
  // working even before the migration that adds that column has been run.
  const row: Record<string, unknown> = {
    owner_id: ownerId,
    kind,
    block_id: blockId ?? null,
    target: target ?? null,
    referrer: referrer || null,
    visit_id: visitId ?? null,
  };
  if (kind === "session" && duration != null) row.duration_ms = duration * 1000;

  // Visitor location, from the edge/CDN geo headers (Vercel). Only on a page
  // view, so we count one location per visit.
  // Extra columns only on a page view: location, device and campaign.
  const extra: Record<string, unknown> = {};
  if (kind === "page_view") {
    const country = request.headers.get("x-vercel-ip-country");
    const cityRaw = request.headers.get("x-vercel-ip-city");
    if (country) extra.country = country.slice(0, 2).toUpperCase();
    if (cityRaw) {
      try {
        extra.city = decodeURIComponent(cityRaw).slice(0, 120);
      } catch {
        extra.city = cityRaw.slice(0, 120);
      }
    }
    const ua = parseUA(request.headers.get("user-agent") ?? "");
    extra.device = ua.device;
    extra.os = ua.os;
    extra.browser = ua.browser;
    if (utmSource) extra.utm_source = utmSource.slice(0, 120);
    if (utmMedium) extra.utm_medium = utmMedium.slice(0, 120);
    if (utmCampaign) extra.utm_campaign = utmCampaign.slice(0, 120);
  }

  const admin = createAdminClient();
  let { error } = await admin.from("events").insert({ ...row, ...extra });
  // The location/device/utm columns may not exist yet (migrations 0011/0012 not
  // run) — if so, retry without them so tracking never breaks.
  if (error && Object.keys(extra).length) {
    ({ error } = await admin.from("events").insert(row));
  }
  if (error) console.error("track insert failed", error.message);
  return NextResponse.json({ ok: !error });
}
