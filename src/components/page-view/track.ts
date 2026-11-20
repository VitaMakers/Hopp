// Analytics beacons shared by the theme and premium layouts.

// One id per page load, sent with the view and every click after it, so the
// click rate counts visits with a click instead of raw clicks.
let visitId: string | undefined;

function newId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // randomUUID needs a secure context; build a v4 UUID by hand otherwise.
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// An anonymous code kept in this browser, so the page's owner can tell a
// returning visitor from a new one. It says nothing about who the person is,
// and a browser that blocks storage simply counts as a new visitor each time.
const VISITOR_KEY = "vb_visitor";
function visitorId(): string | undefined {
  try {
    const saved = window.localStorage.getItem(VISITOR_KEY);
    if (saved && /^[0-9a-f-]{36}$/i.test(saved)) return saved;
    const fresh = newId();
    window.localStorage.setItem(VISITOR_KEY, fresh);
    return fresh;
  } catch {
    return undefined;
  }
}

// iPhones don't say which model they are; the screen size narrows it down to
// a group of models.
const IPHONES: Record<string, string> = {
  "320x568": "iPhone SE (1ª geração) ou 5",
  "375x667": "iPhone SE, 6, 7 ou 8",
  "414x736": "iPhone 6, 7 ou 8 Plus",
  "375x812": "iPhone X, XS, 11 Pro ou mini",
  "414x896": "iPhone XR, 11 ou XS Max",
  "390x844": "iPhone 12, 13 ou 14",
  "428x926": "iPhone 12 ou 13 Pro Max, 14 Plus",
  "393x852": "iPhone 14 Pro, 15 ou 16",
  "430x932": "iPhone 15 ou 16 Plus, Pro Max",
  "402x874": "iPhone 16 Pro ou 17",
  "440x956": "iPhone 16 ou 17 Pro Max",
};

// The phone's model, when the browser tells: Android browsers based on Chrome
// answer with the model; iPhones are placed in a group by screen size.
async function deviceModel(): Promise<string> {
  try {
    const ua = navigator.userAgent;
    if (/iPhone/.test(ua)) {
      const w = Math.min(screen.width, screen.height);
      const h = Math.max(screen.width, screen.height);
      return IPHONES[`${w}x${h}`] ?? "iPhone";
    }
    if (/iPad/.test(ua)) return "iPad";
    const hints = (navigator as Navigator & { userAgentData?: { getHighEntropyValues?: (keys: string[]) => Promise<{ model?: string }> } }).userAgentData;
    if (hints?.getHighEntropyValues) {
      const { model } = await hints.getHighEntropyValues(["model"]);
      if (model) return model.slice(0, 60);
    }
    // Older Android browsers carry the model in the user agent.
    const match = ua.match(/Android [\d.]+; ([^;)]+?)(?: Build|\))/);
    if (match && match[1] !== "K") return match[1].trim().slice(0, 60);
  } catch {
    // Not available: the visit is still counted, without a model.
  }
  return "";
}

function send(payload: string) {
  if (!navigator.sendBeacon?.("/api/track", new Blob([payload], { type: "application/json" }))) {
    void fetch("/api/track", { method: "POST", body: payload, keepalive: true });
  }
}

export function track(handle: string | undefined, body: Record<string, string>) {
  if (!handle) return;
  const base = { handle, visitId, visitorId: visitorId(), ...body };
  if (body.kind !== "page_view") {
    forward(body);
    return send(JSON.stringify(base));
  }
  // The page view also carries the phone model; don't hold the view back for
  // it longer than a moment.
  const wait = new Promise<string>((resolve) => window.setTimeout(() => resolve(""), 400));
  void Promise.race([deviceModel(), wait]).then((model) => send(JSON.stringify(model ? { ...base, model } : base)));
}

// The owner's own pixels and analytics (when connected) also hear about a
// button click, so their reports and ad audiences can use it.
type Services = {
  fbq?: (...args: unknown[]) => void;
  ttq?: { track?: (event: string, data?: Record<string, unknown>) => void };
  gtag?: (...args: unknown[]) => void;
  clarity?: (...args: unknown[]) => void;
};
function forward(body: Record<string, string>) {
  try {
    const w = window as unknown as Services;
    const label = body.target || body.blockId || "";
    w.fbq?.("trackCustom", "CliqueNoBotao", { tipo: body.kind, destino: label });
    w.ttq?.track?.("ClickButton", { content_name: label });
    w.gtag?.("event", "clique_no_botao", { tipo: body.kind, destino: label });
    w.clarity?.("event", "clique_no_botao");
  } catch {
    // A blocked or broken third-party script must never stop the click.
  }
}

export function startVisit() {
  visitId = newId();
}

// How long the visitor stayed, sent once when they leave the page.
export function trackDuration(handle: string | undefined, seconds: number) {
  if (!handle || !visitId || seconds < 1) return;
  const payload = JSON.stringify({ handle, visitId, visitorId: visitorId(), kind: "session", duration: Math.min(86_400, Math.round(seconds)) });
  navigator.sendBeacon?.("/api/track", new Blob([payload], { type: "application/json" }));
}
