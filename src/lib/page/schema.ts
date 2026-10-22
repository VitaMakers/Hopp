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
  // Which audience sees this block in the "experience" premium design that
  // has a "Sou paciente / Sou dentista"-style toggle. Absent = everyone.
  audience: z.enum(["all", "a", "b"]).optional(),
};

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
// Empty means "use the theme's accent".
const optionalColor = z.union([color, z.literal("")]).default("");

export const LINK_DISPLAYS = ["button", "banner", "card"] as const;
export const HEADING_STYLES = ["plain", "divider", "section", "display", "badge"] as const;
export const TEXT_STYLES = ["plain", "quote", "footer"] as const;

export const linkBlockSchema = z.object({
  ...blockBase,
  type: z.literal("link"),
  title: z.string().max(120),
  url: z.string().max(2000),
  imageUrl: z.string().max(1000).default(""),
  highlight: z.boolean().default(false),
  // Banner: image behind the text. Card: label, title, subtitle and an arrow.
  display: z.enum(LINK_DISPLAYS).default("button"),
  label: z.string().max(40).default(""),
  subtitle: z.string().max(200).default(""),
  buttonText: z.string().max(40).default(""),
  accent: optionalColor,
});

export const headingBlockSchema = z.object({
  ...blockBase,
  type: z.literal("heading"),
  text: z.string().max(120),
  style: z.enum(HEADING_STYLES).default("plain"),
});

export const textBlockSchema = z.object({
  ...blockBase,
  type: z.literal("text"),
  text: z.string().max(4000),
  style: z.enum(TEXT_STYLES).default("plain"),
  title: z.string().max(200).default(""),
});

export const statsBlockSchema = z.object({
  ...blockBase,
  type: z.literal("stats"),
  items: z.array(z.object({ value: z.string().max(20), label: z.string().max(60) })).max(6),
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
  label: z.string().max(40).default(""),
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

// A grid of photos (optionally each linking somewhere).
export const galleryBlockSchema = z.object({
  ...blockBase,
  type: z.literal("gallery"),
  title: z.string().max(120).default(""),
  // Grid of squares, or a horizontal carousel strip.
  display: z.enum(["grid", "carousel"]).default("grid"),
  items: z
    .array(z.object({ imageUrl: z.string().max(1000), url: z.string().max(2000).default("") }))
    .max(9),
});

// A grid (or carousel) of videos that play in place, each with a poster.
export const videosBlockSchema = z.object({
  ...blockBase,
  type: z.literal("videos"),
  title: z.string().max(120).default(""),
  display: z.enum(["grid", "carousel"]).default("grid"),
  items: z
    .array(z.object({ url: z.string().max(1000), poster: z.string().max(1000).default("") }))
    .max(9),
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
  statsBlockSchema,
  galleryBlockSchema,
  videosBlockSchema,
]);

export const BUTTON_SHAPES = ["square", "rounded", "pill"] as const;
export const BUTTON_STYLES = ["fill", "outline", "soft"] as const;
export const FONTS = ["sans", "serif", "mono", "rounded", "elegant", "condensed", "tech"] as const;
export const LAYOUTS = ["classic", "cover", "card", "hero", "name", "poster", "blank", "band", "cutout", "fullscreen", "portrait", "capacheia"] as const;
export const BACKGROUND_TYPES = ["solid", "gradient", "image"] as const;
export const AVATAR_SHAPES = ["circle", "rounded", "square"] as const;
export const SOCIAL_STYLES = ["icons", "pills"] as const;
// Vita premium designs: when set, the page is drawn by that template's own
// layout (src/components/page-view/PremiumView.tsx) instead of the theme.
export const PREMIUM_DESIGNS = ["", "authority", "spotlight", "ecosystem", "catalog", "experience"] as const;

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
  // Highlights: banner labels, stats, section titles. Headings can use their own font.
  accent: color.default("#3b6ef5"),
  headingFont: z.enum(["same", ...FONTS]).default("same"),
  premium: z.enum(PREMIUM_DESIGNS).default(""),
});

// Page texts only the premium designs use.
export const premiumFieldsSchema = z.object({
  // Top of the Presença/Ecossistema header: show the logo, the name, or nothing.
  header: z.enum(["logo", "name", "none"]).default("logo"),
  siteLabel: z.string().max(40).default("MEU SITE"),
  siteUrl: z.string().max(2000).default(""),
  coverX: z.number().min(0).max(100).default(65),
  coverY: z.number().min(0).max(100).default(50),
  sectionTitle: z.string().max(60).default("ECOSSISTEMA"),
  quote: z.string().max(200).default(""),
  about: z.string().max(1000).default(""),
  heading: z.string().max(240).default(""),
  contactLabel: z.string().max(60).default("Fale comigo"),
  email: z.string().max(120).default(""),
  footer: z.string().max(80).default(""),
  privacyUrl: z.string().max(2000).default(""),
  termsUrl: z.string().max(2000).default(""),
  // "experience" design: a line under the logo, a credential line, and the
  // two audience-toggle labels.
  tagline: z.string().max(120).default(""),
  credential: z.string().max(80).default(""),
  audienceA: z.string().max(40).default("Sou paciente"),
  audienceB: z.string().max(40).default("Sou dentista"),
});

export const PREMIUM_DEFAULTS = premiumFieldsSchema.parse({});

export const pageDocSchema = z.object({
  version: z.literal(1),
  profile: z.object({
    name: z.string().max(80),
    bio: z.string().max(300),
    avatarUrl: z.string().max(1000),
    coverUrl: z.string().max(1000),
    // Video cover (mp4/webm). When set, the cover/hero/poster layouts play it
    // in place of the cover image; coverUrl (or the avatar) is its poster.
    coverVideo: z.string().max(1000).default(""),
    // Shown in the Presença/Ecossistema header in place of the name text.
    logo: z.string().max(1000).default(""),
    verified: z.boolean().default(false),
    // A WhatsApp number shown as a floating button on the public page.
    floatingWhatsapp: z.string().max(30).default(""),
  }),
  socials: z.array(socialLinkSchema).max(20),
  blocks: z.array(blockSchema).max(100),
  theme: themeSchema,
  premium: premiumFieldsSchema.default(PREMIUM_DEFAULTS),
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
