// Plain constants the public page needs. They live apart from the schema so a
// visitor's browser doesn't download the validation library just to read them.
import type { SocialPlatform } from "./schema";

export const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  facebook: "Facebook",
  x: "X",
  linkedin: "LinkedIn",
  threads: "Threads",
  pinterest: "Pinterest",
  spotify: "Spotify",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  email: "E-mail",
  website: "Site",
};

// Form blocks that show something but don't collect an answer.
export const FORM_DISPLAY_TYPES = ["header", "image", "video"] as const;
