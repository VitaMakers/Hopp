import { formatBRL, PLAN_PRICE_BRL } from "@/lib/plans";
import { getOwner } from "../context";
import { ModelsGallery } from "./ModelsGallery";

export default async function ModelsPage({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { profile } = await getOwner();
  const { ver } = await searchParams;
  return (
    <ModelsGallery
      clientId={profile.id}
      plan={profile.plan}
      essencialPrice={formatBRL(PLAN_PRICE_BRL.essencial)}
      initial={ver}
    />
  );
}
