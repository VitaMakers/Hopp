"use server";

import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

function credentials(form: FormData) {
  return {
    email: String(form.get("email") ?? "").trim(),
    password: String(form.get("password") ?? ""),
  };
}

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials(form));
  if (error) return { error: "E-mail ou senha incorretos." };
  redirect("/dashboard");
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const { email, password } = credentials(form);
  if (password.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${env.siteUrl()}/auth/callback` },
  });
  if (error) return { error: "Não foi possível criar a conta. Confira o e-mail e tente de novo." };
  // With e-mail confirmation on, there is no session until the link is clicked.
  if (!data.session) return { message: "Enviamos um link de confirmação para o seu e-mail." };
  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
