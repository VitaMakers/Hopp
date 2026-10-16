import { nanoid } from "nanoid";
import type { Block, BlockType, PageDoc, SocialPlatform, Theme } from "./schema";

export const BLOCK_CATALOG: Record<BlockType, { label: string; description: string }> = {
  link: { label: "Link", description: "Botão que leva a qualquer endereço" },
  heading: { label: "Título", description: "Separa a página em seções" },
  text: { label: "Texto", description: "Parágrafo livre" },
  youtube: { label: "Vídeo do YouTube", description: "Vídeo tocando na própria página" },
  spotify: { label: "Spotify", description: "Música, álbum, playlist ou podcast" },
  faq: { label: "Perguntas frequentes", description: "Perguntas que abrem e fecham" },
  countdown: { label: "Contagem regressiva", description: "Conta o tempo até uma data" },
  subscribe: { label: "Captar contatos", description: "Formulário de e-mail e telefone" },
};

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

export function createBlock(type: BlockType): Block {
  const base = { id: nanoid(10), enabled: true };
  switch (type) {
    case "link":
      return { ...base, type, title: "Meu link", url: "https://" };
    case "heading":
      return { ...base, type, text: "Nova seção" };
    case "text":
      return { ...base, type, text: "Escreva algo sobre você." };
    case "youtube":
      return { ...base, type, url: "" };
    case "spotify":
      return { ...base, type, url: "" };
    case "faq":
      return {
        ...base,
        type,
        title: "Perguntas frequentes",
        items: [{ question: "Qual é a pergunta?", answer: "Esta é a resposta." }],
      };
    case "countdown": {
      const inAWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      return { ...base, type, title: "Lançamento em", endsAt: inAWeek.toISOString() };
    }
    case "subscribe":
      return {
        ...base,
        type,
        title: "Receba novidades",
        buttonText: "Quero receber",
        collectPhone: false,
        thankYouMessage: "Pronto! Você está na lista.",
      };
  }
}

export const THEME_PRESETS: { name: string; theme: Theme }[] = [
  {
    name: "Claro",
    theme: {
      layout: "classic",
      font: "sans",
      background: "#f7f7f5",
      text: "#1c1c1c",
      buttonBackground: "#1c1c1c",
      buttonText: "#ffffff",
      buttonShape: "rounded",
      buttonStyle: "fill",
    },
  },
  {
    name: "Noite",
    theme: {
      layout: "classic",
      font: "sans",
      background: "#121417",
      text: "#f2f2f2",
      buttonBackground: "#f2f2f2",
      buttonText: "#121417",
      buttonShape: "pill",
      buttonStyle: "outline",
    },
  },
  {
    name: "Areia",
    theme: {
      layout: "cover",
      font: "serif",
      background: "#efe6da",
      text: "#3b2f25",
      buttonBackground: "#3b2f25",
      buttonText: "#efe6da",
      buttonShape: "square",
      buttonStyle: "fill",
    },
  },
  {
    name: "Menta",
    theme: {
      layout: "classic",
      font: "rounded",
      background: "#e3f4ee",
      text: "#0f3d33",
      buttonBackground: "#0f7a63",
      buttonText: "#ffffff",
      buttonShape: "pill",
      buttonStyle: "soft",
    },
  },
];

export function defaultPageDoc(name: string): PageDoc {
  return {
    version: 1,
    profile: { name, bio: "", avatarUrl: "", coverUrl: "" },
    socials: [],
    blocks: [createBlock("link")],
    theme: THEME_PRESETS[0].theme,
    seo: { title: "", description: "" },
  };
}
