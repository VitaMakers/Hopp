"use server";

import { revalidatePath } from "next/cache";
import { attachDomain, detachDomain, domainError, normalizeDomain } from "@/lib/domains";
import { canUseCustomDomain } from "@/lib/entitlements";
import { createAdminClient } from "@/lib/supabase/server";
import { getOwner } from "../context";

export type DomainState = { error?: string; ok?: string };

// Points a domain of the client's own at their page. Only the server writes
// this field, after checking the plan and that nobody else uses the domain.
export async function saveDomain(clientId: string, _: DomainState, form: FormData): Promise<DomainState> {
  const { clients } = await getOwner();
  const client = clients.find((c) => c.id === clientId);
  if (!client) return { error: "Este cliente não está mais na sua conta." };
  if (!canUseCustomDomain(client.plan)) return { error: "Domínio próprio está disponível no plano Profissional." };

  const domain = normalizeDomain(String(form.get("domain") ?? ""));
  const invalid = domainError(domain);
  if (invalid) return { error: invalid };

  const admin = createAdminClient();
  const { data: current } = await admin.from("profiles").select("custom_domain").eq("id", client.id).maybeSingle();
  const { data: other } = await admin.from("profiles").select("id").ilike("custom_domain", domain).neq("id", client.id).limit(1);
  if (other?.length) return { error: "Este domínio já está em uso em outra página." };

  const attached = await attachDomain(domain);
  if (attached === "taken") return { error: "Este domínio já está ligado a outro site. Remova-o de lá antes de usar aqui." };
  if (attached === "error") return { error: "Não conseguimos registrar o domínio agora. Tente de novo em instantes." };

  const { error } = await admin.from("profiles").update({ custom_domain: domain }).eq("id", client.id);
  if (error) return { error: "Não foi possível salvar o domínio." };
  if (current?.custom_domain && current.custom_domain !== domain) await detachDomain(current.custom_domain);

  revalidatePath("/dashboard/settings");
  return {
    ok: attached === "manual" ? "Domínio salvo. Falta a ativação do lado do Virtú.bio; assim que for feita, ele passa a abrir a sua página." : "Domínio salvo. Agora crie o registro de DNS abaixo.",
  };
}

export async function removeDomain(clientId: string): Promise<void> {
  const { clients } = await getOwner();
  const client = clients.find((c) => c.id === clientId);
  if (!client) return;
  const admin = createAdminClient();
  const { data: current } = await admin.from("profiles").select("custom_domain").eq("id", client.id).maybeSingle();
  if (!current?.custom_domain) return;
  await admin.from("profiles").update({ custom_domain: null }).eq("id", client.id);
  await detachDomain(current.custom_domain);
  revalidatePath("/dashboard/settings");
}
