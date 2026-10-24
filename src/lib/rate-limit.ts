// Lightweight in-memory rate limit. It lives per server instance (serverless
// may run a few), so it's a basic guard against bursts and abuse, not a hard
// global cap. Good enough for /api/track and /api/subscribe.
const hits = new Map<string, { count: number; reset: number }>();

// Returns true when the request is allowed, false when over the limit.
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.reset) {
    hits.set(key, { count: 1, reset: now + windowMs });
    // Occasional cleanup so the map can't grow without bound.
    if (hits.size > 10_000) for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
