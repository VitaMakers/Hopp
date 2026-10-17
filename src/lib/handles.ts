// Public addresses share the root path with app routes, so these can never be handles.
const RESERVED = new Set([
  "admin",
  "api",
  "app",
  "auth",
  "dashboard",
  "templates",
  "entrar",
  "help",
  "l",
  "login",
  "logout",
  "onboarding",
  "privacidade",
  "settings",
  "signup",
  "suporte",
  "termos",
  "_next",
]);

export function normalizeHandle(input: string): string {
  return input.trim().toLowerCase().replace(/^@/, "");
}

export function handleError(handle: string): string | null {
  if (handle.length < 3) return "Use pelo menos 3 caracteres.";
  if (handle.length > 30) return "Use no máximo 30 caracteres.";
  if (!/^[a-z0-9._-]+$/.test(handle)) return "Use só letras, números, ponto, hífen ou sublinhado.";
  if (/^[._-]|[._-]$/.test(handle)) return "Comece e termine com letra ou número.";
  if (RESERVED.has(handle)) return "Este endereço é reservado.";
  return null;
}

// Short link codes live under /l/<code>, so they only need to be URL-safe.
export function shortCodeError(code: string): string | null {
  if (code.length < 2 || code.length > 40) return "Use de 2 a 40 caracteres.";
  if (!/^[A-Za-z0-9_-]+$/.test(code)) return "Use só letras, números, hífen ou sublinhado.";
  return null;
}

export function safeHttpUrl(input: string): string | null {
  try {
    const url = new URL(input.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
