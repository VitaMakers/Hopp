import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Which client the dashboard is currently editing. An account can manage
// several; this cookie remembers the chosen one across requests.
export const CLIENT_COOKIE = "vb_client";

export type Client = {
  id: string;
  handle: string;
  display_name: string;
  plan: string;
  stripe_account_id: string | null;
};

// The account's clients plus the one currently selected. All dashboard reads
// and writes go through `profile`, so switching the cookie switches the whole
// panel to another client without touching any downstream query.
export const getOwner = cache(async () => {
  const supabase = await createClient();
  // Verify the session locally (asymmetric JWT) instead of a network round-trip
  // to the Auth server on every dashboard navigation. The middleware already
  // refreshed the cookie, so the claims read here are current and
  // signature-verified. On any verification hiccup (e.g. a JWKS fetch blip) we
  // fall back to the authoritative network check, so nobody is logged out by
  // mistake.
  let userId: string | undefined;
  let userEmail = "";
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsData?.claims?.sub) {
    userId = claimsData.claims.sub;
    userEmail = claimsData.claims.email ?? "";
  } else if (claimsError) {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    userId = authUser?.id;
    userEmail = authUser?.email ?? "";
  }
  if (!userId) redirect("/login");
  const user = { id: userId, email: userEmail };

  const { data: clients } = await supabase
    .from("profiles")
    .select("id, handle, display_name, plan, stripe_account_id")
    .eq("account_id", user.id)
    .order("created_at", { ascending: true });

  if (!clients || clients.length === 0) redirect("/onboarding");

  const selectedId = (await cookies()).get(CLIENT_COOKIE)?.value;
  const profile = clients.find((c) => c.id === selectedId) ?? clients[0];

  return { supabase, user, profile, clients, accountId: user.id };
});
