"use client";

import { imageSrc } from "@/lib/page/links";
import type { PageDoc } from "@/lib/page/schema";
import { SocialIcon } from "@/components/page-view/SocialIcon";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

// A profile summary at the top of the editor (avatar, name, bio and the
// connected social icons), like a link-in-bio header. Clicking it opens the
// Perfil section so it doubles as a shortcut to edit the profile.
export function ProfileHeader({ doc, onEdit }: { doc: PageDoc; onEdit: () => void }) {
  const { profile, socials } = doc;
  const avatar = imageSrc(profile.avatarUrl);

  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label="Editar perfil"
      className="group w-full rounded-2xl bg-white p-4 text-left ring-1 ring-stone-200 transition hover:ring-blue-400"
    >
      <div className="flex items-start gap-3">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-stone-900 text-lg font-semibold text-white">
            {initials(profile.name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-stone-900">{profile.name || "Seu nome"}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-stone-500">
            {profile.bio || "Escreva uma bio curta sobre você ou seu negócio."}
          </p>
        </div>
        <span className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-stone-500 ring-1 ring-stone-200 transition group-hover:text-blue-600 group-hover:ring-blue-300">
          Editar
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {socials.map((social, index) => (
          <span
            key={index}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-700"
          >
            <SocialIcon platform={social.platform} className="h-[18px] w-[18px]" />
          </span>
        ))}
        <span className="flex h-9 items-center gap-1 rounded-full border border-dashed border-stone-300 px-3 text-xs font-medium text-stone-500">
          {socials.length ? "+ rede social" : "+ Adicionar redes sociais"}
        </span>
      </div>
    </button>
  );
}
