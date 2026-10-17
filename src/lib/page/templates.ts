import { nanoid } from "nanoid";
import type { Block, PageDoc, SocialLink, Theme } from "./schema";

// Ready-made pages. Applying one replaces the whole page; the person then
// swaps the sample texts, links and images (in /public/templates) for theirs.

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
const img = (file: string) => `/templates/${file}.jpg`;

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
const heading = (text: string, style: Extract<Block, { type: "heading" }>["style"] = "plain"): Block => ({
  id: id(),
  enabled: true,
  type: "heading",
  text,
  style,
});
const text = (body: string, style: Extract<Block, { type: "text" }>["style"] = "plain", title = ""): Block => ({
  id: id(),
  enabled: true,
  type: "text",
  text: body,
  style,
  title,
});
function product(fields: { label: string; title: string; description: string; imageUrl: string; buttonText: string }): Block {
  return { id: id(), enabled: true, type: "product", price: "", url: "https://seusite.com.br/produto", ...fields };
}

const baseTheme: Theme = {
  layout: "classic",
  font: "sans",
  headingFont: "same",
  background: "#ffffff",
  background2: "#ffffff",
  backgroundType: "solid",
  backgroundImageUrl: "",
  text: "#111111",
  buttonBackground: "#111111",
  buttonText: "#ffffff",
  buttonShape: "pill",
  buttonStyle: "fill",
  buttonShadow: false,
  avatarShape: "circle",
  socialStyle: "icons",
  accent: "#111111",
};

function page(name: string, parts: { profile?: Partial<PageDoc["profile"]>; socials?: SocialLink[]; theme: Partial<Theme>; blocks: Block[] }): PageDoc {
  return {
    version: 1,
    profile: { name, bio: "", avatarUrl: "", coverUrl: "", verified: false, floatingWhatsapp: "", ...parts.profile },
    socials: parts.socials ?? [],
    blocks: parts.blocks,
    theme: { ...baseTheme, ...parts.theme },
    seo: { title: "", description: "" },
  };
}

const socials = (...platforms: SocialLink["platform"][]): SocialLink[] =>
  platforms.map((platform) => ({ platform, url: `https://${platform}.com/suamarca` }));

export const TEMPLATES: PageTemplate[] = [
  {
    id: "autoridade",
    name: "Autoridade",
    category: "Profissional",
    plan: "premium",
    description: "Banners editáveis para serviços, cursos, palestras e conteúdo.",
    swatch: { background: "#0b1530", accent: "#3b6ef5", text: "#f3f5fb" },
    build: (name) =>
      page(name, {
        profile: { bio: "@suamarca" },
        theme: {
          layout: "name",
          headingFont: "elegant",
          backgroundType: "gradient",
          background: "#0b1530",
          background2: "#1b2f63",
          text: "#f3f5fb",
          buttonBackground: "#3b6ef5",
          accent: "#3b6ef5",
        },
        blocks: [
          heading("Links", "divider"),
          link({ display: "banner", label: "Agência", title: "Conheça nossos serviços", buttonText: "Ver mais", accent: "#3b6ef5", imageUrl: img("banner-azul"), url: "https://seusite.com.br" }),
          link({ display: "banner", label: "Treinamento", title: "Cursos para empreendedores", buttonText: "Ver cursos", accent: "#22a06b", imageUrl: img("banner-verde"), url: "https://seusite.com.br/cursos" }),
          link({ display: "banner", label: "Palco", title: "Contratar palestras", buttonText: "Saiba mais", accent: "#e8a020", imageUrl: img("banner-ambar"), url: "https://seusite.com.br/palestras" }),
          link({ display: "banner", label: "Vídeos", title: "Conteúdos no YouTube", buttonText: "Assistir", accent: "#e5383b", imageUrl: img("banner-vermelho"), url: "https://youtube.com/@suamarca" }),
          text(`${name} · © ${new Date().getFullYear()}`, "footer"),
        ],
      }),
  },
  {
    id: "presenca",
    name: "Presença",
    category: "Profissional",
    plan: "premium",
    description: "Capa com foto, redes sociais e banners de projetos editáveis.",
    swatch: { background: "#0a0a0a", accent: "#e8b64c", text: "#f5f5f5" },
    build: (name) =>
      page(name, {
        profile: { coverUrl: img("retrato-pb") },
        socials: socials("instagram", "youtube", "spotify", "linkedin", "tiktok"),
        theme: {
          layout: "poster",
          headingFont: "condensed",
          background: "#0a0a0a",
          text: "#f5f5f5",
          buttonBackground: "#e8b64c",
          buttonStyle: "outline",
          accent: "#e8b64c",
        },
        blocks: [
          link({ title: "Meu site", url: "https://seusite.com.br" }),
          text("Clique e faça parte dos nossos projetos:"),
          link({ display: "banner", label: "Palestras", title: "CONTRATE PALESTRAS", buttonText: "Saiba mais", imageUrl: img("banner-dourado"), url: "https://seusite.com.br/palestras" }),
          link({ display: "banner", label: "Mentoria", title: "CONHEÇA NOSSA MENTORIA", buttonText: "Conhecer", imageUrl: img("banner-ambar"), url: "https://seusite.com.br/mentoria" }),
          link({ display: "banner", label: "Podcast", title: "OUÇA NOSSO PODCAST", buttonText: "Ouvir agora", imageUrl: img("banner-azul"), url: "https://open.spotify.com/" }),
          link({ display: "banner", label: "Conteúdo", title: "IDEIAS PARA IR ALÉM", buttonText: "Assistir", imageUrl: img("banner-vermelho"), url: "https://youtube.com/@suamarca" }),
          text(`© ${new Date().getFullYear()} ${name}`, "footer"),
        ],
      }),
  },
  {
    id: "ecossistema",
    name: "Ecossistema",
    category: "Profissional",
    plan: "premium",
    description: "Retrato, indicadores ilustrativos e cartões de projetos. Edite com seus próprios dados.",
    swatch: { background: "#0c0a10", accent: "#ff2d7e", text: "#f7f3f6" },
    build: (name) =>
      page(name, {
        profile: { avatarUrl: img("retrato-escuro"), bio: "Empreendedor, especialista e mentor" },
        theme: {
          layout: "hero",
          headingFont: "condensed",
          background: "#0c0a10",
          text: "#f7f3f6",
          buttonBackground: "#ff2d7e",
          accent: "#ff2d7e",
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
          heading("Ecossistema", "section"),
          link({ display: "card", label: "Clube", title: "Sua comunidade de negócios", subtitle: "Conhecimento e conexões", url: "https://seusite.com.br/clube" }),
          link({ display: "card", label: "Vendas", title: "Sua escola de vendas", subtitle: "Aprendizado para crescer", url: "https://seusite.com.br/vendas" }),
          link({ display: "card", label: "Podcast", title: "Seu podcast no YouTube", subtitle: "Conversas que inspiram", url: "https://youtube.com/@suamarca" }),
          link({ display: "card", label: "Conexão", title: "Faça parte do seu clube", subtitle: "Inscrições por aplicação", url: "https://seusite.com.br/aplicacao" }),
          link({ display: "card", label: "Encontros", title: "Encontros para empreendedores", subtitle: "Compartilhe novas ideias", url: "https://seusite.com.br/encontros" }),
          link({ display: "banner", label: "Palestras", title: "LEVE SUA EXPERIÊNCIA PARA O PALCO DO SEU EVENTO", buttonText: "Quero saber mais", imageUrl: img("banner-magenta"), url: "https://seusite.com.br/palestras" }),
          link({ display: "card", title: "Conheça meu site", subtitle: "seusite.com.br", url: "https://seusite.com.br" }),
          text(
            "Conte aqui a sua trajetória: de onde você veio, o que construiu e como ajuda as pessoas a chegarem mais longe.",
            "quote",
            "Sua determinação transforma possibilidades em resultados.",
          ),
          text(name, "footer"),
        ],
      }),
  },
  {
    id: "vitrine",
    name: "Vitrine",
    category: "Profissional",
    plan: "premium",
    description: "Catálogo de produtos com imagens, descrições, botões e contato editáveis.",
    swatch: { background: "#0b120c", accent: "#c4f82a", text: "#eef5e6" },
    build: (name) =>
      page(name, {
        profile: { floatingWhatsapp: "(11) 99999-0000" },
        theme: {
          layout: "blank",
          headingFont: "tech",
          background: "#0b120c",
          text: "#eef5e6",
          buttonBackground: "#c4f82a",
          buttonText: "#0b120c",
          buttonShape: "square",
          accent: "#c4f82a",
        },
        blocks: [
          heading(`⚡ ${name}`, "badge"),
          heading("Conheça os meus produtos", "display"),
          text("Escolha a solução certa para o seu momento e comece hoje."),
          { id: id(), enabled: true, type: "image", imageUrl: img("mesa"), alt: "Mesa de trabalho", url: "" },
          product({
            label: "Mentoria",
            title: "Mentoria Estratégica",
            description: "Acompanhamento individual para destravar o seu próximo nível.",
            imageUrl: img("produto-1"),
            buttonText: "Fazer aplicação →",
          }),
          product({
            label: "Produto",
            title: "Workhard Anywhere",
            description: "Método para produzir com foco de qualquer lugar.",
            imageUrl: img("produto-2"),
            buttonText: "Quero conhecer →",
          }),
          product({
            label: "Curso · Vídeo",
            title: "Edição Criativa",
            description: "Aprenda a editar vídeos que prendem a atenção.",
            imageUrl: img("produto-3"),
            buttonText: "Quero aprender →",
          }),
          {
            id: id(),
            enabled: true,
            type: "whatsapp",
            phone: "(11) 99999-0000",
            message: "Olá! Tenho uma dúvida sobre os produtos.",
            buttonText: "Dúvidas? Falar no WhatsApp",
          },
          text(`© ${name} ${new Date().getFullYear()} · Fale comigo`, "footer"),
        ],
      }),
  },
];
