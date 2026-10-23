"use server";

import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/server";
import { getOwner } from "../../../context";

export type DetachState = { error?: string; ok?: boolean; link?: string; email?: string };

// Transfer a client to the client's own account. The page, handle, stats and
// contacts stay (they key on the profile id, which doesn't change); only the
// managing account (profiles.account_id) is reassigned. The client gets a link
// to log in / set a password, which the agency sends them.
export async function detachClient(clientId: string, _prev: DetachState, form: FormData): Promise<DetachState> {
  const { user, clients, accountId } = await getOwner();

  const client = clients.find((c) => c.id === clientId);
  if (!client) return { error: "Cliente não encontrado." };
  if (client.id === accountId) return { error: "Você não pode desvincular a sua própria página principal." };

  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) return { error: "Informe um e-mail válido do cliente." };
  if (email === (user.email ?? "").toLowerCase()) return { error: "Use o e-mail do cliente, não o seu." };

  const admin = createAdminClient();
  const redirectTo = `${env.siteUrl()}/auth/callback`;

  // Create the client's login, or reuse it if the e-mail already has one.
  let userId: string | null = null;
  let link: string | undefined;
  const invite = await admin.auth.admin.generateLink({ type: "invite", email, options: { redirectTo } });
  if (!invite.error && invite.data?.user) {
    userId = invite.data.user.id;
    link = invite.data.properties?.action_link;
  } else {
    // Already registered: a recovery link lets them set a new password and enter.
    const recovery = await admin.auth.admin.generateLink({ type: "recovery", email, options: { redirectTo } });
    if (recovery.error || !recovery.data?.user) {
      return { error: "Não foi possível preparar o acesso do cliente. Confira o e-mail e tente de novo." };
    }
    userId = recovery.data.user.id;
    link = recovery.data.properties?.action_link;
  }
  if (!userId) return { error: "Não foi possível criar o acesso do cliente." };

  const { error } = await admin.from("profiles").update({ account_id: userId }).eq("id", clientId);
  if (error) return { error: "Não foi possível transferir o cliente." };

  return { ok: true, link, email };
}
