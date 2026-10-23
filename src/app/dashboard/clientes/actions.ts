"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { handleError, normalizeHandle } from "@/lib/handles";
import { defaultPageDoc } from "@/lib/page/catalog";
import { TEMPLATES } from "@/lib/page/templates";
import { FREE_CLIENTS } from "@/lib/plans";
import { requireUser } from "@/lib/supabase/server";
import { CLIENT_COOKIE } from "../context";

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
