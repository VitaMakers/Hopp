"use server";

import { redirect } from "next/navigation";
import { canUsePremium, planViolations } from "@/lib/entitlements";
import { defaultPageDoc } from "@/lib/page/catalog";
import { applyTemplateKeepingProfile, normalizeLegacyCover } from "@/lib/page/migrate";
import { pageDocSchema } from "@/lib/page/schema";
import { TEMPLATES } from "@/lib/page/templates";
import { getOwner } from "../context";

export type ApplyState = { error?: string };

// Applies a model to the client's DRAFT (never the live page): the blocks and
// the look come from the model; the owner's name, bio, photo, cover, socials,
// WhatsApp and SEO stay. "blank" starts an empty page keeping the name and SEO.
export async function applyModel(clientId: string, templateId: string): Promise<ApplyState> {
  const { supabase, clients } = await getOwner();
  const client = clients.find((c) => c.id === clientId);
  if (!client) return { error: "Este cliente não está mais na sua conta. Recarregue a página." };

  const { data: page } = await supabase.from("pages").select("draft").eq("owner_id", client.id).maybeSingle();
  const parsed = pageDocSchema.safeParse(page?.draft);
  const current = parsed.success ? parsed.data : defaultPageDoc(client.display_name || client.handle);
  const keepName = current.profile.name.trim() && current.profile.name !== "Adicione seu nome" ? current.profile.name : client.display_name || client.handle;

  let next;
  if (templateId === "blank") {
    const blank = defaultPageDoc(keepName);
    // A new design never drops what isn't design: SEO, pixels and the brand choice.
    next = { ...blank, seo: current.seo, integrations: current.integrations, hideBrand: current.hideBrand };
  } else {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (!template) return { error: "Modelo não encontrado." };
    if (template.plan === "premium" && !canUsePremium(client.plan)) {
      return { error: "Este modelo é do plano Essencial. Assine para usar." };
    }
    const built = template.build(keepName);
    if (planViolations(built, client.plan).length) {
      return { error: "Este modelo usa recursos de um plano pago (como vídeo de capa). Assine para usar." };
    }
    next = applyTemplateKeepingProfile(current, built);
  }

  const checked = pageDocSchema.safeParse(normalizeLegacyCover(next));
  if (!checked.success) return { error: "Não foi possível aplicar o modelo. Tente de novo." };
  const { error } = await supabase
    .from("pages")
    .update({ draft: checked.data, updated_at: new Date().toISOString() })
    .eq("owner_id", client.id);
  if (error) return { error: "Não foi possível salvar o modelo na sua página. Tente de novo." };
  redirect("/dashboard/editor?modelo=aplicado");
}
