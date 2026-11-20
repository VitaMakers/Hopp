"use server";

import { redirect } from "next/navigation";
import { stripePriceId } from "@/lib/env";
import { changeSubscriptionPlan, subscriptionBelongsTo, subscriptionIsLive } from "@/lib/payments/billing";
import { createAdminClient } from "@/lib/supabase/server";
import { getOwner } from "../context";

// Moves a client's existing subscription to another paid plan. It runs as a
// form action, not a link, so another site can't trigger it, and only for a
// subscription this account opened.
export async function switchPlan(clientId: string, plan: "essencial" | "profissional") {
  const { user, clients } = await getOwner();
  const client = clients.find((c) => c.id === clientId);
  if (!client || (plan !== "essencial" && plan !== "profissional")) redirect("/dashboard/plans");

  const admin = createAdminClient();
  const { data: current } = await admin.from("profiles").select("stripe_subscription_id").eq("id", client.id).maybeSingle();
  const subscriptionId = current?.stripe_subscription_id;
  let changed = false;
  try {
    if (subscriptionId && (await subscriptionIsLive(subscriptionId)) && (await subscriptionBelongsTo(subscriptionId, user.id))) {
      await changeSubscriptionPlan(subscriptionId, stripePriceId(plan), plan);
      await admin.from("profiles").update({ plan }).eq("id", client.id);
      changed = true;
    }
  } catch (error) {
    console.error("switch plan failed", error);
    redirect("/dashboard/clientes?erro=cobranca");
  }
  // No subscription of this account to change: start a checkout instead.
  redirect(changed ? `/dashboard/plans?plano=${plan}` : `/dashboard/clientes/${client.id}/assinar?plan=${plan}`);
}
