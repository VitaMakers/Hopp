"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { detachDomain } from "@/lib/domains";
import { cancelSubscriptionNow } from "@/lib/payments/billing";
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

export type DeleteAccountResult = { error?: string };

// Platform owner removes a whole account: the login plus every page it
// manages (pages, statistics, contacts and forms go with it by cascade).
export async function deleteClientAccount(accountId: string, typed: string): Promise<DeleteAccountResult> {
  const { user } = await requireAdmin();
  if (accountId === user.id) return { error: "Esta é a sua própria conta. Para excluí-la, use Configurações." };
  const admin = createAdminClient();

  const { data: rows } = await admin
    .from("profiles")
    .select("handle, custom_domain, stripe_subscription_id")
    .eq("account_id", accountId);
  const profiles = rows ?? [];
  if (profiles.length === 0) return { error: "Conta não encontrada. Atualize a página." };
  const wanted = typed.trim().replace(/^\//, "").toLowerCase();
  if (!profiles.some((p) => p.handle.toLowerCase() === wanted)) {
    return { error: "O endereço digitado não confere com o desta conta." };
  }

  // Stop billing first; if Stripe refuses, keep the account so the
  // subscription can still be cancelled instead of charging a deleted account.
  try {
    for (const p of profiles) {
      if (p.stripe_subscription_id) await cancelSubscriptionNow(p.stripe_subscription_id);
    }
  } catch (error) {
    console.error("cancel subscriptions on admin delete failed", error);
    return { error: "Não foi possível cancelar a assinatura no Stripe, então a conta não foi excluída. Tente de novo." };
  }

  const { error } = await admin.auth.admin.deleteUser(accountId);
  if (error) return { error: "Não foi possível excluir a conta. Tente de novo." };

  for (const p of profiles) {
    if (p.custom_domain) await detachDomain(p.custom_domain).catch(() => {});
    revalidatePath(`/${p.handle}`);
  }
  revalidatePath("/dashboard/admin");
  return {};
}
