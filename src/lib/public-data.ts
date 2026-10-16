import "server-only";
import { cache } from "react";
import { normalizeHandle } from "@/lib/handles";
import { pageDocSchema, type PageDoc } from "@/lib/page/schema";
import { createAdminClient } from "@/lib/supabase/server";

export type PublicPage = { ownerId: string; handle: string; doc: PageDoc };

// Only the published version is ever read here; drafts stay private.
export const getPublishedPage = cache(async (rawHandle: string): Promise<PublicPage | null> => {
  const handle = normalizeHandle(decodeURIComponent(rawHandle));
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, handle")
    .eq("handle", handle)
    .maybeSingle();
  if (!profile) return null;
  const { data: page } = await admin
    .from("pages")
    .select("published")
    .eq("owner_id", profile.id)
    .maybeSingle();
  const parsed = pageDocSchema.safeParse(page?.published);
  if (!parsed.success) return null;
  return { ownerId: profile.id, handle: profile.handle, doc: parsed.data };
});

export async function ownerIdForHandle(rawHandle: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("handle", normalizeHandle(rawHandle))
    .maybeSingle();
  return data?.id ?? null;
}
