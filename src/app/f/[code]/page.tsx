import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormView } from "@/components/page-view/FormView";
import { getFormByCode } from "@/lib/public-data";

type Params = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const form = await getFormByCode((await params).code);
  return { title: form?.config.title || "Formulário" };
}

export default async function PublicFormPage({ params }: Params) {
  const form = await getFormByCode((await params).code);
  if (!form) notFound();
  return <FormView config={form.config} code={(await params).code} />;
}
