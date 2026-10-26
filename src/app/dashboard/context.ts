import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";

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
  const { supabase, user } = await requireUser();
  if (!user) redirect("/login");

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
