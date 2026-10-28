"use server";

import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FORM_PRESETS } from "@/lib/page/catalog";
import { formBlockSchema } from "@/lib/page/schema";
import { getOwner } from "../context";

// Creates a form from a preset and opens its editor. The id is generated here
// so we don't depend on a select-after-insert (which RLS can block).
export async function createForm(presetId: string) {
  const { supabase, profile } = await getOwner();
  const preset = FORM_PRESETS.find((p) => p.id === presetId) ?? FORM_PRESETS[0];
  const id = crypto.randomUUID();
  const { error } = await supabase
    .from("forms")
    .insert({ id, owner_id: profile.id, code: nanoid(8), config: preset.build() });
  if (error) throw new Error(`Não foi possível criar o formulário: ${error.message}`);
  revalidatePath("/dashboard/formularios");
  redirect(`/dashboard/formularios/${id}`);
}

export type SaveFormState = { ok?: boolean; error?: string };

export async function saveFormConfig(id: string, config: unknown): Promise<SaveFormState> {
  const parsed = formBlockSchema.safeParse(config);
  if (!parsed.success) return { error: "Formulário inválido." };
  const { supabase } = await getOwner();
  const { data, error } = await supabase.from("forms").update({ config: parsed.data }).eq("id", id).select("id");
  if (error || !data?.length) return { error: "Não foi possível salvar." };
  revalidatePath("/dashboard/formularios");
  return { ok: true };
}

export async function deleteForm(id: string) {
  const { supabase } = await getOwner();
  await supabase.from("forms").delete().eq("id", id);
  revalidatePath("/dashboard/formularios");
  redirect("/dashboard/formularios");
}

export async function deleteResponse(formId: string, id: string) {
  const { supabase } = await getOwner();
  await supabase.from("form_responses").delete().eq("id", id);
  revalidatePath(`/dashboard/formularios/${formId}/respostas`);
}
