import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

// The app's own pages. Clients' pages are theirs to promote and are found
// through their own links.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.siteUrl().replace(/\/$/, "");
  return ["", "/precos", "/login", "/termos", "/privacidade"].map((path) => ({ url: `${base}${path}`, changeFrequency: "monthly", priority: path ? 0.5 : 1 }));
}
