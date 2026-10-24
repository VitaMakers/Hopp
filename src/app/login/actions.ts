"use server";

import { redirect } from "next/navigation";
import { siteOrigin } from "@/lib/request";
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

// Supabase auth error codes worth telling apart; anything else stays generic.
const SIGN_UP_ERRORS: Record<string, string> = {
  email_address_invalid: "Este e-mail não é aceito. Use outro endereço.",
  user_already_exists: "Já existe uma conta com este e-mail. Entre com a sua senha.",
  email_exists: "Já existe uma conta com este e-mail. Entre com a sua senha.",
  weak_password: "Senha fraca. Use uma senha mais longa ou variada.",
  over_email_send_rate_limit: "Muitos cadastros em pouco tempo. Tente de novo em alguns minutos.",
  over_request_rate_limit: "Muitas tentativas. Tente de novo em alguns minutos.",
  signup_disabled: "Novos cadastros estão desativados no momento.",
};

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const { email, password } = credentials(form);
  if (password.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/callback` },
  });
  if (error) {
    console.error("signUp failed:", error.code, error.message);
    return {
      error:
        SIGN_UP_ERRORS[error.code ?? ""] ?? "Não foi possível criar a conta. Confira o e-mail e tente de novo.",
    };
  }
  // With e-mail confirmation on, there is no session until the link is clicked.
  if (!data.session) return { message: "Enviamos um link de confirmação para o seu e-mail." };
  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
