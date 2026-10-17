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
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="4" fill="currentColor" />
        <g fill="var(--page-bg, #fff)">
          <rect x="6" y="10" width="2.6" height="8" />
          <circle cx="7.3" cy="6.9" r="1.5" />
          <path d="M10.6 10h2.5v1.2c.5-.8 1.5-1.4 2.8-1.4 2.2 0 3.1 1.4 3.1 3.6V18h-2.6v-4.2c0-1.1-.3-1.9-1.4-1.9s-1.8.8-1.8 2V18h-2.6z" />
        </g>
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
