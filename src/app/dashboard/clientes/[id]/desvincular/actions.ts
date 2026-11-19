"use server";

import { revalidatePath } from "next/cache";
import { cancelSubscriptionAtPeriodEnd } from "@/lib/payments/billing";
import { siteOrigin } from "@/lib/request";
import { createAdminClient } from "@/lib/supabase/server";
import { getOwner } from "../../../context";

// "invited": a new login was created and Supabase e-mailed the invite.
// "existing": the e-mail already had a Virtú.bio login; the page now shows up
// in that account the next time its owner signs in with their own password.
export type DetachState = { error?: string; ok?: boolean; email?: string; mode?: "invited" | "existing"; billing?: boolean };

// Transfer a client to the client's own account. The page, handle, stats and
// contacts stay (they key on the profile id, which doesn't change); only the
// managing account (profiles.account_id) is reassigned.
//
// Security: access is only ever delivered to the e-mail's inbox, by Supabase.
// The agency never receives a sign-in or password link, so typing someone
// else's e-mail can't give anyone access to that account.
export async function detachClient(clientId: string, _prev: DetachState, form: FormData): Promise<DetachState> {
  const { user, clients, accountId } = await getOwner();

  const client = clients.find((c) => c.id === clientId);
  if (!client) return { error: "Cliente não encontrado." };
  if (client.id === accountId) return { error: "Você não pode desvincular a sua própria página principal." };

  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Informe um e-mail válido do cliente." };
  if (email === (user.email ?? "").toLowerCase()) return { error: "Use o e-mail do cliente, não o seu." };

  const admin = createAdminClient();
  const redirectTo = `${await siteOrigin()}/auth/confirmar`;

  // New e-mail: Supabase creates the login and e-mails the invite itself.
  let userId: string | null = null;
  let mode: "invited" | "existing" = "invited";
  const invite = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
  if (!invite.error && invite.data?.user) {
    userId = invite.data.user.id;
  } else {
    // Already registered: find that login, without generating any link.
    const existing = await findUserIdByEmail(email);
    if (!existing) {
      console.error("detach invite failed", invite.error);
      return {
        error:
          "Não conseguimos enviar o convite para esse e-mail. Confira o endereço e tente de novo. Se continuar, o envio de e-mails da plataforma precisa ser configurado.",
      };
    }
    userId = existing;
    mode = "existing";
  }

  // The agency stops paying for this client at the end of the period already
  // paid; after that the new owner can subscribe from their own account.
  const { data: current } = await admin.from("profiles").select("stripe_subscription_id").eq("id", clientId).maybeSingle();
  let billing = false;
  if (current?.stripe_subscription_id) {
    try {
      await cancelSubscriptionAtPeriodEnd(current.stripe_subscription_id);
      billing = true;
    } catch (error) {
      console.error("detach cancel failed", error);
      return { error: "Não conseguimos encerrar a cobrança deste cliente no Stripe, então ele não foi transferido. Tente de novo em instantes." };
    }
  }

  const { error } = await admin.from("profiles").update({ account_id: userId }).eq("id", clientId).eq("account_id", accountId);
  if (error) return { error: "Não foi possível transferir o cliente." };

  revalidatePath("/dashboard/clientes");
  return { ok: true, email, mode, billing };
}

// Looks up an existing login by e-mail (paged admin listing; e-mails are
// stored lowercase).
async function findUserIdByEmail(email: string): Promise<string | null> {
  const admin = createAdminClient();
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return null;
    const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (hit) return hit.id;
    if (data.users.length < 200) return null;
  }
  return null;
}
