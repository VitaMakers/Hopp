import "server-only";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";

// Signed-in owner with a profile; sends everyone else to login or onboarding.
export async function getOwner() {
  const { supabase, user } = await requireUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, handle, display_name, plan, stripe_account_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) redirect("/onboarding");
  return { supabase, user, profile };
}
