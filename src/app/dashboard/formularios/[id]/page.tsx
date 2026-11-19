import { notFound, redirect } from "next/navigation";
import { canUseForms } from "@/lib/entitlements";
import { formBlockSchema } from "@/lib/page/schema";
import { getOwner } from "../../context";
import { FormBuilder } from "./FormBuilder";

export default async function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile } = await getOwner();
  if (!canUseForms(profile.plan)) redirect("/dashboard/formularios");
  const { data } = await supabase.from("forms").select("id, code, config").eq("id", id).maybeSingle();
  if (!data) notFound();
  const parsed = formBlockSchema.safeParse(data.config);
  if (!parsed.success) notFound();
  return <FormBuilder id={data.id as string} code={data.code as string} initialConfig={parsed.data} />;
}
