"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Landing page of the invite e-mail a client receives when an agency hands a
// page over to them. Supabase puts the session in the URL hash (#access_token)
// for invites, which only the browser can read; older or customised e-mails may
// send ?token_hash=&type= instead. Either way the person proves they own the
// e-mail, gets a session, and goes on to create their password.
export default function ConfirmInvite() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);

    async function run() {
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const tokenHash = query.get("token_hash");
      const type = query.get("type");

      let ok = false;
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        ok = !error;
      } else if (tokenHash && (type === "invite" || type === "recovery" || type === "magiclink" || type === "email")) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        ok = !error;
      }
      // Drop the tokens from the address bar either way.
      window.history.replaceState(null, "", window.location.pathname);
      if (ok) window.location.replace("/redefinir-senha");
      else setFailed(true);
    }
    void run();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-5">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center ring-1 ring-stone-200">
        {failed ? (
          <>
            <h1 className="text-xl font-bold text-stone-900">Este link não vale mais</h1>
            <p className="mt-2 text-sm text-stone-600">
              Links de acesso expiram e só podem ser usados uma vez. Peça um novo em “Esqueci minha senha” usando o mesmo e-mail.
            </p>
            <Link href="/recuperar-senha" className="btn-primary mt-5 inline-block w-full">
              Pedir um novo link
            </Link>
          </>
        ) : (
          <p className="text-sm text-stone-600">Confirmando seu acesso…</p>
        )}
      </div>
    </main>
  );
}
