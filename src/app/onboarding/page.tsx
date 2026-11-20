import Link from "next/link";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/lib/env";
import { formatBRL, PLAN_PRICE_BRL } from "@/lib/plans";
import { siteOrigin } from "@/lib/request";
import { requireUser } from "@/lib/supabase/server";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  const { supabase, user } = await requireUser();
  if (!user) redirect("/login");
  // Already manages at least one client? Go straight to the dashboard.
  const { data: profile } = await supabase.from("profiles").select("id").eq("account_id", user.id).limit(1).maybeSingle();
  if (profile) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-[#F3F2EE] px-4 text-stone-900 lg:px-10">
      <div className="mx-auto w-full max-w-[1180px] py-6 lg:py-9">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-display text-xl font-bold tracking-[-0.02em]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand-mark.png" alt="" className="h-7 w-auto" />
            {APP_NAME}
          </span>
          <Link href="/precos" className="text-sm font-semibold text-stone-700 underline-offset-4 hover:text-stone-900 hover:underline">
            Ver planos
          </Link>
        </div>

        <h1 className="mt-9 font-display text-[34px] font-bold leading-tight tracking-[-0.03em] sm:text-[40px]">Crie a sua página</h1>
        <p className="mt-2 max-w-xl text-[15px] text-stone-600">Dois passos: diga como a página se chama e escolha um modelo. Leva menos de um minuto.</p>

        <OnboardingForm host={new URL(await siteOrigin()).host} essencialPrice={formatBRL(PLAN_PRICE_BRL.essencial)} />
      </div>
    </main>
  );
}
