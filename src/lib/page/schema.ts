import { z } from "zod";

// A page is one JSON document: profile header + typed blocks + theme.
// The editor saves it as a draft; publishing copies it to the public version.
// Fields added after launch have defaults, so pages saved earlier still parse.

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
  imageUrl: z.string().max(1000).default(""),
  highlight: z.boolean().default(false),
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

export const whatsappBlockSchema = z.object({
  ...blockBase,
  type: z.literal("whatsapp"),
  phone: z.string().max(30),
  message: z.string().max(500),
  buttonText: z.string().max(60),
});

export const imageBlockSchema = z.object({
  ...blockBase,
  type: z.literal("image"),
  imageUrl: z.string().max(1000),
  alt: z.string().max(200),
  url: z.string().max(2000),
});

export const productBlockSchema = z.object({
  ...blockBase,
  type: z.literal("product"),
  title: z.string().max(120),
  description: z.string().max(500),
  price: z.string().max(40),
  imageUrl: z.string().max(1000),
  buttonText: z.string().max(40),
  url: z.string().max(2000),
});

export const mapBlockSchema = z.object({
  ...blockBase,
  type: z.literal("map"),
  title: z.string().max(120),
  address: z.string().max(300),
});

export const contactBlockSchema = z.object({
  ...blockBase,
  type: z.literal("contact"),
  name: z.string().max(80),
  company: z.string().max(80),
  phone: z.string().max(30),
  email: z.string().max(120),
  buttonText: z.string().max(40),
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
  whatsappBlockSchema,
  imageBlockSchema,
  productBlockSchema,
  mapBlockSchema,
  contactBlockSchema,
]);

export const BUTTON_SHAPES = ["square", "rounded", "pill"] as const;
export const BUTTON_STYLES = ["fill", "outline", "soft"] as const;
export const FONTS = ["sans", "serif", "mono", "rounded"] as const;
export const LAYOUTS = ["classic", "cover", "card", "hero"] as const;
export const BACKGROUND_TYPES = ["solid", "gradient", "image"] as const;
export const AVATAR_SHAPES = ["circle", "rounded", "square"] as const;
export const SOCIAL_STYLES = ["icons", "pills"] as const;

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
  buttonShadow: z.boolean().default(false),
  backgroundType: z.enum(BACKGROUND_TYPES).default("solid"),
  background2: color.default("#d6d3d1"),
  backgroundImageUrl: z.string().max(1000).default(""),
  avatarShape: z.enum(AVATAR_SHAPES).default("circle"),
  socialStyle: z.enum(SOCIAL_STYLES).default("icons"),
});

export const pageDocSchema = z.object({
  version: z.literal(1),
  profile: z.object({
    name: z.string().max(80),
    bio: z.string().max(300),
    avatarUrl: z.string().max(1000),
    coverUrl: z.string().max(1000),
    verified: z.boolean().default(false),
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
