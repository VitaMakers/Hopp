import type { SocialPlatform } from "@/lib/page/schema";
import { SOCIAL_ICON_PATHS } from "./social-icons";

export function SocialIcon({ platform, className }: { platform: SocialPlatform; className?: string }) {
  const path = SOCIAL_ICON_PATHS[platform];
  if (path) {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path fill="currentColor" d={path} />
      </svg>
    );
  }
  if (platform === "linkedin") {
    return (
      // The letters are cut out of the square, so the icon works on any background.
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M6 2h12a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4zM6 10v8h2.6v-8zM7.3 5.4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM10.6 10v8h2.6v-4.2c0-1.2.6-2 1.8-2s1.4.8 1.4 1.9V18H19v-4.6c0-2.2-.9-3.6-3.1-3.6-1.3 0-2.3.6-2.8 1.4V10z"
        />
      </svg>
    );
  }
  // E-mail and site: outline glyphs.
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {platform === "email" ? (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 3.6 5.7 3.6 9s-1.1 6.3-3.6 9c-2.5-2.7-3.6-5.7-3.6-9S9.5 5.7 12 3z" />
        </>
      )}
    </svg>
  );
}
