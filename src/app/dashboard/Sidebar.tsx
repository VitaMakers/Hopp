"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { APP_NAME } from "@/lib/env";
import { signOut } from "@/app/login/actions";

// The editor (src/components/editor/Editor.tsx) and this sidebar stay in sync
// through a "vita:section" window event plus the URL hash, so switching a
// section never reloads the page or drops unsaved edits.
type IconName =
  | "blocks" | "profile" | "theme" | "templates" | "seo"
  | "stats" | "contacts" | "forms" | "links"
  | "clients" | "plans" | "settings" | "logout" | "shield" | "menu" | "collapse";

function Icon({ name }: { name: IconName }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<IconName, React.ReactNode> = {
    blocks: <><rect x="3" y="3" width="8" height="8" rx="2" {...p} /><rect x="13" y="3" width="8" height="8" rx="2" {...p} /><rect x="3" y="13" width="8" height="8" rx="2" {...p} /><rect x="13" y="13" width="8" height="8" rx="2" {...p} /></>,
    profile: <><circle cx="12" cy="8" r="4" {...p} /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" {...p} /></>,
    theme: <><path d="M12 3a9 9 0 0 0 0 18c1.7 0 2-1.5 1-2.5s-.5-2.5 1-2.5H18a3 3 0 0 0 3-3c0-4.4-4-7-9-7Z" {...p} /><circle cx="7.5" cy="10.5" r="1" fill="currentColor" /><circle cx="12" cy="7.5" r="1" fill="currentColor" /><circle cx="16.5" cy="10.5" r="1" fill="currentColor" /></>,
    templates: <><rect x="3" y="3" width="18" height="18" rx="2" {...p} /><path d="M3 9h18M9 9v12" {...p} /></>,
    seo: <><circle cx="11" cy="11" r="7" {...p} /><path d="m21 21-4.3-4.3" {...p} /></>,
    stats: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" {...p} /></>,
    contacts: <><rect x="4" y="3" width="16" height="18" rx="2" {...p} /><circle cx="12" cy="10" r="2.5" {...p} /><path d="M8.5 17c.6-1.8 2-2.5 3.5-2.5s2.9.7 3.5 2.5" {...p} /></>,
    forms: <><rect x="5" y="3" width="14" height="18" rx="2" {...p} /><path d="M9 8h6M9 12h6M9 16h4" {...p} /></>,
    links: <><path d="M9 12h6M10 7h-2a4 4 0 0 0 0 8h2M14 7h2a4 4 0 0 1 0 8h-2" {...p} /></>,
    clients: <><circle cx="9" cy="8" r="3.2" {...p} /><path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5" {...p} /><path d="M16 5.2A3.2 3.2 0 0 1 16 11M17 15c2.6.3 4 2 4 5" {...p} /></>,
    plans: <><rect x="3" y="5" width="18" height="14" rx="2" {...p} /><path d="M3 10h18" {...p} /></>,
    settings: <><circle cx="12" cy="12" r="3" {...p} /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" {...p} /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" {...p} /></>,
    shield: <><path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z" {...p} /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" {...p} /></>,
    collapse: <><rect x="3" y="4" width="18" height="16" rx="2" {...p} /><path d="M9 4v16" {...p} /></>,
  };
  return <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden>{paths[name]}</svg>;
}

// Editor sections (open inside /dashboard without a reload) and page routes.
const SECTIONS: { id: string; label: string; icon: IconName }[] = [
  { id: "blocks", label: "Página", icon: "blocks" },
  { id: "theme", label: "Aparência", icon: "theme" },
  { id: "templates", label: "Modelos", icon: "templates" },
  { id: "seo", label: "SEO", icon: "seo" },
];
const PAGE_ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard/analytics", label: "Estatísticas", icon: "stats" },
  { href: "/dashboard/contacts", label: "Contatos", icon: "contacts" },
  { href: "/dashboard/formularios", label: "Formulários", icon: "forms" },
  { href: "/dashboard/links", label: "Links curtos", icon: "links" },
];
const ACCOUNT_ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard/clientes", label: "Clientes", icon: "clients" },
  { href: "/dashboard/plans", label: "Planos", icon: "plans" },
  { href: "/dashboard/settings", label: "Configurações", icon: "settings" },
];

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const onEditor = pathname === "/dashboard";
  const [section, setSection] = useState("blocks");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Keep the highlighted section in sync with the editor (hash + events).
  useEffect(() => {
    const fromHash = window.location.hash.slice(1);
    if (SECTIONS.some((s) => s.id === fromHash)) setSection(fromHash);
    const onSection = (e: Event) => {
      const id = (e as CustomEvent).detail as string;
      if (SECTIONS.some((s) => s.id === id)) setSection(id);
    };
    window.addEventListener("vita:section", onSection);
    try {
      setCollapsed(localStorage.getItem("vita-sidebar") === "1");
    } catch {}
    return () => window.removeEventListener("vita:section", onSection);
  }, []);

  // Close the mobile drawer on navigation.
  useEffect(() => setMobileOpen(false), [pathname]);

  function toggleCollapsed() {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem("vita-sidebar", next ? "1" : "0");
      } catch {}
      return next;
    });
  }

  function goSection(id: string) {
    setMobileOpen(false);
    if (onEditor) {
      history.replaceState(null, "", `#${id}`);
      setSection(id);
      window.dispatchEvent(new CustomEvent("vita:section", { detail: id }));
    } else {
      router.push(`/dashboard#${id}`);
    }
  }

  const w = collapsed ? "lg:w-16" : "lg:w-60";
  const rowBase = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition";

  const content = (
    <div className="flex h-full flex-col gap-1 overflow-y-auto px-3 py-4">
      <div className="mb-2 flex items-center justify-between px-1">
        <Link href="/dashboard" className={`flex items-center gap-2 font-extrabold tracking-tight ${collapsed ? "lg:justify-center" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand-mark.png" alt="" className="h-7 w-auto" />
          <span className={collapsed ? "lg:hidden" : ""}>{APP_NAME}</span>
        </Link>
        <button type="button" onClick={toggleCollapsed} className="hidden rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 lg:block" aria-label="Recolher menu">
          <Icon name="collapse" />
        </button>
      </div>

      <Group label="Esta página" collapsed={collapsed} />
      {SECTIONS.map((s) => {
        const active = onEditor && section === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => goSection(s.id)}
            title={s.label}
            className={`${rowBase} ${collapsed ? "lg:justify-center" : ""} ${active ? "bg-stone-100 font-semibold text-stone-900" : "text-stone-600 hover:bg-stone-50"}`}
          >
            <Icon name={s.icon} />
            <span className={collapsed ? "lg:hidden" : ""}>{s.label}</span>
          </button>
        );
      })}
      {PAGE_ITEMS.map((item) => (
        <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} rowBase={rowBase} />
      ))}

      <Group label="Conta" collapsed={collapsed} />
      {ACCOUNT_ITEMS.map((item) => (
        <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} rowBase={rowBase} />
      ))}
      {isAdmin ? (
        <NavLink item={{ href: "/dashboard/admin", label: "Admin", icon: "shield" }} pathname={pathname} collapsed={collapsed} rowBase={rowBase} />
      ) : null}

      <form action={signOut} className="mt-auto pt-2">
        <button type="submit" title="Sair" className={`${rowBase} w-full ${collapsed ? "lg:justify-center" : ""} text-stone-500 hover:bg-stone-50 hover:text-stone-900`}>
          <Icon name="logout" />
          <span className={collapsed ? "lg:hidden" : ""}>Sair</span>
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Mobile top bar with a hamburger (the desktop sidebar is static). */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-2.5 z-40 rounded-lg bg-white p-2 text-stone-600 ring-1 ring-stone-200 lg:hidden"
        aria-label="Abrir menu"
      >
        <Icon name="menu" />
      </button>

      {/* Desktop: static sidebar */}
      <aside className={`sticky top-0 hidden h-screen shrink-0 border-r border-stone-200 bg-white lg:block ${w}`}>{content}</aside>

      {/* Mobile: slide-over drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Fechar" className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-stone-200 bg-white shadow-xl">{content}</aside>
        </div>
      ) : null}
    </>
  );
}

function Group({ label, collapsed }: { label: string; collapsed: boolean }) {
  return (
    <p className={`mt-4 px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-stone-400 ${collapsed ? "lg:hidden" : ""}`}>{label}</p>
  );
}

function NavLink({
  item,
  pathname,
  collapsed,
  rowBase,
}: {
  item: { href: string; label: string; icon: IconName };
  pathname: string;
  collapsed: boolean;
  rowBase: string;
}) {
  const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
  return (
    <Link
      href={item.href}
      title={item.label}
      className={`${rowBase} ${collapsed ? "lg:justify-center" : ""} ${active ? "bg-stone-100 font-semibold text-stone-900" : "text-stone-600 hover:bg-stone-50"}`}
    >
      <Icon name={item.icon} />
      <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
    </Link>
  );
}
