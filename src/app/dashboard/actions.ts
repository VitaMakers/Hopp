"use server";

import { revalidatePath } from "next/cache";
import { safeHttpUrl, shortCodeError } from "@/lib/handles";
import { pageDocSchema } from "@/lib/page/schema";
import { getOwner } from "./context";

export type ActionResult = { ok: true; publishedAt?: string } | { ok: false; error: string };

export async function saveDraft(input: unknown): Promise<ActionResult> {
  const parsed = pageDocSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "A página tem campos inválidos." };
  const { supabase, profile } = await getOwner();
  const { data, error } = await supabase
    .from("pages")
    .update({ draft: parsed.data, updated_at: new Date().toISOString() })
    .eq("owner_id", profile.id)
    .select("id");
  // No error and no row means nothing was saved, so report it.
  return error || !data?.length ? { ok: false, error: "Não foi possível salvar." } : { ok: true };
}

export async function publish(input: unknown): Promise<ActionResult> {
  const parsed = pageDocSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "A página tem campos inválidos." };
  const { supabase, profile } = await getOwner();
  const now = new Date().toISOString();
  const { data: page, error } = await supabase
    .from("pages")
    .update({ draft: parsed.data, published: parsed.data, published_at: now, updated_at: now })
    .eq("owner_id", profile.id)
    .select("id")
    .single();
  if (error || !page) return { ok: false, error: "Não foi possível publicar." };
  await supabase.from("page_revisions").insert({ page_id: page.id, doc: parsed.data });
  revalidatePath(`/${profile.handle}`);
  return { ok: true, publishedAt: now };
}

export type LinkFormState = { error?: string; ok?: boolean };

export async function createShortLink(_: LinkFormState, form: FormData): Promise<LinkFormState> {
  const code = String(form.get("code") ?? "").trim();
  const title = String(form.get("title") ?? "").trim().slice(0, 120);
  const target = safeHttpUrl(String(form.get("target") ?? ""));
  const codeProblem = shortCodeError(code);
  if (codeProblem) return { error: codeProblem };
  if (!target) return { error: "Informe um destino que comece com http:// ou https://." };

  const { supabase, profile } = await getOwner();
  const { error } = await supabase
    .from("short_links")
    .insert({ owner_id: profile.id, code, title, target_url: target });
  if (error) {
    return { error: error.code === "23505" ? "Este código já está em uso." : "Não foi possível criar." };
  }
  revalidatePath("/dashboard/links");
  return { ok: true };
}

export async function deleteShortLink(id: string) {
  const { supabase } = await getOwner();
  await supabase.from("short_links").delete().eq("id", id);
  revalidatePath("/dashboard/links");
}

export async function deleteContact(id: string) {
  const { supabase } = await getOwner();
  await supabase.from("contacts").delete().eq("id", id);
  revalidatePath("/dashboard/contacts");
}
