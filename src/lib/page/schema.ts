import { z } from "zod";

// A page is one JSON document: profile header + typed blocks + theme.
// The editor saves it as a draft; publishing copies it to the public version.

export const SOCIAL_PLATFORMS = [
  "instagram",
  "tiktok",
  "youtube",
  "facebook",
  "x",
  "linkedin",
  "threads",
  "pinterest",
  "spotify",
  "whatsapp",
  "telegram",
  "email",
  "website",
] as const;

export const socialLinkSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
  url: z.string().max(500),
});

const blockBase = {
  id: z.string().min(1).max(64),
  enabled: z.boolean(),
};

export const linkBlockSchema = z.object({
  ...blockBase,
  type: z.literal("link"),
  title: z.string().max(120),
  url: z.string().max(2000),
});

export const headingBlockSchema = z.object({
  ...blockBase,
  type: z.literal("heading"),
  text: z.string().max(120),
});

export const textBlockSchema = z.object({
  ...blockBase,
  type: z.literal("text"),
  text: z.string().max(4000),
});

export const youtubeBlockSchema = z.object({
  ...blockBase,
  type: z.literal("youtube"),
  url: z.string().max(500),
});

export const spotifyBlockSchema = z.object({
  ...blockBase,
  type: z.literal("spotify"),
  url: z.string().max(500),
});

export const faqBlockSchema = z.object({
  ...blockBase,
  type: z.literal("faq"),
  title: z.string().max(120),
  items: z
    .array(z.object({ question: z.string().max(300), answer: z.string().max(2000) }))
    .max(30),
});

export const countdownBlockSchema = z.object({
  ...blockBase,
  type: z.literal("countdown"),
  title: z.string().max(120),
  endsAt: z.string().max(40),
});

export const subscribeBlockSchema = z.object({
  ...blockBase,
  type: z.literal("subscribe"),
  title: z.string().max(120),
  buttonText: z.string().max(40),
  collectPhone: z.boolean(),
  thankYouMessage: z.string().max(300),
});

export const blockSchema = z.discriminatedUnion("type", [
  linkBlockSchema,
  headingBlockSchema,
  textBlockSchema,
  youtubeBlockSchema,
  spotifyBlockSchema,
  faqBlockSchema,
  countdownBlockSchema,
  subscribeBlockSchema,
]);

export const BUTTON_SHAPES = ["square", "rounded", "pill"] as const;
export const BUTTON_STYLES = ["fill", "outline", "soft"] as const;
export const FONTS = ["sans", "serif", "mono", "rounded"] as const;
export const LAYOUTS = ["classic", "cover"] as const;

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const themeSchema = z.object({
  layout: z.enum(LAYOUTS),
  font: z.enum(FONTS),
  background: color,
  text: color,
  buttonBackground: color,
  buttonText: color,
  buttonShape: z.enum(BUTTON_SHAPES),
  buttonStyle: z.enum(BUTTON_STYLES),
});

export const pageDocSchema = z.object({
  version: z.literal(1),
  profile: z.object({
    name: z.string().max(80),
    bio: z.string().max(300),
    avatarUrl: z.string().max(1000),
    coverUrl: z.string().max(1000),
  }),
  socials: z.array(socialLinkSchema).max(20),
  blocks: z.array(blockSchema).max(100),
  theme: themeSchema,
  seo: z.object({
    title: z.string().max(70),
    description: z.string().max(160),
  }),
});

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];
export type SocialLink = z.infer<typeof socialLinkSchema>;
export type Block = z.infer<typeof blockSchema>;
export type BlockType = Block["type"];
export type Theme = z.infer<typeof themeSchema>;
export type PageDoc = z.infer<typeof pageDocSchema>;
