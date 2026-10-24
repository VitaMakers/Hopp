import type { Metadata } from "next";
import { APP_NAME } from "@/lib/env";
import { siteOrigin } from "@/lib/request";
// Self-hosted display fonts used by the page themes ("Elegante", "Impacto", "Técnica").
import "@fontsource/playfair-display/latin-400.css";
import "@fontsource/playfair-display/latin-700.css";
import "@fontsource/oswald/latin-500.css";
import "@fontsource/oswald/latin-700.css";
import "@fontsource/space-mono/latin-400.css";
import "@fontsource/space-mono/latin-700.css";
import "./globals.css";
import "./premium.css";

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(await siteOrigin()),
    title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
    description: "Sua página de link na bio: links, vídeos, captação de contatos e estatísticas.",
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
