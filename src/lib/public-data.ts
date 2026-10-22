import "server-only";
import { cache } from "react";
import { normalizeHandle } from "@/lib/handles";
import { pageDocSchema, type PageDoc } from "@/lib/page/schema";
import { createAdminClient } from "@/lib/supabase/server";

export type PublicPage = { ownerId: string; handle: string; plan: string; doc: PageDoc };

// Only the published version is ever read here; drafts stay private.
export const getPublishedPage = cache(async (rawHandle: string): Promise<PublicPage | null> => {
  const handle = normalizeHandle(decodeURIComponent(rawHandle));
  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, handle, plan")
    .eq("handle", handle)
    .maybeSingle();
  if (error) throw serverError(error);
  if (!profile) return null;
  const { data: page, error: pageError } = await admin
    .from("pages")
    .select("published")
    .eq("owner_id", profile.id)
    .maybeSingle();
  if (pageError) throw serverError(pageError);
  const parsed = pageDocSchema.safeParse(page?.published);
  if (!parsed.success) return null;
  return { ownerId: profile.id, handle: profile.handle, plan: profile.plan, doc: parsed.data };
});

export async function ownerIdForHandle(rawHandle: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("handle", normalizeHandle(rawHandle))
    .maybeSingle();
  if (error) throw serverError(error);
  return data?.id ?? null;
}

// A failed query (e.g. an invalid SUPABASE_SERVICE_ROLE_KEY) must not look
// like "page not found"; fail loudly so it shows up in the server logs.
function serverError(error: { message: string }) {
  return new Error(`Supabase (service role): ${error.message}`);
}
