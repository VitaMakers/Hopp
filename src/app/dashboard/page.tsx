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
  return <Editor initialDoc={doc} handle={profile.handle} publishedAt={page?.published_at ?? null} />;
}
