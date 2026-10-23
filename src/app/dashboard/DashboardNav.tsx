"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/dashboard", label: "Minha página" },
  { href: "/dashboard/clientes", label: "Clientes" },
  { href: "/dashboard/links", label: "Links curtos" },
  { href: "/dashboard/analytics", label: "Estatísticas" },
  { href: "/dashboard/contacts", label: "Contatos" },
  { href: "/dashboard/plans", label: "Planos" },
  { href: "/dashboard/settings", label: "Configurações" },
];

export function DashboardNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? [...ITEMS, { href: "/dashboard/admin", label: "Admin" }] : ITEMS;
  return (
    <nav className="flex flex-wrap gap-1 text-sm">
      {items.map((item) => {
        const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-3 py-1.5 ${active ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
