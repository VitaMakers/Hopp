"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { PLANS } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/server";

// Platform owner sets any client's plan manually. Uses the service role, which
// is the only role allowed to change a plan (the billing trigger blocks others).
export async function setClientPlan(profileId: string, plan: string) {
  await requireAdmin();
  if (!(PLANS as readonly string[]).includes(plan)) return;
  const { data } = await createAdminClient().from("profiles").update({ plan }).eq("id", profileId).select("handle").maybeSingle();
  revalidatePath("/dashboard/admin");
  // The public page depends on the plan (premium design, video, forms, badge).
  if (data?.handle) revalidatePath(`/${data.handle}`);
}
