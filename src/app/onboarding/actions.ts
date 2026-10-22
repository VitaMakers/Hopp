"use server";

import { redirect } from "next/navigation";
import { handleError, normalizeHandle } from "@/lib/handles";
import { defaultPageDoc } from "@/lib/page/catalog";
import { TEMPLATES } from "@/lib/page/templates";
import { requireUser } from "@/lib/supabase/server";

export type OnboardingState = { error?: string };

export async function createProfile(_: OnboardingState, form: FormData): Promise<OnboardingState> {
  const { supabase, user } = await requireUser();
  if (!user) redirect("/login");

  const handle = normalizeHandle(String(form.get("handle") ?? ""));
  const name = String(form.get("name") ?? "").trim().slice(0, 80) || handle;
  const invalid = handleError(handle);
  if (invalid) return { error: invalid };

  // The first site is self-managed: id and account are the same login.
  const { error } = await supabase
    .from("profiles")
    .insert({ id: user.id, account_id: user.id, handle, display_name: name });
  if (error) {
    // 23505: unique violation, i.e. the handle is taken (or the profile exists).
    return { error: error.code === "23505" ? "Este endereço já está em uso." : "Não foi possível salvar." };
  }
  const templateId = String(form.get("templateId") ?? "");
  const template = TEMPLATES.find((item) => item.id === templateId);
  const doc = template ? template.build(name) : defaultPageDoc(name);
  const { error: pageError } = await supabase.from("pages").insert({ owner_id: user.id, draft: doc });
  if (pageError) return { error: "Não foi possível criar a sua página." };
  redirect("/dashboard");
}
