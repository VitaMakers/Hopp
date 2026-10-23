import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageView } from "@/components/page-view/PageView";
import { APP_NAME, APP_TAGLINE } from "@/lib/env";
import { showsBadge } from "@/lib/entitlements";
import { getPublishedPage } from "@/lib/public-data";

type Params = { params: Promise<{ handle: string }> };

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
    <PageView
      doc={page.doc}
      handle={page.handle}
      footer={
        showsBadge(page.plan) ? (
          <Link href="/" className="mt-12 flex flex-col items-center gap-0.5 text-center opacity-70 transition hover:opacity-100">
            <span className="text-sm font-semibold">{APP_NAME}</span>
            <span className="text-xs">{APP_TAGLINE}</span>
          </Link>
        ) : null
      }
    />
  );
}
