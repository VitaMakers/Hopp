import { isAdmin } from "@/lib/admin";
import { getOwner } from "./context";
import { ClientSwitcher } from "./ClientSwitcher";
import { Sidebar } from "./Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, clients } = await getOwner();
  const admin = isAdmin(user.email);
  return (
    <div className="flex min-h-screen bg-stone-50 text-stone-900">
      <Sidebar isAdmin={admin} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-2.5">
            {/* left spacer (keeps room for the mobile hamburger) */}
            <div className="h-9" />
            {/* center: which client is being edited + create a new one */}
            <ClientSwitcher clients={clients} currentId={profile.id} />
            {/* right: open the public page */}
            <div className="flex items-center justify-end">
              <a
                href={`/${profile.handle}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-600 ring-1 ring-stone-200 hover:ring-stone-400"
              >
                /{profile.handle}
              </a>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
      </div>
    </div>
  );
}
