"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { handleError, normalizeHandle } from "@/lib/handles";
import { defaultPageDoc } from "@/lib/page/catalog";
import { cancelSubscription } from "@/lib/payments/billing";
import { TEMPLATES } from "@/lib/page/templates";
import { FREE_CLIENTS } from "@/lib/plans";
import { createAdminClient, requireUser } from "@/lib/supabase/server";
import { CLIENT_COOKIE, getOwner } from "../context";

const COOKIE_OPTS = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 365 };

// Point the dashboard at another client the account manages. RLS makes the
// update a no-op for a client that isn't yours, and getOwner falls back to the
// first client if the cookie points nowhere, so an invalid id is harmless.
export async function selectClient(id: string) {
  const { user } = await requireUser();
  if (!user) redirect("/login");
  (await cookies()).set(CLIENT_COOKIE, id, COOKIE_OPTS);
  redirect("/dashboard");
}

export type AddClientState = { error?: string };

export async function addClient(_: AddClientState, form: FormData): Promise<AddClientState> {
  const { supabase, user } = await requireUser();
  if (!user) redirect("/login");

  const handle = normalizeHandle(String(form.get("handle") ?? ""));
  const name = String(form.get("name") ?? "").trim().slice(0, 80) || handle;
  const invalid = handleError(handle);
  if (invalid) return { error: invalid };

  // Beyond the free allowance, the new client is a paid slot and goes through
  // Stripe Checkout right after being created.
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("account_id", user.id);
  const paidSlot = (count ?? 0) >= FREE_CLIENTS;
  const plan = String(form.get("plan") ?? "essencial") === "profissional" ? "profissional" : "essencial";

  // A new client is a new profile owned by this account (no login of its own).
  // The billing trigger forces plan 'free' on insert; paid activation happens
  // through the account's subscription (webhook) after checkout.
  const { data: profile, error } = await supabase
    .from("profiles")
    .insert({ account_id: user.id, handle, display_name: name })
    .select("id")
    .single();
  if (error || !profile) {
    return { error: error?.code === "23505" ? "Este endereço já está em uso." : "Não foi possível criar o cliente." };
  }

  const templateId = String(form.get("templateId") ?? "");
  const template = TEMPLATES.find((item) => item.id === templateId);
  const doc = template ? template.build(name) : defaultPageDoc(name);
  const { error: pageError } = await supabase.from("pages").insert({ owner_id: profile.id, draft: doc });
  if (pageError) return { error: "Não foi possível criar a página do cliente." };

  (await cookies()).set(CLIENT_COOKIE, profile.id, COOKIE_OPTS);
  if (paidSlot) redirect(`/dashboard/clientes/${profile.id}/assinar?plan=${plan}`);
  redirect("/dashboard");
}

export type DeleteClientState = { error?: string };

// Permanently deletes a managed client and everything that keys on it: page,
// published site, revisions, short links, events and captured contacts all
// cascade from the profile row. Cancels any active subscription first so the
// account stops being billed. Irreversible.
export async function deleteClient(
  clientId: string,
  _prev: DeleteClientState,
  form: FormData,
): Promise<DeleteClientState> {
  const { clients, accountId } = await getOwner();
  const client = clients.find((c) => c.id === clientId);
  if (!client) return { error: "Cliente não encontrado." };
  if (client.id === accountId) {
    return { error: "Esta é a sua página principal. Para excluí-la, use Configurações → Excluir conta." };
  }

  // Strong confirmation: the handle must be typed exactly.
  const typed = String(form.get("confirm") ?? "").trim().toLowerCase();
  if (typed !== client.handle.toLowerCase()) {
    return { error: `Digite exatamente "${client.handle}" para confirmar a exclusão.` };
  }

  const admin = createAdminClient();

  // Stop any billing tied to this client before removing it.
  const { data } = await admin.from("profiles").select("stripe_subscription_id").eq("id", clientId).maybeSingle();
  if (data?.stripe_subscription_id) {
    try {
      await cancelSubscription(data.stripe_subscription_id);
    } catch (error) {
      console.error("cancel subscription on delete failed", error);
    }
  }

  // Scoped to this account as defense in depth on top of the ownership check.
  const { error } = await admin.from("profiles").delete().eq("id", clientId).eq("account_id", accountId);
  if (error) return { error: "Não foi possível excluir o cliente. Tente de novo." };

  // Forget the selection if it pointed at the client just deleted.
  const cookieStore = await cookies();
  if (cookieStore.get(CLIENT_COOKIE)?.value === clientId) {
    cookieStore.set(CLIENT_COOKIE, "", { ...COOKIE_OPTS, maxAge: 0 });
  }

  revalidatePath("/dashboard/clientes");
  redirect("/dashboard/clientes?excluido=1");
}

// Cancels a client's subscription (if any) and drops it back to the free plan.
export async function cancelClientSubscription(clientId: string) {
  const { clients } = await getOwner();
  if (!clients.find((c) => c.id === clientId)) return;
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("stripe_subscription_id").eq("id", clientId).maybeSingle();
  if (data?.stripe_subscription_id) {
    try {
      await cancelSubscription(data.stripe_subscription_id);
    } catch (error) {
      console.error("cancel subscription failed", error);
    }
  }
  await admin.from("profiles").update({ plan: "free", stripe_subscription_id: null }).eq("id", clientId);
  revalidatePath("/dashboard/clientes");
}
