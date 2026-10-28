import { nanoid } from "nanoid";
import { PREMIUM_DEFAULTS, type Block, type BlockType, type PageDoc, type SocialPlatform, type Theme } from "./schema";

export const BLOCK_CATALOG: Record<BlockType, { label: string; description: string }> = {
  link: { label: "Link", description: "Botão que leva a qualquer endereço" },
  heading: { label: "Título", description: "Separa a página em seções" },
  text: { label: "Texto", description: "Parágrafo livre" },
  youtube: { label: "Vídeo do YouTube", description: "Vídeo tocando na própria página" },
  spotify: { label: "Spotify", description: "Música, álbum, playlist ou podcast" },
  faq: { label: "Perguntas frequentes", description: "Perguntas que abrem e fecham" },
  countdown: { label: "Contagem regressiva", description: "Conta o tempo até uma data" },
  subscribe: { label: "Captar contatos", description: "Formulário de e-mail e telefone" },
  form: { label: "Formulário", description: "Perguntas personalizadas que enviam as respostas pro seu WhatsApp" },
  whatsapp: { label: "WhatsApp", description: "Botão que abre uma conversa com mensagem pronta" },
  image: { label: "Imagem", description: "Foto ou banner, com link opcional" },
  product: { label: "Produto", description: "Foto, preço e botão de compra" },
  map: { label: "Mapa", description: "Endereço no mapa e botão de rota" },
  contact: { label: "Salvar contato", description: "Visitante salva seu contato no celular" },
  stats: { label: "Números", description: "Destaques como \"10+ anos\" e \"500+ clientes\"" },
  gallery: { label: "Galeria", description: "Grade de fotos, cada uma com link opcional" },
  videos: { label: "Vídeos (grade)", description: "Vários vídeos em grade, cada um tocando na página" },
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
      return {
        ...base,
        type,
        title: "Meu link",
        url: "https://",
        imageUrl: "",
        highlight: false,
        display: "button",
        label: "",
        subtitle: "",
        buttonText: "",
        accent: "",
      };
    case "heading":
      return { ...base, type, text: "Nova seção", style: "plain" };
    case "text":
      return { ...base, type, text: "Escreva algo sobre você.", style: "plain", title: "" };
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
    case "whatsapp":
      return { ...base, type, phone: "", message: "Olá! Vim pela sua página.", buttonText: "Falar no WhatsApp" };
    case "form":
      return {
        ...base,
        type,
        logoUrl: "",
        title: "Fale conosco",
        intro: "Preencha os campos e falaremos com você no WhatsApp.",
        whatsapp: "",
        buttonText: "Enviar",
        thankYouMessage: "Recebemos suas respostas. Obrigado!",
        fields: [
          { label: "Nome", type: "text", required: true, placeholder: "", options: [] },
          { label: "Telefone", type: "phone", required: true, placeholder: "", options: [] },
          { label: "Mensagem", type: "textarea", required: false, placeholder: "", options: [] },
        ],
      };
    case "image":
      return { ...base, type, imageUrl: "", alt: "", url: "" };
    case "product":
      return {
        ...base,
        type,
        label: "",
        title: "Meu produto",
        description: "",
        price: "R$ 0,00",
        imageUrl: "",
        buttonText: "Comprar",
        url: "https://",
        payWithStripe: false,
        amountCents: 0,
      };
    case "map":
      return { ...base, type, title: "Onde estamos", address: "" };
    case "contact":
      return { ...base, type, name: "", company: "", phone: "", email: "", buttonText: "Salvar contato" };
    case "stats":
      return {
        ...base,
        type,
        items: [
          { value: "10+", label: "anos de experiência" },
          { value: "500+", label: "clientes atendidos" },
          { value: "TOP 3", label: "na sua especialidade" },
        ],
      };
    case "gallery":
      return { ...base, type, title: "", display: "grid", items: [{ imageUrl: "", url: "" }] };
    case "videos":
      return { ...base, type, title: "", display: "grid", items: [{ url: "", poster: "" }] };
  }
}

// Ready-made forms the user picks from when creating one, so a full form (like
// a buffet quote request) is one click instead of building each field.
type FormBlock = Extract<Block, { type: "form" }>;
type FormField = FormBlock["fields"][number];

function field(
  label: string,
  type: FormField["type"],
  required = false,
  options: string[] = [],
  placeholder = "",
): FormField {
  return { label, type, required, placeholder, options };
}

function formWith(patch: Partial<FormBlock>): FormBlock {
  return { ...(createBlock("form") as FormBlock), ...patch };
}

export const FORM_PRESETS: { id: string; name: string; description: string; build: () => FormBlock }[] = [
  {
    id: "blank",
    name: "Em branco",
    description: "Comece do zero, com nome, telefone e mensagem.",
    build: () => createBlock("form") as FormBlock,
  },
  {
    id: "orcamento",
    name: "Solicitação de orçamento",
    description: "Para buffets, festas e eventos. Campos completos prontos.",
    build: () =>
      formWith({
        title: "Solicitação de orçamento",
        intro: "Preencha os campos e falaremos com você no WhatsApp.",
        buttonText: "Enviar solicitação",
        fields: [
          field("Nome do casal ou Empresa", "text", true),
          field("Tipo de evento", "text", true),
          field("Local do evento", "text", true),
          field("Data do evento", "date", true),
          field("Tempo de duração do evento", "text", true),
          field("Número mínimo de convidados que atendemos", "number", true, [], "Mínimo de 30 convidados."),
          field("Número máximo de convidados", "number", true),
          field("Qual a pretensão de investimento por pessoa?", "radio", true, ["R$ 260,00", "R$ 290,00", "R$ 330,00"]),
          field("Qual o tempo estimado para o fechamento?", "radio", true, [
            "Imediato",
            "De 3 a 6 meses",
            "De 6 meses a 1 ano",
            "Mais de 1 ano",
          ]),
          field("Como nos conheceu", "checkbox", false, ["Instagram", "Facebook", "Google", "Site", "Anúncio", "Outros"]),
          field("Qual seria o seu cardápio ideal?", "radio", false, ["Premium", "Tradicional", "Essencial", "Temático"]),
          field("Cite abaixo o que considerar importante para o seu grande dia.", "textarea", false),
        ],
      }),
  },
  {
    id: "contato",
    name: "Contato",
    description: "Nome, e-mail, telefone e mensagem.",
    build: () =>
      formWith({
        title: "Fale conosco",
        fields: [
          field("Nome", "text", true),
          field("E-mail", "email", false),
          field("Telefone", "phone", true),
          field("Mensagem", "textarea", false),
        ],
      }),
  },
  {
    id: "agendamento",
    name: "Agendamento",
    description: "Nome, telefone, data e serviço desejado.",
    build: () =>
      formWith({
        title: "Agende seu horário",
        buttonText: "Quero agendar",
        fields: [
          field("Nome", "text", true),
          field("Telefone", "phone", true),
          field("Data desejada", "date", true),
          field("Serviço", "select", true, ["Serviço 1", "Serviço 2", "Serviço 3"]),
          field("Observações", "textarea", false),
        ],
      }),
  },
];

// Options the presets don't set, so each preset only lists what makes it distinct.
const THEME_BASE = {
  layout: "classic",
  font: "sans",
  buttonShape: "rounded",
  buttonStyle: "fill",
  buttonShadow: false,
  backgroundType: "solid",
  background2: "#d6d3d1",
  backgroundImageUrl: "",
  avatarShape: "circle",
  socialStyle: "icons",
  accent: "#3b6ef5",
  headingFont: "same",
  premium: "",
} as const satisfies Partial<Theme>;

const PRESETS: { name: string; theme: Theme }[] = [
  {
    name: "Claro",
    theme: { ...THEME_BASE, background: "#f7f7f5", text: "#1c1c1c", buttonBackground: "#1c1c1c", buttonText: "#ffffff" },
  },
  {
    name: "Noite",
    theme: {
      ...THEME_BASE,
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
      ...THEME_BASE,
      layout: "cover",
      font: "serif",
      background: "#efe6da",
      text: "#3b2f25",
      buttonBackground: "#3b2f25",
      buttonText: "#efe6da",
      buttonShape: "square",
    },
  },
  {
    name: "Menta",
    theme: {
      ...THEME_BASE,
      font: "rounded",
      background: "#e3f4ee",
      text: "#0f3d33",
      buttonBackground: "#0f7a63",
      buttonText: "#ffffff",
      buttonShape: "pill",
      buttonStyle: "soft",
    },
  },
  {
    name: "Pôr do sol",
    theme: {
      ...THEME_BASE,
      backgroundType: "gradient",
      background: "#ff7e5f",
      background2: "#7b2ff7",
      text: "#ffffff",
      buttonBackground: "#ffffff",
      buttonText: "#3a1c5c",
      buttonShape: "pill",
      buttonShadow: true,
    },
  },
  {
    name: "Oceano",
    theme: {
      ...THEME_BASE,
      layout: "card",
      backgroundType: "gradient",
      background: "#0f4c81",
      background2: "#38bdf8",
      text: "#0b2540",
      buttonBackground: "#0f4c81",
      buttonText: "#ffffff",
      buttonShadow: true,
    },
  },
  {
    name: "Editorial",
    theme: {
      ...THEME_BASE,
      layout: "hero",
      font: "serif",
      background: "#fbfaf7",
      text: "#171717",
      buttonBackground: "#171717",
      buttonText: "#fbfaf7",
      buttonShape: "square",
      buttonStyle: "outline",
      avatarShape: "square",
    },
  },
  {
    name: "Rosa",
    theme: {
      ...THEME_BASE,
      font: "rounded",
      backgroundType: "gradient",
      background: "#ffe4ec",
      background2: "#ffd1dc",
      text: "#5b1a33",
      buttonBackground: "#e0457b",
      buttonText: "#ffffff",
      buttonShape: "pill",
      buttonShadow: true,
      avatarShape: "rounded",
    },
  },
];

// Each preset's accent follows its button colour.
export const THEME_PRESETS = PRESETS.map(({ name, theme }) => ({ name, theme: { ...theme, accent: theme.buttonBackground } }));

export function defaultPageDoc(name: string): PageDoc {
  return {
    version: 1,
    profile: { name, bio: "", avatarUrl: "", coverUrl: "", coverVideo: "", logo: "", verified: false, floatingWhatsapp: "" },
    socials: [],
    blocks: [createBlock("link")],
    theme: THEME_PRESETS[0].theme,
    premium: PREMIUM_DEFAULTS,
    seo: { title: "", description: "" },
  };
}

// One line that identifies a block in the editor list and in the analytics.
export function blockSummary(block: Block): string {
  switch (block.type) {
    case "link":
      return block.title || block.url;
    case "heading":
    case "text":
      return block.text;
    case "youtube":
    case "spotify":
      return block.url || "Sem endereço";
    case "faq":
    case "countdown":
    case "subscribe":
    case "product":
    case "map":
      return block.title;
    case "form":
      return block.title || `Formulário (${block.fields.length} campos)`;
    case "gallery":
      return block.title || `Galeria (${block.items.length})`;
    case "videos":
      return block.title || `Vídeos (${block.items.length})`;
    case "whatsapp":
    case "contact":
      return block.buttonText;
    case "image":
      return block.alt || block.imageUrl || "Sem imagem";
    case "stats":
      return block.items.map((item) => item.value).join(" · ") || "Números";
  }
}
