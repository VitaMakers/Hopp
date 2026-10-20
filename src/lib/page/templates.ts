import { nanoid } from "nanoid";
import { PREMIUM_DEFAULTS, type Block, type PageDoc, type SocialLink, type Theme } from "./schema";

// Ready-made pages. Applying one replaces the whole page; the person then
// swaps the sample texts, links and images for theirs.

export type TemplatePlan = "basic" | "premium";

export type PageTemplate = {
  id: string;
  name: string;
  category: string;
  plan: TemplatePlan;
  description: string;
  // Small preview colours for the picker card.
  swatch: { background: string; accent: string; text: string };
  build: (name: string) => PageDoc;
};

const id = () => nanoid(10);
const unsplash = (photo: string, width: number) =>
  `https://images.unsplash.com/photo-${photo}?auto=format&fit=crop&w=${width}&q=85`;

function link(fields: Partial<Extract<Block, { type: "link" }>> & { title: string; url: string }): Block {
  return {
    id: id(),
    enabled: true,
    type: "link",
    imageUrl: "",
    highlight: false,
    display: "button",
    label: "",
    subtitle: "",
    buttonText: "",
    accent: "",
    ...fields,
  };
}

function product(fields: { label: string; title: string; description: string; imageUrl: string; buttonText: string; url: string }): Block {
  return { id: id(), enabled: true, type: "product", price: "", ...fields };
}

const baseTheme: Theme = {
  layout: "classic",
  font: "sans",
  headingFont: "same",
  background: "#ffffff",
  background2: "#ffffff",
  backgroundType: "solid",
  backgroundImageUrl: "",
  text: "#ffffff",
  buttonBackground: "#ffffff",
  buttonText: "#000000",
  buttonShape: "pill",
  buttonStyle: "fill",
  buttonShadow: false,
  avatarShape: "circle",
  socialStyle: "icons",
  accent: "#ffffff",
  premium: "",
};

function page(
  name: string,
  parts: {
    profile?: Partial<PageDoc["profile"]>;
    socials?: SocialLink[];
    theme: Partial<Theme>;
    premium?: Partial<PageDoc["premium"]>;
    blocks: Block[];
  },
): PageDoc {
  return {
    version: 1,
    profile: { name, bio: "", avatarUrl: "", coverUrl: "", logo: "", verified: false, floatingWhatsapp: "", ...parts.profile },
    socials: parts.socials ?? [],
    blocks: parts.blocks,
    theme: { ...baseTheme, ...parts.theme },
    premium: { ...PREMIUM_DEFAULTS, ...parts.premium },
    seo: { title: "", description: "" },
  };
}

// The four premium designs from Vita, with Vita's sample texts, colours and
// photos. Each one is drawn by its own layout (theme.premium).
export const TEMPLATES: PageTemplate[] = [
  {
    id: "autoridade",
    name: "Autoridade",
    category: "Profissional",
    plan: "premium",
    description: "Banners editáveis para serviços, cursos, palestras e conteúdo.",
    swatch: { background: "#080f1c", accent: "#3565ed", text: "#f5f6fa" },
    build: (name) =>
      page(name, {
        profile: { bio: "@suamarca" },
        theme: { premium: "authority", background: "#080f1c", text: "#f5f6fa", accent: "#3565ed" },
        blocks: [
          link({ display: "banner", label: "AGÊNCIA", title: "Conheça nossos serviços", buttonText: "Ver mais", accent: "#3565ed", url: "https://example.com/servicos", imageUrl: unsplash("1519389950473-47ba0277781c", 1000) }),
          link({ display: "banner", label: "TREINAMENTO", title: "Cursos para empreendedores", buttonText: "Ver cursos", accent: "#18ba69", url: "https://example.com/cursos", imageUrl: unsplash("1516321318423-f06f85e504b3", 1000) }),
          link({ display: "banner", label: "PALCO", title: "Contratar palestras", buttonText: "Saiba mais", accent: "#ed981b", url: "https://example.com/palestras", imageUrl: unsplash("1475721027785-f74eccf877e2", 1000) }),
          link({ display: "banner", label: "VÍDEOS", title: "Conteúdos no YouTube", buttonText: "Assistir", accent: "#e53748", url: "https://www.youtube.com/", imageUrl: unsplash("1540575467063-178a50c2df87", 1000) }),
        ],
      }),
  },
  {
    id: "presenca",
    name: "Presença",
    category: "Profissional",
    plan: "premium",
    description: "Capa com foto, redes sociais e banners de projetos editáveis.",
    swatch: { background: "#000000", accent: "#d6ae58", text: "#ffffff" },
    build: (name) =>
      page(name, {
        profile: { bio: "Clique e faça parte dos nossos projetos:", coverUrl: unsplash("1472099645785-5658abf4ff4e", 1600) },
        socials: [
          { platform: "instagram", url: "https://www.instagram.com/" },
          { platform: "youtube", url: "https://www.youtube.com/" },
          { platform: "spotify", url: "https://open.spotify.com/" },
          { platform: "linkedin", url: "https://www.linkedin.com/" },
          { platform: "tiktok", url: "https://www.tiktok.com/" },
        ],
        theme: { premium: "spotlight", background: "#000000", text: "#ffffff", accent: "#d6ae58" },
        premium: { siteLabel: "MEU SITE", siteUrl: "https://example.com/", coverX: 65, coverY: 50 },
        blocks: [
          link({ display: "banner", label: "PALESTRAS", title: "Contrate palestras", buttonText: "Saiba mais", accent: "#d6ae58", url: "https://example.com/palestras", imageUrl: unsplash("1475721027785-f74eccf877e2", 1200) }),
          link({ display: "banner", label: "MENTORIA", title: "Conheça nossa mentoria", buttonText: "Conhecer", accent: "#d6ae58", url: "https://example.com/mentoria", imageUrl: unsplash("1519389950473-47ba0277781c", 1200) }),
          link({ display: "banner", label: "PODCAST", title: "Ouça nosso podcast", buttonText: "Ouvir agora", accent: "#28be76", url: "https://open.spotify.com/", imageUrl: unsplash("1516321318423-f06f85e504b3", 1200) }),
          link({ display: "banner", label: "CONTEÚDO", title: "Ideias para ir além", buttonText: "Assistir", accent: "#d6ae58", url: "https://www.youtube.com/", imageUrl: unsplash("1540575467063-178a50c2df87", 1200) }),
        ],
      }),
  },
  {
    id: "ecossistema",
    name: "Ecossistema",
    category: "Profissional",
    plan: "premium",
    description: "Retrato, indicadores ilustrativos e cartões de projetos. Edite com seus próprios dados.",
    swatch: { background: "#030303", accent: "#ff3469", text: "#f7f7f7" },
    build: (name) =>
      page(name, {
        profile: { bio: "Empreendedor, especialista e mentor", coverUrl: unsplash("1560250097-0b93528c311a", 1000) },
        theme: { premium: "ecosystem", background: "#030303", text: "#f7f7f7", accent: "#ff3469" },
        premium: {
          coverX: 50,
          coverY: 30,
          sectionTitle: "ECOSSISTEMA",
          quote: "Sua determinação transforma possibilidades em resultados.",
          about: "Apresente aqui sua trajetória, suas conquistas e o que você pode construir com seus clientes.",
        },
        blocks: [
          {
            id: id(),
            enabled: true,
            type: "stats",
            items: [
              { value: "10+", label: "anos de experiência" },
              { value: "500+", label: "clientes atendidos" },
              { value: "TOP 3", label: "na sua especialidade" },
            ],
          },
          link({ display: "card", label: "CLUBE", title: "Sua comunidade de negócios", subtitle: "Conhecimento e conexões", url: "https://example.com/comunidade" }),
          link({ display: "card", label: "VENDAS", title: "Sua escola de vendas", subtitle: "Aprendizado para crescer", url: "https://example.com/escola" }),
          link({ display: "card", label: "PODCAST", title: "Seu podcast no YouTube", subtitle: "Conversas que inspiram", url: "https://www.youtube.com/" }),
          link({ display: "card", label: "CONEXÃO", title: "Faça parte do seu clube", subtitle: "Inscrições por aplicação", url: "https://example.com/clube" }),
          link({ display: "card", label: "ENCONTROS", title: "Encontros para empreendedores", subtitle: "Compartilhe novas ideias", url: "https://example.com/encontros" }),
          link({
            display: "banner",
            label: "PALESTRAS",
            title: "Leve sua experiência para o palco do seu evento",
            subtitle: "Compartilhe conhecimento com sua equipe em uma experiência criada para o seu público.",
            buttonText: "Quero saber mais",
            url: "https://example.com/palestras",
          }),
          link({ display: "button", title: "Conheça meu site", subtitle: "seusite.com.br", url: "https://example.com/" }),
        ],
      }),
  },
  {
    id: "vitrine",
    name: "Vitrine",
    category: "Profissional",
    plan: "premium",
    description: "Catálogo de produtos com imagens, descrições, botões e contato editáveis.",
    swatch: { background: "#111d1f", accent: "#e6ff35", text: "#e7e9e8" },
    build: (name) =>
      page(name, {
        profile: {
          bio: "Escolha o próximo passo para desenvolver sua marca, ampliar seu conhecimento e transformar suas ideias em projetos.",
          floatingWhatsapp: "(11) 99999-0000",
        },
        theme: { premium: "catalog", background: "#111d1f", text: "#e7e9e8", accent: "#e6ff35", font: "tech" },
        premium: { heading: "Conheça\nos meus\nprodutos", contactLabel: "Fale comigo" },
        blocks: [
          product({
            label: "MENTORIA",
            title: "Mentoria Estratégica",
            description: "Acompanhamento para organizar sua estratégia, fortalecer sua marca e colocar seus próximos passos em prática.",
            buttonText: "FAZER APLICAÇÃO",
            url: "https://example.com/mentoria",
            imageUrl: unsplash("1519389950473-47ba0277781c", 1400),
          }),
          product({
            label: "CURSO",
            title: "Conteúdo com Propósito",
            description: "Aprenda a planejar conteúdos com a sua identidade e transformar conhecimento em uma presença digital consistente.",
            buttonText: "CONHECER O CURSO",
            url: "https://example.com/curso",
            imageUrl: unsplash("1499951360447-b19be8fe80f5", 1400),
          }),
          product({
            label: "CURSO · VÍDEO",
            title: "Edição Criativa",
            description: "Organize suas ideias e conheça técnicas práticas para produzir vídeos que expressem a personalidade da sua marca.",
            buttonText: "QUERO APRENDER",
            url: "https://example.com/video",
            imageUrl: unsplash("1492691527719-9d1e07e534b4", 1400),
          }),
        ],
      }),
  },
];
