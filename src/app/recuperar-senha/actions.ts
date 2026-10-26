"use server";

import { siteOrigin } from "@/lib/request";
import { createClient } from "@/lib/supabase/server";

export type ResetState = { error?: string; message?: string };

// Sends the password-recovery e-mail. The link lands on the auth callback,
// which trades the code for a short-lived session and forwards to the page
// where the user types a new password.
export async function requestReset(_: ResetState, form: FormData): Promise<ResetState> {
  const email = String(form.get("email") ?? "").trim();
  if (!email) return { error: "Informe o seu e-mail." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/redefinir-senha`,
  });
  // Never reveal whether an account exists for this address.
  if (error) console.error("resetPasswordForEmail failed:", error.code, error.message);
  return { message: "Se existir uma conta com este e-mail, enviamos um link para redefinir a senha." };
}
