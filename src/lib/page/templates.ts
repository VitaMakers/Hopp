import { nanoid } from "nanoid";
import { PREMIUM_DEFAULTS, type Block, type PageDoc, type SocialLink, type Theme } from "./schema";
import { ESSENTIAL_COLLECTIONS, ESSENTIAL_TEMPLATES } from "./essentials";

// Ready-made pages. Applying one replaces the whole page; the person then
// swaps the sample texts, links and images for theirs.

export type TemplatePlan = "basic" | "premium";

// Tabs in the model gallery. "models" tabs list ready-made models (a model
// shows under the tab its `tab` field names); the "scratch" tab starts a blank
// page the person builds in the editor, with the live preview beside it.
export type TemplateTab = {
  id: string;
  label: string;
  kind: "models" | "scratch";
  // Plan that unlocks these models, shown on the tab (models tabs only).
  plan?: string;
  note: string;
};

// A collection is a named folder inside a tab. The person opens a collection
// to see the models in it. Empty collections are placeholders ("em breve").
export type TemplateCollection = {
  id: string;
  tab: string;
  name: string;
  description: string;
  swatch: { background: string; accent: string; text: string };
  templateIds: string[];
  // Minimum plan to USE a model from this collection. Omitted = the tab's
  // default (premium tab → profissional; essencial tab → free/everyone).
  requiresPlan?: "free" | "essencial" | "profissional";
};

export const TEMPLATE_COLLECTIONS: TemplateCollection[] = [
  ...ESSENTIAL_COLLECTIONS,
  {
    id: "black-friday",
    tab: "premium",
    name: "Black Friday",
    description: "Modelos de campanha para a Black Friday — ofertas, contagem e destaque.",
    swatch: { background: "#000000", accent: "#e11d2a", text: "#ffffff" },
    templateIds: ["bf-loja", "bf-lookbook", "bf-mosaico", "bf-drop", "bf-banner"],
  },
  {
    id: "autoridade",
    tab: "premium",
    name: "Autoridade",
    description: "Modelos para marca pessoal e autoridade.",
    swatch: { background: "#080f1c", accent: "#3565ed", text: "#f5f6fa" },
    templateIds: ["autoridade", "presenca", "ecossistema", "vitrine"],
  },
  { id: "presenca", tab: "premium", name: "Presença", description: "Perfil profissional com público duplo.", swatch: { background: "#0a0a0f", accent: "#a78bfa", text: "#f5f5f5" }, templateIds: ["experiencia"] },
  { id: "ecossistema", tab: "premium", name: "Ecossistema", description: "Em breve.", swatch: { background: "#030303", accent: "#ff3469", text: "#f7f7f7" }, templateIds: [] },
  { id: "vitrine", tab: "premium", name: "Vitrine", description: "Em breve.", swatch: { background: "#111d1f", accent: "#e6ff35", text: "#e7e9e8" }, templateIds: [], requiresPlan: "essencial" },
];

// The models inside a collection, in its listed order.
export function collectionModels(collection: TemplateCollection): PageTemplate[] {
  return collection.templateIds.map((id) => TEMPLATES.find((t) => t.id === id)).filter((t): t is PageTemplate => !!t);
}

export const TEMPLATE_TABS: TemplateTab[] = [
  { id: "essencial", label: "Modelos Essenciais", kind: "models", plan: "Essencial", note: "Modelos do plano Essencial. Novos modelos em breve." },
  { id: "premium", label: "Modelos Premium", kind: "models", plan: "Profissional", note: "Modelos do plano Profissional." },
  { id: "criar", label: "Criar Meu Modelo", kind: "scratch", note: "Comece com uma página em branco e monte do seu jeito — a prévia aparece ao lado enquanto você edita." },
];

export type PageTemplate = {
  id: string;
  name: string;
  category: string;
  plan: TemplatePlan;
  // Which gallery tab (TEMPLATE_TABS id) this model appears under.
  tab: string;
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

function product(fields: { label: string; title: string; description: string; imageUrl: string; buttonText: string; url: string; price?: string }): Block {
  return { id: id(), enabled: true, type: "product", price: "", payWithStripe: false, amountCents: 0, ...fields };
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

export function page(
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
    profile: { name, bio: "", avatarUrl: "", coverUrl: "", coverVideo: "", logo: "", verified: false, floatingWhatsapp: "", ...parts.profile },
    socials: parts.socials ?? [],
    blocks: parts.blocks,
    theme: { ...baseTheme, ...parts.theme },
    premium: { ...PREMIUM_DEFAULTS, ...parts.premium },
    seo: { title: "", description: "" },
  };
}

// Every model the gallery can apply: the premium designs below plus the
// essential (plan "basic") models grouped by category.
export const TEMPLATES: PageTemplate[] = [
  ...ESSENTIAL_TEMPLATES,
  {
    id: "bf-loja",
    name: "Loja Black Friday",
    category: "Campanha",
    plan: "premium",
    tab: "premium",
    description: "Vitrine estilo e-commerce: carrossel de destaques animado, cartão de oferta, grade de produtos e ajuda de tamanho. Edite tudo com seus produtos.",
    swatch: { background: "#000000", accent: "#e11d2a", text: "#ffffff" },
    build: (name) =>
      page(name, {
        profile: { bio: "", floatingWhatsapp: "(11) 99999-0000" },
        theme: { premium: "store", background: "#000000", text: "#ffffff", accent: "#e11d2a", font: "sans" },
        premium: {
          heroPill: "Black Antecipada",
          heroPillUrl: "https://example.com/black-friday",
          heroSlides: [
            {
              imageUrl: unsplash("1521572163474-6864f9cf17ab", 1200),
              headline: "Até 70%\nde desconto.",
              productLabel: "EM OFERTA",
              productName: "Camiseta Tech®",
              priceFrom: "R$169",
              price: "R$129",
              url: "https://example.com/camiseta",
            },
            {
              imageUrl: unsplash("1483985988355-763728e1935b", 1200),
              headline: "Do básico\nao statement.",
              productLabel: "NOVIDADE",
              productName: "Jaqueta Puffer®",
              priceFrom: "R$599",
              price: "R$429",
              url: "https://example.com/jaqueta",
            },
          ],
          promoBadge: "1ª COMPRA",
          promoDiscount: "15% OFF",
          promoNote: "Cupom extra na sua estreia",
          promoButton: "ATIVAR",
          promoCode: "BLACK15",
          promoUrl: "https://example.com/cupom",
          benefits: ["FRETE GRÁTIS", "TROCA GRÁTIS", "+2% NO PIX"],
          featureLabel: "LANÇAMENTO",
          featureTitle: "Novas cores",
          featureTags: ["FLEECE", "PUFFER"],
          featureImageUrl: unsplash("1551028719-00167b16eac5", 1000),
          featureUrl: "https://example.com/novas-cores",
          featureColors: ["#1a1a1a", "#4a5a6a", "#7a5a3a"],
          sizeTitle: "Não sabe seu tamanho?",
          sizes: ["PP", "P", "M", "G", "GG"],
          sizeActive: "G",
          sizeImageUrl: unsplash("1576566588028-4147f3842f27", 400),
          navLinks: [
            { label: "LOJA", url: "https://example.com/" },
            { label: "BLOG", url: "https://example.com/blog" },
            { label: "GLOBAL", url: "https://example.com/global" },
            { label: "INSTAGRAM", url: "https://instagram.com/" },
          ],
        },
        blocks: [
          product({
            label: "ANTIODOR · NÃO DESBOTA",
            title: "Camiseta Tech®",
            description: "",
            buttonText: "Comprar",
            url: "https://example.com/camiseta",
            imageUrl: unsplash("1576566588028-4147f3842f27", 800),
          }),
          product({
            label: "SECA RÁPIDO · SEM PASSAR",
            title: "Vestido FutureForm®",
            description: "",
            buttonText: "Comprar",
            url: "https://example.com/vestido",
            imageUrl: unsplash("1572804013309-59a88b7e92f1", 800),
          }),
          product({
            label: "FLEECE · QUENTINHO",
            title: "Moletom Soft®",
            description: "",
            buttonText: "Comprar",
            url: "https://example.com/moletom",
            imageUrl: unsplash("1551028719-00167b16eac5", 800),
          }),
          product({
            label: "PUFFER · LEVE",
            title: "Jaqueta Puffer®",
            description: "",
            buttonText: "Comprar",
            url: "https://example.com/jaqueta",
            imageUrl: unsplash("1483985988355-763728e1935b", 800),
          }),
        ],
      }),
  },
  {
    id: "bf-lookbook",
    name: "Lookbook Black Friday",
    category: "Campanha",
    plan: "premium",
    tab: "premium",
    description: "Capa editorial de tela cheia, trilha de produtos deslizável, cupom e tile de coleção. Vibe de lookbook de moda para a Black Friday.",
    swatch: { background: "#0b0b0b", accent: "#be123c", text: "#ffffff" },
    build: (name) =>
      page(name, {
        profile: { bio: "", floatingWhatsapp: "(11) 99999-0000" },
        theme: { premium: "lookbook", background: "#0b0b0b", text: "#ffffff", accent: "#be123c", font: "sans" },
        premium: {
          heroPill: "Ver drop",
          heroPillUrl: "https://example.com/drop",
          heroSlides: [
            {
              imageUrl: unsplash("1490481651871-ab68de25d43d", 1300),
              headline: "Black Friday\nchegou cedo.",
              productLabel: "EM DESTAQUE",
              productName: "Jaqueta Oversized",
              priceFrom: "R$699",
              price: "R$419",
              url: "https://example.com/jaqueta",
            },
          ],
          siteLabel: "Ver coleção",
          siteUrl: "https://example.com/colecao",
          navLinks: [
            { label: "Novidades", url: "https://example.com/novidades" },
            { label: "Mais vendidos", url: "https://example.com/top" },
            { label: "Ofertas", url: "https://example.com/ofertas" },
            { label: "Acessórios", url: "https://example.com/acessorios" },
          ],
          featureLabel: "EDITORIAL",
          featureTitle: "Coleção Noturna",
          featureImageUrl: unsplash("1483985988355-763728e1935b", 1200),
          featureUrl: "https://example.com/noturna",
          promoBadge: "CUPOM",
          promoDiscount: "20% OFF",
          promoNote: "No site todo, até domingo",
          promoButton: "Pegar cupom",
          promoCode: "BLACKLOOK",
          promoUrl: "https://example.com/cupom",
          benefits: ["FRETE GRÁTIS", "TROCA FÁCIL", "ATÉ 12X"],
        },
        blocks: [
          product({ label: "", title: "Camiseta Pima", description: "", price: "R$89", buttonText: "Comprar", url: "https://example.com/camiseta", imageUrl: unsplash("1521572163474-6864f9cf17ab", 800) }),
          product({ label: "", title: "Calça Alfaiataria", description: "", price: "R$199", buttonText: "Comprar", url: "https://example.com/calca", imageUrl: unsplash("1542291026-7eec264c27ff", 800) }),
          product({ label: "", title: "Tênis Minimal", description: "", price: "R$329", buttonText: "Comprar", url: "https://example.com/tenis", imageUrl: unsplash("1491553895911-0055eca6402d", 800) }),
          product({ label: "", title: "Moletom Heavy", description: "", price: "R$179", buttonText: "Comprar", url: "https://example.com/moletom", imageUrl: unsplash("1620799140408-edc6dcb6d633", 800) }),
        ],
      }),
  },
  {
    id: "bf-mosaico",
    name: "Mosaico Black Friday",
    category: "Campanha",
    plan: "premium",
    tab: "premium",
    description: "Grade de tiles de tamanhos diferentes com ofertas, estilo revista/marketplace. Cupom e rodapé de links.",
    swatch: { background: "#0c0c0c", accent: "#f43f5e", text: "#ffffff" },
    build: (name) =>
      page(name, {
        profile: { bio: "Ofertas selecionadas, por tempo limitado.", floatingWhatsapp: "(11) 99999-0000" },
        theme: { premium: "mosaic", background: "#0c0c0c", text: "#ffffff", accent: "#f43f5e", font: "sans" },
        premium: {
          heroPill: "Ver tudo",
          heroPillUrl: "https://example.com/ofertas",
          promoBadge: "CUPOM",
          promoDiscount: "15% OFF",
          promoNote: "Em todo o site, até domingo",
          promoButton: "Pegar cupom",
          promoCode: "BLACKMOSAIC",
          promoUrl: "https://example.com/cupom",
          benefits: ["FRETE GRÁTIS", "12X SEM JUROS", "TROCA FÁCIL"],
          navLinks: [
            { label: "Loja", url: "https://example.com/" },
            { label: "Novidades", url: "https://example.com/novidades" },
            { label: "Ofertas", url: "https://example.com/ofertas" },
            { label: "Instagram", url: "https://instagram.com/" },
          ],
        },
        blocks: [
          product({ label: "MAIS DESEJADO", title: "Jaqueta Couro", description: "", price: "R$499", buttonText: "Comprar", url: "https://example.com/jaqueta", imageUrl: unsplash("1551028719-00167b16eac5", 900) }),
          product({ label: "NOVO", title: "Tênis Runner", description: "", price: "R$329", buttonText: "Comprar", url: "https://example.com/tenis", imageUrl: unsplash("1542291026-7eec264c27ff", 700) }),
          product({ label: "-40%", title: "Óculos de Sol", description: "", price: "R$149", buttonText: "Comprar", url: "https://example.com/oculos", imageUrl: unsplash("1572635196237-14b3f281503f", 700) }),
          product({ label: "COMBO", title: "Kit Verão", description: "", price: "R$259", buttonText: "Comprar", url: "https://example.com/kit", imageUrl: unsplash("1523275335684-37898b6baf30", 900) }),
          product({ label: "ÚLTIMAS", title: "Bolsa Tote", description: "", price: "R$199", buttonText: "Comprar", url: "https://example.com/bolsa", imageUrl: unsplash("1584917865442-de89df76afd3", 700) }),
          product({ label: "-30%", title: "Relógio Steel", description: "", price: "R$389", buttonText: "Comprar", url: "https://example.com/relogio", imageUrl: unsplash("1524805444758-089113d48a6d", 700) }),
        ],
      }),
  },
  {
    id: "bf-drop",
    name: "Drop Único Black Friday",
    category: "Campanha",
    plan: "premium",
    tab: "premium",
    description: "Foco em um produto: imagem grande, preço de/por, seletor de tamanho, botão de compra e 'você também vai gostar'.",
    swatch: { background: "#0a0a0a", accent: "#d4af37", text: "#ffffff" },
    build: (name) =>
      page(name, {
        profile: { bio: "", floatingWhatsapp: "(11) 99999-0000" },
        theme: { premium: "dropz", background: "#0a0a0a", text: "#ffffff", accent: "#d4af37", font: "sans" },
        premium: {
          heroPill: "Frete grátis",
          heroSlides: [
            {
              imageUrl: unsplash("1542291026-7eec264c27ff", 1200),
              headline: "Tênis Aero Black",
              productLabel: "EDIÇÃO BLACK FRIDAY",
              productName: "Tênis Aero Black",
              priceFrom: "R$899",
              price: "R$549",
              url: "https://example.com/aero",
            },
          ],
          sizes: ["38", "39", "40", "41", "42", "43"],
          sizeActive: "41",
          promoButton: "Comprar agora",
          siteUrl: "https://example.com/aero",
          benefits: ["ENVIO EM 24H", "GARANTIA 1 ANO", "TROCA GRÁTIS"],
          promoBadge: "CUPOM PIX",
          promoDiscount: "10% OFF",
          promoNote: "No pagamento via Pix",
          promoCode: "PIX10",
          promoUrl: "https://example.com/pix",
          navLinks: [
            { label: "Loja", url: "https://example.com/" },
            { label: "Trocas", url: "https://example.com/trocas" },
            { label: "Contato", url: "https://example.com/contato" },
          ],
        },
        blocks: [
          product({ label: "", title: "Tênis Court", description: "", price: "R$429", buttonText: "Ver", url: "https://example.com/court", imageUrl: unsplash("1491553895911-0055eca6402d", 700) }),
          product({ label: "", title: "Meia Premium", description: "", price: "R$49", buttonText: "Ver", url: "https://example.com/meia", imageUrl: unsplash("1586350977771-b3b0abd50c82", 700) }),
          product({ label: "", title: "Boné Classic", description: "", price: "R$129", buttonText: "Ver", url: "https://example.com/bone", imageUrl: unsplash("1521369909029-2afed882baee", 700) }),
        ],
      }),
  },
  {
    id: "bf-banner",
    name: "Banner Black Friday",
    category: "Campanha",
    plan: "premium",
    tab: "premium",
    description: "Banner promocional com confete, foto, 'BLACK FRIDAY' gigante, botão e selos de desconto inclinados. Ofertas e redes abaixo.",
    swatch: { background: "#141414", accent: "#e8185d", text: "#ffffff" },
    build: (name) =>
      page(name, {
        profile: {
          bio: "As melhores ofertas do ano em um só lugar. Descontos imperdíveis por tempo limitado — aproveite antes que acabe.",
          coverUrl: unsplash("1483985988355-763728e1935b", 1200),
          floatingWhatsapp: "(11) 99999-0000",
        },
        socials: [
          { platform: "instagram", url: "https://www.instagram.com/" },
          { platform: "facebook", url: "https://www.facebook.com/" },
          { platform: "youtube", url: "https://www.youtube.com/" },
          { platform: "tiktok", url: "https://www.tiktok.com/" },
        ],
        theme: { premium: "promo", background: "#141414", text: "#ffffff", accent: "#e8185d", font: "sans" },
        premium: {
          promoBadge: "OFERTA ESPECIAL",
          heroSlides: [
            { imageUrl: unsplash("1483985988355-763728e1935b", 1200), headline: "BLACK\nFRIDAY", productLabel: "", productName: "", priceFrom: "", price: "", url: "https://example.com/ofertas" },
          ],
          promoButton: "COMPRAR AGORA",
          promoUrl: "https://example.com/ofertas",
          featureTags: ["50%", "60%"],
          navLinks: [
            { label: "Início", url: "https://example.com/" },
            { label: "Loja", url: "https://example.com/loja" },
            { label: "Galeria", url: "https://example.com/galeria" },
            { label: "Contato", url: "https://example.com/contato" },
          ],
        },
        blocks: [
          link({ display: "banner", label: "CUPOM", title: "Ganhe 50% OFF na primeira compra", buttonText: "Aproveitar", url: "https://example.com/cupom" }),
          link({ display: "button", label: "FRETE GRÁTIS", title: "Em todo o site nesta semana", buttonText: "Ver regras", url: "https://example.com/frete" }),
          link({ display: "button", label: "NOVIDADES", title: "Coleção Black Friday", buttonText: "Explorar", url: "https://example.com/colecao" }),
        ],
      }),
  },
  {
    id: "black-friday",
    name: "Black Friday",
    category: "Campanha",
    plan: "premium",
    tab: "premium",
    description: "Campanha de Black Friday com contagem regressiva e ofertas em destaque. Edite preços, produtos e a data final.",
    swatch: { background: "#000000", accent: "#ffcc00", text: "#ffffff" },
    build: (name) =>
      page(name, {
        profile: { bio: "⚡ Ofertas por tempo limitado" },
        theme: {
          premium: "",
          layout: "classic",
          background: "#000000",
          background2: "#000000",
          text: "#ffffff",
          accent: "#ffcc00",
          buttonBackground: "#ffcc00",
          buttonText: "#000000",
          buttonShape: "pill",
          buttonStyle: "fill",
          font: "sans",
        },
        blocks: [
          { id: id(), enabled: true, type: "heading", text: "BLACK FRIDAY", style: "display" },
          { id: id(), enabled: true, type: "heading", text: "Até 70% OFF", style: "badge" },
          { id: id(), enabled: true, type: "text", text: "As maiores ofertas do ano, só esta semana. Garanta a sua antes que o tempo acabe.", style: "plain", title: "" },
          { id: id(), enabled: true, type: "countdown", title: "A oferta termina em:", endsAt: "2026-11-28T23:59:59" },
          product({
            label: "-60%",
            title: "Mentoria Estratégica",
            description: "De R$497 por R$197. Acompanhamento completo para organizar sua estratégia e fazer sua marca crescer.",
            price: "R$197",
            buttonText: "GARANTIR OFERTA",
            url: "https://example.com/mentoria",
            imageUrl: unsplash("1519389950473-47ba0277781c", 1400),
          }),
          product({
            label: "-50%",
            title: "Curso Completo",
            description: "De R$297 por R$147. Do zero ao avançado, com acesso vitalício e certificado.",
            price: "R$147",
            buttonText: "QUERO ESTE",
            url: "https://example.com/curso",
            imageUrl: unsplash("1516321318423-f06f85e504b3", 1400),
          }),
          product({
            label: "COMBO · -70%",
            title: "Combo Completo",
            description: "Leve tudo com o maior desconto do ano. De R$794 por R$297.",
            price: "R$297",
            buttonText: "QUERO O COMBO",
            url: "https://example.com/combo",
            imageUrl: unsplash("1607082348824-0a96f2a4b9da", 1400),
          }),
          link({ display: "button", highlight: true, title: "Tirar dúvidas no WhatsApp", url: "https://wa.me/5511999990000" }),
        ],
      }),
  },
  {
    id: "autoridade",
    name: "Autoridade",
    category: "Profissional",
    plan: "premium",
    tab: "premium",
    description: "Banners editáveis para serviços, cursos, palestras e conteúdo.",
    swatch: { background: "#080f1c", accent: "#3565ed", text: "#f5f6fa" },
    build: (name) =>
      page(name, {
        profile: { bio: "@suamarca" },
        theme: { premium: "authority", background: "#080f1c", text: "#f5f6fa", accent: "#20c879" },
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
    tab: "premium",
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
    tab: "premium",
    description: "Retrato, indicadores ilustrativos e cartões de projetos. Edite com seus próprios dados.",
    swatch: { background: "#030303", accent: "#ff3469", text: "#f7f7f7" },
    build: (name) =>
      page(name, {
        profile: { bio: "Empreendedor, especialista e mentor", coverUrl: unsplash("1560250097-0b93528c311a", 1000), logo: "/assets/logo-exemplo.svg" },
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
    tab: "premium",
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
  {
    id: "experiencia",
    name: "Presença Profissional",
    category: "Profissional",
    plan: "premium",
    tab: "premium",
    description: "Perfil escuro com seletor de público (ex.: cliente / parceiro), números, vídeo e botões — tudo editável.",
    swatch: { background: "#0a0a0f", accent: "#a78bfa", text: "#f5f5f5" },
    build: (name) =>
      page(name, {
        profile: {
          bio: "",
          coverUrl: unsplash("1560250097-0b93528c311a", 1200),
          logo: "/assets/logo-exemplo.svg",
          floatingWhatsapp: "(11) 99999-0000",
        },
        theme: { premium: "experience", background: "#0a0a0f", text: "#f5f5f5", accent: "#a78bfa", font: "sans" },
        premium: {
          tagline: "Sua frase de posicionamento",
          credential: "Seu registro profissional",
          audienceA: "Sou cliente",
          audienceB: "Sou parceiro",
        },
        blocks: [
          {
            id: id(),
            enabled: true,
            type: "stats",
            items: [
              { value: "+10", label: "anos de experiência" },
              { value: "+5 mil", label: "atendimentos" },
              { value: "Sua cidade", label: "onde você atua" },
            ],
          },
          // Público A (ex.: cliente)
          { id: id(), enabled: true, type: "heading", text: "Um atendimento para cada pessoa.", style: "display", audience: "a" },
          { id: id(), enabled: true, type: "youtube", url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", audience: "a" },
          { id: id(), enabled: true, type: "text", text: "Depoimentos e nomes de quem já passou por aqui.", style: "plain", title: "", audience: "a" },
          { id: id(), enabled: true, type: "text", text: "Conte como funciona o seu atendimento e por que ele é diferente.", style: "plain", title: "", audience: "a" },
          link({ display: "button", highlight: true, title: "Agendar avaliação", buttonText: "", url: "https://wa.me/5511999990000", audience: "a" }),
          link({ display: "button", title: "Atendimento para outras cidades", url: "https://example.com/outras-cidades", audience: "a" }),
          // Público B (ex.: parceiro / profissional)
          { id: id(), enabled: true, type: "heading", text: "Mais que um curso. Uma imersão real.", style: "display", audience: "b" },
          { id: id(), enabled: true, type: "youtube", url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", audience: "b" },
          link({ display: "card", label: "AO VIVO", title: "Prática supervisionada", subtitle: "Acompanhe casos reais em tempo real", url: "https://example.com/pratica", audience: "b" }),
          link({ display: "card", label: "MÉTODO", title: "Do diagnóstico à decisão", subtitle: "Um sistema claro e replicável", url: "https://example.com/metodo", audience: "b" }),
          link({ display: "card", label: "DIGITAL", title: "Ferramentas e tecnologia", subtitle: "Fluxo de trabalho moderno", url: "https://example.com/digital", audience: "b" }),
          link({ display: "card", label: "APLICAÇÃO", title: "Use no dia seguinte", subtitle: "Para colocar em prática já", url: "https://example.com/aplicacao", audience: "b" }),
          link({ display: "button", highlight: true, title: "Próxima turma", buttonText: "", url: "https://wa.me/5511999990000", audience: "b" }),
          link({ display: "button", title: "Conheça o instituto", url: "https://example.com/instituto", audience: "b" }),
        ],
      }),
  },
];
