"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { detachDomain } from "@/lib/domains";
import { cancelSubscriptionNow } from "@/lib/payments/billing";
import { createAdminClient, createClient, requireUser } from "@/lib/supabase/server";
import { removeAccountUploads } from "@/lib/uploads";

export type PasswordState = { error?: string; ok?: boolean };

export async function changePassword(_prev: PasswordState, form: FormData): Promise<PasswordState> {
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  if (password.length < 8) return { error: "A senha precisa ter ao menos 8 caracteres." };
  if (password !== confirm) return { error: "As senhas não conferem." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Não foi possível alterar a senha. Tente de novo." };
  return { ok: true };
}

export type DeleteState = { error?: string };

// Deletes the account and everything it manages. Removing the auth user
// cascades to all profiles (clients) of this account and their pages, events,
// contacts and short links.
export async function deleteAccount(_prev: DeleteState, form: FormData): Promise<DeleteState> {
  const { supabase, user } = await requireUser();
  if (!user) redirect("/login");
  if (String(form.get("confirm") ?? "").trim().toUpperCase() !== "EXCLUIR") {
    return { error: 'Digite EXCLUIR (em maiúsculas) para confirmar.' };
  }
  const admin = createAdminClient();

  // Stop billing for every client of this account before anything is deleted;
  // if Stripe refuses, keep the account so the subscriptions can still be
  // cancelled instead of charging a deleted account forever.
  const { data: paid } = await admin
    .from("profiles")
    .select("stripe_subscription_id")
    .eq("account_id", user.id)
    .not("stripe_subscription_id", "is", null);
  const { data: owned } = await admin.from("profiles").select("handle, custom_domain").eq("account_id", user.id);
  try {
    for (const row of paid ?? []) {
      if (row.stripe_subscription_id) await cancelSubscriptionNow(row.stripe_subscription_id);
    }
  } catch (error) {
    console.error("cancel subscriptions on account delete failed", error);
    return { error: "Não conseguimos cancelar as assinaturas no Stripe, então a conta não foi excluída. Tente de novo em instantes." };
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: "Não foi possível excluir a conta. Tente de novo." };
  // What the database cascade doesn't reach: uploaded images, a domain still
  // attached to the project, and the cached copy of each public page.
  await removeAccountUploads(user.id);
  for (const row of owned ?? []) {
    if (row.custom_domain) await detachDomain(row.custom_domain).catch(() => {});
    revalidatePath(`/${row.handle}`);
  }
  await supabase.auth.signOut();
  redirect("/");
}
