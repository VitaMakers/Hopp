import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { ResetForm } from "./ResetForm";

// Reached from the recovery e-mail (via /auth/callback), where the code has
// already been traded for a session. Without that session the link is stale.
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
        <div>
          <p className="text-lg font-bold text-stone-900">{APP_NAME}</p>
          <p className="text-sm text-stone-500">{APP_TAGLINE}</p>
        </div>
        <h1 className="mt-5 text-2xl font-bold text-stone-900">Nova senha</h1>
        {user ? (
          <>
            <p className="mt-2 text-sm text-stone-600">Digite a sua nova senha abaixo.</p>
            <ResetForm />
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-stone-600">
              Este link expirou ou já foi usado. Peça um novo link de recuperação.
            </p>
            <Link href="/recuperar-senha" className="btn-primary mt-6 block text-center">
              Pedir novo link
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
