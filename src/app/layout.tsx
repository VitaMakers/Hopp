import type { Metadata } from "next";
import { APP_NAME, env } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl()),
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: "Sua página de link na bio: links, vídeos, captação de contatos e estatísticas.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
