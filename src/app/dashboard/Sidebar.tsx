"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { APP_NAME } from "@/lib/env";
import { signOut } from "@/app/login/actions";
import { ClientSwitcher } from "./ClientSwitcher";
import type { Client } from "./context";

type IconName =
  | "home" | "page" | "models" | "stats" | "contacts" | "forms" | "links"
  | "clients" | "plans" | "settings" | "logout" | "shield" | "menu" | "collapse";

function Icon({ name }: { name: IconName }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<IconName, React.ReactNode> = {
    home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" {...p} />,
    page: <><rect x="6" y="2" width="12" height="20" rx="2.5" {...p} /><path d="M10.5 18h3" {...p} /></>,
    models: <><rect x="3" y="3" width="7.5" height="11" rx="1.5" {...p} /><rect x="13.5" y="3" width="7.5" height="7" rx="1.5" {...p} /><rect x="13.5" y="13" width="7.5" height="8" rx="1.5" {...p} /><rect x="3" y="17" width="7.5" height="4" rx="1.5" {...p} /></>,
    stats: <path d="M4 20V11M10 20V5M16 20v-7M21 20H3" {...p} />,
    contacts: <><circle cx="9" cy="8" r="3.5" {...p} /><path d="M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.8c1.7.8 2.8 2.6 3 5.2" {...p} /></>,
    forms: <><rect x="4" y="3" width="16" height="18" rx="2" {...p} /><path d="M8 8h8M8 12h8M8 16h5" {...p} /></>,
    links: <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" {...p} />,
    clients: <><rect x="3" y="7" width="18" height="13" rx="2" {...p} /><path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M3 12.5h18" {...p} /></>,
    plans: <><rect x="2.5" y="5" width="19" height="14" rx="2" {...p} /><path d="M2.5 9.5h19M6.5 15h4" {...p} /></>,
    settings: <><circle cx="12" cy="12" r="3" {...p} /><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" {...p} /></>,
    logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" {...p} />,
    shield: <path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z" {...p} />,
    menu: <path d="M4 6h16M4 12h16M4 18h16" {...p} />,
    collapse: <><rect x="3" y="4" width="18" height="16" rx="2" {...p} /><path d="M9 4v16" {...p} /></>,
  };
  return <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" aria-hidden>{paths[name]}</svg>;
}

type Item = { href: string; label: string; icon: IconName; exact?: boolean; pro?: boolean };

// Main areas, then a gap, then the client-facing tools. Account items sit at
// the bottom. Admin shows only for platform admins.
const MAIN: Item[] = [
  { href: "/dashboard", label: "Início", icon: "home", exact: true },
  { href: "/dashboard/editor", label: "Minha página", icon: "page" },
  { href: "/dashboard/modelos", label: "Modelos", icon: "models" },
];
const TOOLS: Item[] = [
  { href: "/dashboard/analytics", label: "Estatísticas", icon: "stats" },
  { href: "/dashboard/contacts", label: "Contatos", icon: "contacts" },
  { href: "/dashboard/formularios", label: "Formulários", icon: "forms", pro: true },
  { href: "/dashboard/links", label: "Links curtos", icon: "links" },
];
const ACCOUNT: Item[] = [
  { href: "/dashboard/clientes", label: "Clientes", icon: "clients" },
  { href: "/dashboard/plans", label: "Plano", icon: "plans" },
  { href: "/dashboard/settings", label: "Configurações", icon: "settings" },
];

export function Sidebar({
  isAdmin = false,
  clients,
  currentId,
  plan,
}: {
  isAdmin?: boolean;
  clients: Client[];
  currentId: string;
  plan: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isPro = plan === "profissional";

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("vita-sidebar") === "1");
    } catch {}
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

  const row = (item: Item) => {
    const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        key={item.href}
        href={item.href}
        title={item.label}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-[9px] px-2.5 py-2 text-sm transition-colors ${collapsed ? "lg:justify-center" : ""} ${
          active ? "bg-[#EDEDF8] font-semibold text-stone-900" : "font-medium text-stone-700 hover:bg-[#F3F2EE] hover:text-stone-900"
        }`}
      >
        <Icon name={item.icon} />
        <span className={`flex-1 ${collapsed ? "lg:hidden" : ""}`}>{item.label}</span>
        {item.pro && !isPro ? (
          <span className={`rounded-full border border-[#D9D6EE] px-1.5 text-[11px] font-semibold text-stone-700 ${collapsed ? "lg:hidden" : ""}`}>Pro</span>
        ) : null}
      </Link>
    );
  };

  const content = (
    <div className="flex h-full flex-col gap-0.5 overflow-y-auto px-3 pb-4 pt-5">
      <div className="mb-4 flex items-center justify-between px-1.5">
        <Link href="/dashboard" className={`flex items-center gap-2 ${collapsed ? "lg:justify-center" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand-mark.png" alt="" className="h-6 w-auto" />
          <span className={`font-display text-[17px] font-bold tracking-tight ${collapsed ? "lg:hidden" : ""}`}>{APP_NAME}</span>
        </Link>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="hidden rounded-md p-1.5 text-stone-500 hover:bg-[#F3F2EE] hover:text-stone-900 lg:block"
          aria-label={collapsed ? "Abrir menu" : "Recolher menu"}
        >
          <Icon name="collapse" />
        </button>
      </div>

      <div className={`mb-4 ${collapsed ? "lg:hidden" : ""}`}>
        <ClientSwitcher clients={clients} currentId={currentId} variant="sidebar" />
      </div>

      {MAIN.map(row)}
      <div className="h-3" />
      {TOOLS.map(row)}

      <div className="mt-auto flex flex-col gap-0.5 pt-6">
        {ACCOUNT.map(row)}
        {isAdmin ? row({ href: "/dashboard/admin", label: "Admin", icon: "shield" }) : null}
        <form action={signOut}>
          <button
            type="submit"
            title="Sair"
            className={`flex w-full items-center gap-3 rounded-[9px] px-2.5 py-2 text-sm font-medium text-stone-600 hover:bg-[#F3F2EE] hover:text-stone-900 ${collapsed ? "lg:justify-center" : ""}`}
          >
            <Icon name="logout" />
            <span className={collapsed ? "lg:hidden" : ""}>Sair</span>
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Phone: a slim top bar with the menu button. */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-[#E5E2DA] bg-white px-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-stone-700 ring-1 ring-[#E5E2DA]"
          aria-label="Abrir menu"
        >
          <Icon name="menu" />
        </button>
        <span className="font-display text-[17px] font-bold tracking-tight">{APP_NAME}</span>
      </div>

      {/* Computer: fixed column. */}
      <aside className={`sticky top-0 hidden h-screen shrink-0 border-r border-[#E5E2DA] bg-white lg:block ${collapsed ? "lg:w-[68px]" : "lg:w-[248px]"}`}>
        {content}
      </aside>

      {/* Phone: slide-over drawer. */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-[#191A3D]/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[272px] border-r border-[#E5E2DA] bg-white">{content}</aside>
        </div>
      ) : null}
    </>
  );
}
