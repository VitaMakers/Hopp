"use server";

import { redirect } from "next/navigation";
import { createAdminClient, createClient, requireUser } from "@/lib/supabase/server";

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
  const { error } = await createAdminClient().auth.admin.deleteUser(user.id);
  if (error) return { error: "Não foi possível excluir a conta. Tente de novo." };
  await supabase.auth.signOut();
  redirect("/");
}
