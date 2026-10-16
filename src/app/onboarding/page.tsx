import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { requireUser } from "@/lib/supabase/server";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  const { supabase, user } = await requireUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (profile) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
        <h1 className="text-2xl font-bold text-stone-900">Escolha o seu endereço</h1>
        <p className="mt-2 text-sm text-stone-600">
          É o link que você vai colocar na bio das redes sociais.
        </p>
        <OnboardingForm host={new URL(env.siteUrl()).host} />
      </div>
    </main>
  );
}
