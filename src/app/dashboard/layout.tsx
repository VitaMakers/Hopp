import Link from "next/link";
import { APP_NAME } from "@/lib/env";
import { isAdmin } from "@/lib/admin";
import { signOut } from "@/app/login/actions";
import { getOwner } from "./context";
import { DashboardNav } from "./DashboardNav";
import { ClientSwitcher } from "./ClientSwitcher";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, clients } = await getOwner();
  const admin = isAdmin(user.email);
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/dashboard" className="font-bold">
            {APP_NAME}
          </Link>
          <ClientSwitcher clients={clients} currentId={profile.id} />
          <DashboardNav isAdmin={admin} />
          <div className="ml-auto flex items-center gap-3 text-sm">
            <a href={`/${profile.handle}`} target="_blank" rel="noreferrer" className="text-stone-600 underline">
              /{profile.handle}
            </a>
            <form action={signOut}>
              <button type="submit" className="text-stone-500 hover:text-stone-900">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
    </div>
  );
}
