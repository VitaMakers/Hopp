import Link from "next/link";
import { env } from "@/lib/env";
import { shortLinkLimit } from "@/lib/entitlements";
import { deleteShortLink } from "../actions";
import { getOwner } from "../context";
import { NewLinkForm } from "./NewLinkForm";

export default async function LinksPage() {
  const { supabase, profile } = await getOwner();
  const { data: links } = await supabase
    .from("short_links")
    .select("id, code, title, target_url, created_at")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false });
  const base = env.siteUrl();
  const limit = shortLinkLimit(profile.plan);
  const used = links?.length ?? 0;
  const full = used >= limit;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Links curtos</h1>
        <p className="text-sm text-stone-600">
          Links rastreáveis para divulgar em qualquer lugar. Os cliques aparecem em Estatísticas.
          {limit > 0 ? <span className="ml-1 font-medium text-stone-700">Usados {used} de {limit}.</span> : null}
        </p>
      </div>
      {limit === 0 ? (
        <div className="rounded-xl bg-stone-900 p-5 text-center text-white">
          <p className="font-semibold">Links curtos não estão no plano Grátis.</p>
          <p className="mt-1 text-sm text-stone-300">Tenha 3 no Essencial e 7 no Profissional.</p>
          <Link href="/dashboard/plans" className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-semibold text-stone-900">
            Ver planos
          </Link>
        </div>
      ) : full ? (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          Você atingiu o limite de {limit} links curtos do seu plano. Exclua um ou{" "}
          <Link href="/dashboard/plans" className="font-semibold underline">faça upgrade</Link>.
        </p>
      ) : (
        <NewLinkForm base={base} />
      )}
      <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-stone-200">
        <table className="w-full text-left text-sm">
          <thead className="text-stone-500">
            <tr>
              <th className="p-3 font-medium">Link</th>
              <th className="p-3 font-medium">Destino</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {(links ?? []).map((link) => (
              <tr key={link.id} className="border-t border-stone-100">
                <td className="p-3">
                  <div className="font-medium">{link.title || link.code}</div>
                  <div className="text-stone-500">
                    {base.replace(/^https?:\/\//, "")}/l/{link.code}
                  </div>
                </td>
                <td className="max-w-xs truncate p-3 text-stone-600">{link.target_url}</td>
                <td className="p-3 text-right">
                  <form action={deleteShortLink.bind(null, link.id)}>
                    <button type="submit" className="text-red-600">
                      Excluir
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {links?.length ? null : (
              <tr>
                <td colSpan={3} className="p-6 text-center text-stone-500">
                  Nenhum link curto ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
