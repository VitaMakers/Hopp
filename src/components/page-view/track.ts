// Analytics beacons shared by the theme and premium layouts.

// One id per page load, sent with the view and every click after it, so the
// click rate counts visits with a click instead of raw clicks.
let visitId: string | undefined;

function newVisitId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // randomUUID needs a secure context; build a v4 UUID by hand otherwise.
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function track(handle: string | undefined, body: Record<string, string>) {
  if (!handle) return;
  const payload = JSON.stringify({ handle, visitId, ...body });
  if (!navigator.sendBeacon?.("/api/track", new Blob([payload], { type: "application/json" }))) {
    void fetch("/api/track", { method: "POST", body: payload, keepalive: true });
  }
}

export function startVisit() {
  visitId = newVisitId();
}

// How long the visitor stayed, sent once when they leave the page.
export function trackDuration(handle: string | undefined, seconds: number) {
  if (!handle || !visitId || seconds < 1) return;
  const payload = JSON.stringify({ handle, visitId, kind: "session", duration: Math.min(86_400, Math.round(seconds)) });
  navigator.sendBeacon?.("/api/track", new Blob([payload], { type: "application/json" }));
}
