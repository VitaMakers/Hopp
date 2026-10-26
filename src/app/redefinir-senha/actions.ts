"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UpdateState = { error?: string };

// Sets a new password for the session the recovery link opened. If that
// session is gone (expired or opened directly), ask for a fresh link.
export async function updatePassword(_: UpdateState, form: FormData): Promise<UpdateState> {
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  if (password.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };
  if (password !== confirm) return { error: "As senhas não coincidem." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Link expirado ou inválido. Peça um novo link de recuperação." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Não foi possível atualizar a senha. Tente novamente." };

  redirect("/dashboard");
}
