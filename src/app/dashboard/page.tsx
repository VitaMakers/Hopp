import { defaultPageDoc } from "@/lib/page/catalog";
import { pageDocSchema } from "@/lib/page/schema";
import { Editor } from "@/components/editor/Editor";
import { getOwner } from "./context";

export default async function EditorPage() {
  const { supabase, profile } = await getOwner();
  const { data: page } = await supabase
    .from("pages")
    .select("draft, published_at")
    .eq("owner_id", profile.id)
    .maybeSingle();
  const parsed = pageDocSchema.safeParse(page?.draft);
  const doc = parsed.success ? parsed.data : defaultPageDoc(profile.display_name || profile.handle);
  // Onboarding writes the profile and the page separately; if the second
  // write failed, create the page now so saving and publishing have a row.
  if (!page) await supabase.from("pages").insert({ owner_id: profile.id, draft: doc });
  return <Editor initialDoc={doc} handle={profile.handle} publishedAt={page?.published_at ?? null} />;
}
