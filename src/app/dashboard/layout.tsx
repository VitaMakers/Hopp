import { isAdmin } from "@/lib/admin";
import { getOwner } from "./context";
import { Sidebar } from "./Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, clients } = await getOwner();
  const admin = isAdmin(user.email);
  return (
    <div className="flex min-h-screen bg-[#F3F2EE] text-stone-900 [font-variant-numeric:tabular-nums] selection:bg-[#D9DDFD]">
      <Sidebar isAdmin={admin} clients={clients} currentId={profile.id} plan={profile.plan} />
      <main className="min-w-0 flex-1 px-4 pb-12 pt-[4.5rem] lg:px-10 lg:pt-9">
        <div className="mx-auto w-full max-w-[1180px]">{children}</div>
      </main>
    </div>
  );
}
