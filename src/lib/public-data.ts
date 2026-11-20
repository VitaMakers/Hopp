import "server-only";
import { cache } from "react";
import { normalizeHandle } from "@/lib/handles";
import { canUseForms, enforcePlan } from "@/lib/entitlements";
import { formBlockSchema, pageDocSchema, type PageDoc } from "@/lib/page/schema";
import { createAdminClient } from "@/lib/supabase/server";

export type PublicForm = { id: string; ownerId: string; config: ReturnType<typeof formBlockSchema.parse> };

// A standalone form read by its short code, for the public /f/[code] page and
// the submit route. Only published config is ever used. A form whose owner is
// no longer on a plan with forms reads as not found, so it stops collecting.
export const getFormByCode = cache(async (code: string): Promise<PublicForm | null> => {
  const admin = createAdminClient();
  const { data, error } = await admin.from("forms").select("id, owner_id, config").eq("code", code).maybeSingle();
  if (error) throw serverError(error);
  if (!data) return null;
  const parsed = formBlockSchema.safeParse(data.config);
  if (!parsed.success) return null;
  const { data: owner, error: ownerError } = await admin.from("profiles").select("plan").eq("id", data.owner_id).maybeSingle();
  if (ownerError) throw serverError(ownerError);
  if (!canUseForms(owner?.plan)) return null;
  return { id: data.id, ownerId: data.owner_id, config: parsed.data };
});

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
  return { ownerId: profile.id, handle: profile.handle, plan: profile.plan, doc: enforcePlan(parsed.data, profile.plan) };
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
