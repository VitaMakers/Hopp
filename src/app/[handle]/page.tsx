import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandBar } from "@/components/page-view/BrandBar";
import { Integrations } from "@/components/page-view/Integrations";
import { PageView } from "@/components/page-view/PageView";
import { APP_NAME, APP_TAGLINE, env } from "@/lib/env";
import { showsBadge, showsBrandBar } from "@/lib/entitlements";
import { getPublishedPage } from "@/lib/public-data";

type Params = { params: Promise<{ handle: string }> };

// Serve the published page from cache instead of hitting the database on every
// visit. Publishing already revalidates this path on demand, so edits still
// show immediately; this revalidate is just a safety refresh.
export const revalidate = 300;
// Pages are not known at build time: each one is rendered on its first visit
// and then served from cache until it is published again or the refresh above.
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const page = await getPublishedPage((await params).handle);
  if (!page) return { title: "Página não encontrada" };
  const { profile, seo } = page.doc;
  const title = seo.title || profile.name || `@${page.handle}`;
  const description = seo.description || profile.bio || undefined;
  const images = profile.avatarUrl ? [profile.avatarUrl] : undefined;
  return {
    title,
    description,
    openGraph: { title, description, images, type: "profile" },
    twitter: { card: "summary", title, description, images },
  };
}

export default async function PublicPage({ params }: Params) {
  const page = await getPublishedPage((await params).handle);
  if (!page) notFound();
  return (
    <>
    <Integrations ids={page.doc.integrations} />
    <PageView
      doc={page.doc}
      handle={page.handle}
      plan={page.plan}
      footer={
        showsBadge(page.plan) ? (
          <Link href="/" className="mt-12 flex flex-col items-center gap-0.5 text-center opacity-70 transition hover:opacity-100">
            <span className="text-sm font-semibold">{APP_NAME}</span>
            <span className="text-xs">{APP_TAGLINE}</span>
          </Link>
        ) : null
      }
    />
    {showsBrandBar(page.doc, page.plan) ? (
      <BrandBar top={!page.doc.theme.premium} appName={APP_NAME} siteUrl={env.siteUrl()} title={page.doc.seo.title || page.doc.profile.name || `@${page.handle}`} />
    ) : null}
    </>
  );
}
