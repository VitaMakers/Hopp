import { nanoid } from "nanoid";
import { page, type PageTemplate, type TemplateCollection } from "./templates";
import type { Block, PageDoc, SocialPlatform, Theme } from "./schema";

// The "Modelos Essenciais" gallery: original starter pages grouped by the
// market's categories. Each model is built from one of twelve structural
// recipes (coloured bands, a cut-out portrait, a video cover, a photo grid,
// a product shelf, a local + FAQ + map page, an embedded player, a card
// stack, a name-first list...), and every category gets a different kit of
// recipes, so the models don't all share the same skeleton. Everything is
// built on the normal theme + block system and stays 100% editable. Photos
// are placeholders (picsum.photos); logos and video covers are bundled in
// /public/assets. All meant to be swapped for the person's own.

const bid = () => nanoid(10);
const pic = (seed: string, w = 800, h = 1000) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

type LinkBlock = Extract<Block, { type: "link" }>;
type L = { t: string; u: string; bt?: string; l?: string; s?: string };

function lk(x: L, extra: Partial<LinkBlock> = {}): Block {
  return { id: bid(), enabled: true, type: "link", title: x.t, url: x.u, imageUrl: "", highlight: false, display: "button", label: x.l ?? "", subtitle: x.s ?? "", buttonText: x.bt ?? "", accent: "", ...extra };
}
function banner(x: L, seed: string): Block {
  return lk(x, { display: "banner", imageUrl: pic(seed, 1000, 700), buttonText: x.bt ?? "Saiba mais" });
}
function sub(title: string, buttonText: string, collectPhone = false): Block {
  return { id: bid(), enabled: true, type: "subscribe", title, buttonText, collectPhone, thankYouMessage: "Prontinho! Recebi seus dados e já já falo com você." };
}
function prodB(p: { label?: string; title: string; description: string; price?: string; seed: string; buttonText: string; url: string }): Block {
  return { id: bid(), enabled: true, type: "product", label: p.label ?? "", price: p.price ?? "", title: p.title, description: p.description, imageUrl: pic(p.seed, 900, 700), buttonText: p.buttonText, url: p.url };
}
function statsB(items: [string, string][]): Block {
  return { id: bid(), enabled: true, type: "stats", items: items.map(([value, label]) => ({ value, label })) };
}
function galB(title: string, seeds: string[], display: "grid" | "carousel" = "grid"): Block {
  return { id: bid(), enabled: true, type: "gallery", title, display, items: seeds.map((s) => ({ imageUrl: pic(s, 600, 600), url: "" })) };
}
function hd(text: string, style: Extract<Block, { type: "heading" }>["style"] = "divider"): Block {
  return { id: bid(), enabled: true, type: "heading", text, style };
}
function faqB(items: [string, string][]): Block {
  return { id: bid(), enabled: true, type: "faq", title: "Perguntas frequentes", items: items.map(([question, answer]) => ({ question, answer })) };
}
function mapB(title: string, address: string): Block {
  return { id: bid(), enabled: true, type: "map", title, address };
}
function embedB(e: { kind: "youtube" | "spotify"; url: string }): Block {
  return e.kind === "youtube" ? { id: bid(), enabled: true, type: "youtube", url: e.url } : { id: bid(), enabled: true, type: "spotify", url: e.url };
}
function waB(phone: string, buttonText: string): Block {
  return { id: bid(), enabled: true, type: "whatsapp", phone, message: "Olá! Vim pela sua página.", buttonText };
}
function ytB(url: string): Block {
  return { id: bid(), enabled: true, type: "youtube", url };
}

type Pal = { bg: string; text: string; btn: string; btnText: string; accent: string };
const PAL = {
  ink: { bg: "#0e1116", text: "#f5f5f4", btn: "#f5f5f4", btnText: "#0e1116", accent: "#8b5cf6" },
  plum: { bg: "#1a0b2e", text: "#f3e9ff", btn: "#c084fc", btnText: "#1a0b2e", accent: "#e879f9" },
  cream: { bg: "#f7f3ec", text: "#2a2420", btn: "#2a2420", btnText: "#f7f3ec", accent: "#c2703d" },
  rose: { bg: "#fff1f2", text: "#4c1130", btn: "#be123c", btnText: "#fff1f2", accent: "#f43f5e" },
  sand: { bg: "#faf6f0", text: "#3b2f2a", btn: "#a07855", btnText: "#ffffff", accent: "#c59d5f" },
  forest: { bg: "#0b2f23", text: "#eafff4", btn: "#34d399", btnText: "#07241a", accent: "#10b981" },
  ocean: { bg: "#071b2c", text: "#e6f6ff", btn: "#38bdf8", btnText: "#04121d", accent: "#22d3ee" },
  sun: { bg: "#1b1206", text: "#fff7e8", btn: "#f59e0b", btnText: "#1b1206", accent: "#fbbf24" },
  mono: { bg: "#101114", text: "#eaeaea", btn: "#eaeaea", btnText: "#101114", accent: "#9ca3af" },
  berry: { bg: "#2b0a1a", text: "#ffe4ef", btn: "#fb7185", btnText: "#2b0a1a", accent: "#fb7185" },
  mint: { bg: "#f0fdf9", text: "#0f3d33", btn: "#0f766e", btnText: "#f0fdf9", accent: "#14b8a6" },
  night: { bg: "#0a0f1f", text: "#e7ecff", btn: "#6366f1", btnText: "#ffffff", accent: "#818cf8" },
  clay: { bg: "#f5efe6", text: "#3a2e24", btn: "#b45309", btnText: "#ffffff", accent: "#d97706" },
  slate: { bg: "#0f172a", text: "#e2e8f0", btn: "#e2e8f0", btnText: "#0f172a", accent: "#38bdf8" },
  blush: { bg: "#fdf2f8", text: "#500724", btn: "#db2777", btnText: "#ffffff", accent: "#ec4899" },
  lime: { bg: "#141a07", text: "#f7ffe0", btn: "#a3e635", btnText: "#141a07", accent: "#bef264" },
  preto: { bg: "#000000", text: "#ffffff", btn: "#ffffff", btnText: "#0a0a0a", accent: "#f59e0b" },
} satisfies Record<string, Pal>;

type Video = "aurora" | "sunset" | "forest" | "mono";

// Category content the recipes draw from.
type Cat = {
  id: string;
  name: string;
  swatch: { background: string; accent: string; text: string };
  socials: [SocialPlatform, string][];
  wa?: string;
  pals: (keyof typeof PAL)[];
  fonts: Theme["font"][];
  bio: string;
  names: string[];
  kit: RecipeKey[];
  vid: Video;
  logo?: string;
  primary: L;
  links: L[];
  gal: string[];
  stats?: [string, string][];
  products?: Parameters<typeof prodB>[0][];
  faq?: [string, string][];
  address?: string;
  embed?: { kind: "youtube" | "spotify"; url: string };
};

type Piece = { layout: Theme["layout"]; blocks: Block[]; video?: Video; logo?: string; shape?: Theme["buttonShape"]; style?: Theme["buttonStyle"]; pal?: keyof typeof PAL };
type Recipe = (c: Cat, mid: string) => Piece;

const g4 = (c: Cat) => c.gal.slice(0, 4);
const g3 = (c: Cat) => c.gal.slice(0, 3);

// The twelve structural recipes. Each has its own layout and block makeup, so
// two models built from different recipes never share a skeleton.
const RECIPES = {
  // Coloured bands (name/tagline/socials) + a photo grid.
  faixaGrade: (c): Piece => ({
    layout: "band", shape: "square", style: "fill",
    blocks: [lk(c.primary, { display: "button" }), galB("Destaques", g4(c)), lk(c.links[0], { display: "card" })],
  }),
  // Cut-out portrait + a highlighted button and two cards.
  recorteCartoes: (c): Piece => ({
    layout: "cutout", shape: "pill", style: "fill",
    blocks: [lk(c.primary, { highlight: true, display: "button" }), lk(c.links[0], { display: "card" }), lk(c.links[1], { display: "card" })],
  }),
  // Full-screen video cover + a banner, a card and an e-mail capture.
  capaVideoBanner: (c, mid): Piece => ({
    layout: "poster", shape: "square", style: "outline", video: c.vid,
    blocks: [banner(c.primary, `${mid}-b`), lk(c.links[0], { display: "card" }), sub("Receba as novidades por e-mail", "Quero receber")],
  }),
  // Logo header + photo grid + a highlight and a card.
  logoGrade: (c): Piece => ({
    layout: "classic", shape: "rounded", style: "fill", logo: c.logo ?? "/assets/logo-mono.svg",
    blocks: [galB("", g3(c)), lk(c.primary, { highlight: true, display: "button" }), lk(c.links[0], { display: "card" })],
  }),
  // Big photo header + a banner, numbers and a card.
  fotoGrandeStats: (c, mid): Piece => ({
    layout: "hero", shape: "square", style: "fill",
    blocks: [banner(c.primary, `${mid}-b`), statsB(c.stats ?? [["+500", "clientes"], ["10", "anos"], ["4.9", "nota"]]), lk(c.links[0], { display: "card" })],
  }),
  // Floating card + a stack of link cards.
  cartaoPilha: (c): Piece => ({
    layout: "card", shape: "rounded", style: "soft",
    blocks: [lk(c.primary, { display: "card" }), lk(c.links[0], { display: "card" }), lk(c.links[1], { display: "card" }), lk(c.links[2] ?? c.links[0], { display: "button" })],
  }),
  // Name-first header + a divider and a short list.
  soNomeLista: (c): Piece => ({
    layout: "name", shape: "pill", style: "soft",
    blocks: [hd("LINKS", "divider"), lk(c.primary, { display: "card" }), lk(c.links[0], { display: "card" }), sub("Entre na lista e receba primeiro", "Entrar na lista")],
  }),
  // Cover banner header + a banner and two links.
  capaBanner: (c, mid): Piece => ({
    layout: "cover", shape: "rounded", style: "fill",
    blocks: [banner(c.primary, `${mid}-b`), lk(c.links[0], { display: "card" }), lk(c.links[1], { display: "button" })],
  }),
  // Product shelf (two products + a button).
  vitrineProdutos: (c): Piece => ({
    layout: "poster", shape: "rounded", style: "fill",
    blocks: [prodB(c.products![0]), prodB(c.products![1]), lk(c.primary, { display: "button" })],
  }),
  // Local business: a highlight, an FAQ and a map.
  localFaqMapa: (c): Piece => ({
    layout: "classic", shape: "rounded", style: "fill",
    blocks: [lk(c.primary, { highlight: true, display: "button" }), faqB(c.faq!), mapB("Onde estamos", c.address!)],
  }),
  // Embedded player (YouTube/Spotify) + two links, on bands.
  midiaEmbed: (c): Piece => ({
    layout: "band", shape: "square", style: "outline",
    blocks: [embedB(c.embed!), lk(c.links[0], { display: "card" }), lk(c.primary, { display: "button" })],
  }),
  // Cut-out portrait with a video + a banner and a card.
  recorteVideo: (c, mid): Piece => ({
    layout: "cutout", shape: "square", style: "fill", video: c.vid,
    blocks: [banner(c.primary, `${mid}-b`), lk(c.links[0], { display: "card" })],
  }),
  // Full-bleed photo/video with the name centred over it (Cloud Layers).
  telaCheia: (c): Piece => ({
    layout: "fullscreen", shape: "pill", style: "fill", video: c.vid,
    blocks: [lk(c.primary, { display: "button" }), lk(c.links[0], { display: "card" }), sub("Receba as novidades por e-mail", "Quero receber")],
  }),
  // A large framed portrait at the top, then a highlight and two cards.
  retratoGrande: (c): Piece => ({
    layout: "portrait", shape: "rounded", style: "soft",
    blocks: [lk(c.primary, { highlight: true, display: "button" }), lk(c.links[0], { display: "card" }), lk(c.links[1], { display: "card" })],
  }),
  // Logo header + a horizontal photo carousel + a highlight and a card.
  carrossel: (c): Piece => ({
    layout: "classic", shape: "rounded", style: "fill", logo: c.logo ?? "/assets/logo-sol.svg",
    blocks: [galB("Destaques", c.gal, "carousel"), lk(c.primary, { highlight: true, display: "button" }), lk(c.links[0], { display: "card" })],
  }),
  // Dark bar/restaurant page: full photo cover, then bold buttons with icons
  // (WhatsApp reservation, menu, delivery, location) and a video at the end.
  botecoDark: (c): Piece => ({
    layout: "capacheia", shape: "rounded", style: "fill", pal: "preto",
    blocks: [
      waB(c.wa ?? "(11) 90000-0000", "FAÇA SUA RESERVA"),
      lk({ t: "PEÇA O DELIVERY", u: c.links[0].u }, { display: "button", imageUrl: "/assets/ic-delivery.svg" }),
      lk({ t: "CARDÁPIO DIGITAL", u: c.primary.u }, { display: "button", imageUrl: "/assets/ic-cardapio.svg" }),
      lk({ t: "LOCALIZAÇÃO", u: "https://maps.google.com/" }, { display: "button", imageUrl: "/assets/ic-local.svg" }),
      ytB("https://www.youtube.com/watch?v=aqz-KE-bpKQ"),
    ],
  }),
  // Same dark restaurant style, but with a video cover instead of a photo.
  botecoVideo: (c): Piece => ({
    layout: "capacheia", shape: "rounded", style: "fill", pal: "preto", video: c.vid,
    blocks: [
      waB(c.wa ?? "(11) 90000-0000", "FAÇA SUA RESERVA"),
      lk({ t: "PEÇA O DELIVERY", u: c.links[0].u }, { display: "button", imageUrl: "/assets/ic-delivery.svg" }),
      lk({ t: "CARDÁPIO DIGITAL", u: c.primary.u }, { display: "button", imageUrl: "/assets/ic-cardapio.svg" }),
      lk({ t: "LOCALIZAÇÃO", u: "https://maps.google.com/" }, { display: "button", imageUrl: "/assets/ic-local.svg" }),
      ytB("https://www.youtube.com/watch?v=aqz-KE-bpKQ"),
    ],
  }),
  // Dark nightlife page: video cover, bold buttons for tickets, line-up and
  // location, plus a video.
  noiteDark: (c): Piece => ({
    layout: "capacheia", shape: "rounded", style: "fill", pal: "preto", video: c.vid,
    blocks: [
      lk({ t: "COMPRAR INGRESSO", u: c.primary.u }, { display: "button", highlight: true }),
      lk({ t: "LINE-UP DA NOITE", u: c.links[0].u }, { display: "button" }),
      lk({ t: "LOCALIZAÇÃO", u: "https://maps.google.com/" }, { display: "button", imageUrl: "/assets/ic-local.svg" }),
      ytB("https://www.youtube.com/watch?v=aqz-KE-bpKQ"),
    ],
  }),
} satisfies Record<string, Recipe>;
type RecipeKey = keyof typeof RECIPES;

const CATS: Cat[] = [
  {
    id: "loja", name: "🛍️ Loja", swatch: { background: PAL.clay.bg, accent: PAL.clay.accent, text: PAL.clay.text },
    socials: [["instagram", "https://instagram.com/"], ["tiktok", "https://tiktok.com/"], ["pinterest", "https://pinterest.com/"]], wa: "(11) 99999-0000",
    pals: ["blush", "ink", "clay", "sand"], fonts: ["condensed", "rounded", "serif", "sans"], vid: "mono",
    bio: "Novidades da semana, fretes e condições especiais. Escolha por onde começar 👇",
    names: ["Jaya Store", "Drop Noturno", "Vitrine Essencial", "Feito à Mão", "Mostruário", "Loja em Tela"],
    kit: ["faixaGrade", "capaVideoBanner", "vitrineProdutos", "carrossel", "recorteCartoes", "telaCheia"],
    primary: { t: "Ver catálogo completo", u: "https://example.com/catalogo", bt: "Explorar loja" },
    links: [{ t: "Promoções da semana", l: "OFERTAS", s: "Até 40% off", u: "https://example.com/ofertas" }, { t: "Comprar no WhatsApp", u: "https://wa.me/5511999990000" }, { t: "Como comprar", u: "https://example.com/ajuda" }],
    gal: ["loja-g1", "loja-g2", "loja-g3", "loja-g4"],
    products: [
      { label: "DESTAQUE", title: "Kit Presente", description: "Nossa combinação mais pedida, embalada para presentear.", price: "R$ 149", seed: "loja-p1", buttonText: "Comprar", url: "https://example.com/kit" },
      { label: "NOVO", title: "Edição Especial", description: "Produção limitada, com acabamento exclusivo.", price: "R$ 89", seed: "loja-p2", buttonText: "Ver produto", url: "https://example.com/especial" },
    ],
  },
  {
    id: "criadores", name: "💫 Criadores de conteúdo", swatch: { background: PAL.ink.bg, accent: PAL.ink.accent, text: PAL.ink.text },
    socials: [["instagram", "https://instagram.com/"], ["youtube", "https://youtube.com/"], ["tiktok", "https://tiktok.com/"]],
    pals: ["ink", "plum", "night", "mono"], fonts: ["condensed", "rounded", "sans", "mono"], vid: "aurora",
    bio: "Criador de conteúdo · bastidores, colabs e tudo o que rola por aqui 💜",
    names: ["Creator Hub", "Em Vídeo", "Todos os Links", "No Ar", "Minha Lista", "Em Destaque"],
    kit: ["capaVideoBanner", "midiaEmbed", "cartaoPilha", "recorteCartoes", "soNomeLista", "fotoGrandeStats"],
    primary: { t: "Para marcas: mídia kit", u: "https://example.com/midiakit", bt: "Quero ver" },
    links: [{ t: "Último vídeo", l: "NOVO", s: "Sai todo sábado", u: "https://youtube.com/" }, { t: "Cupom de desconto", l: "CUPOM", s: "Use MEUNOME10", u: "https://example.com/cupom" }, { t: "Meu TikTok", u: "https://tiktok.com/" }],
    gal: ["cri-g1", "cri-g2", "cri-g3", "cri-g4"],
    embed: { kind: "youtube", url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ" },
  },
  {
    id: "esporte", name: "🏋️ Esporte e Fitness", swatch: { background: PAL.lime.bg, accent: PAL.lime.accent, text: PAL.lime.text },
    socials: [["instagram", "https://instagram.com/"]], wa: "(11) 97777-0000",
    pals: ["lime", "ink", "slate", "mint"], fonts: ["condensed", "tech", "sans", "rounded"], vid: "forest",
    bio: "Personal trainer · planos online e presenciais. Bora evoluir 💪",
    names: ["Treino & Resultado", "Box Funcional", "Minhas Metas", "Nutri Esportiva", "Alta Performance", "Em Movimento"],
    kit: ["fotoGrandeStats", "faixaGrade", "soNomeLista", "recorteCartoes", "telaCheia", "capaBanner"],
    primary: { t: "Montar meu treino", u: "https://wa.me/5511977770000", bt: "Falar comigo" },
    links: [{ t: "Planos e valores", l: "PLANOS", s: "Mensal, trimestral e anual", u: "https://example.com/planos" }, { t: "Horários das turmas", s: "Manhã, tarde e noite", u: "https://example.com/horarios" }, { t: "Aula experimental grátis", u: "https://wa.me/5511977770000" }],
    gal: ["esp-g1", "esp-g2", "esp-g3", "esp-g4"],
    stats: [["+500", "alunos"], ["10", "anos"], ["100%", "online"]],
  },
  {
    id: "criativo", name: "🎨 Criativo", swatch: { background: PAL.plum.bg, accent: PAL.plum.accent, text: PAL.plum.text },
    socials: [["instagram", "https://instagram.com/"], ["linkedin", "https://linkedin.com/"]],
    pals: ["plum", "mono", "ink", "rose"], fonts: ["elegant", "serif", "sans", "rounded"], vid: "aurora", logo: "/assets/logo-mono.svg",
    bio: "Direção de arte & design. Uma seleção dos meus projetos recentes.",
    names: ["Portfólio Criativo", "Fotografia Autoral", "Estúdio de Branding", "Ilustração", "Mostra Visual", "Em Foco"],
    kit: ["carrossel", "capaVideoBanner", "recorteCartoes", "cartaoPilha", "logoGrade", "retratoGrande"],
    primary: { t: "Ver portfólio completo", u: "https://example.com/portfolio", bt: "Explorar" },
    links: [{ t: "Orçamento de projeto", s: "Conte sua ideia", u: "https://example.com/orcamento" }, { t: "Serviços", s: "Identidade, web e social", u: "https://example.com/servicos" }, { t: "Loja de prints", u: "https://example.com/prints" }],
    gal: ["cria-g1", "cria-g2", "cria-g3", "cria-g4"],
  },
  {
    id: "comida", name: "🍕 Comida e bebida", swatch: { background: PAL.sun.bg, accent: PAL.sun.accent, text: PAL.sun.text },
    socials: [["instagram", "https://instagram.com/"]], wa: "(11) 95555-0000",
    pals: ["sun", "clay", "ink", "cream"], fonts: ["serif", "elegant", "condensed", "rounded"], vid: "sunset",
    bio: "Sabor de verdade, feito na hora. Confira o cardápio e peça 🍔",
    names: ["Cardápio Digital", "Nossa Vitrine", "Onde Estamos", "Cantina", "Mesa Posta", "Sabor da Casa", "Boteco Noturno", "Boteco (vídeo)"],
    kit: ["capaBanner", "vitrineProdutos", "localFaqMapa", "retratoGrande", "faixaGrade", "carrossel", "botecoDark", "botecoVideo"],
    primary: { t: "Ver cardápio", u: "https://example.com/cardapio", bt: "Abrir cardápio" },
    links: [{ t: "Pedir pelo WhatsApp", u: "https://wa.me/5511955550000" }, { t: "Peça no iFood", s: "Entrega rápida", u: "https://ifood.com.br/" }, { t: "Reservar mesa", u: "https://wa.me/5511955550000" }],
    gal: ["com-g1", "com-g2", "com-g3", "com-g4"],
    products: [
      { label: "MAIS PEDIDO", title: "Combo da Casa", description: "Prato principal, acompanhamento e bebida.", price: "R$ 45", seed: "com-p1", buttonText: "Pedir", url: "https://wa.me/5511955550000" },
      { label: "DOCE", title: "Sobremesa Especial", description: "Para fechar com chave de ouro.", price: "R$ 18", seed: "com-p2", buttonText: "Quero", url: "https://wa.me/5511955550000" },
    ],
    faq: [["Vocês entregam?", "Sim, em toda a região. Consulte a taxa pelo WhatsApp."], ["Qual o horário?", "Terça a domingo, das 18h às 23h."]],
    address: "Av. Paulista, 1000 - São Paulo",
  },
  {
    id: "imobiliaria", name: "🏠 Imobiliária", swatch: { background: PAL.slate.bg, accent: PAL.slate.accent, text: PAL.slate.text },
    socials: [["instagram", "https://instagram.com/"], ["linkedin", "https://linkedin.com/"]], wa: "(11) 93333-0000",
    pals: ["slate", "night", "ink", "ocean"], fonts: ["sans", "elegant", "serif", "mono"], vid: "mono", logo: "/assets/logo-mono.svg",
    bio: "Encontro o imóvel certo para o seu momento. Vamos conversar?",
    names: ["Corretor de Imóveis", "Lançamento", "Fale Comigo", "Carteira de Imóveis", "Imóvel em Tela", "Portfólio de Imóveis"],
    kit: ["logoGrade", "telaCheia", "localFaqMapa", "cartaoPilha", "fotoGrandeStats", "capaBanner"],
    primary: { t: "Imóveis à venda", u: "https://example.com/venda", bt: "Ver ofertas" },
    links: [{ t: "Imóveis para alugar", l: "ALUGUEL", s: "Atualizado toda semana", u: "https://example.com/aluguel" }, { t: "Quero vender meu imóvel", s: "Avaliação gratuita", u: "https://wa.me/5511933330000" }, { t: "Agendar visita", u: "https://wa.me/5511933330000" }],
    gal: ["imo-g1", "imo-g2", "imo-g3", "imo-g4"],
    faq: [["Como funciona a visita?", "Agende pelo WhatsApp e eu levo você a conhecer o imóvel."], ["Trabalha com financiamento?", "Sim, ajudo em toda a parte de documentação e crédito."]],
    address: "Rua das Palmeiras, 250 - São Paulo",
  },
  {
    id: "beleza", name: "💄 Beleza", swatch: { background: PAL.blush.bg, accent: PAL.blush.accent, text: PAL.blush.text },
    socials: [["instagram", "https://instagram.com/"]], wa: "(11) 91111-0000",
    pals: ["blush", "berry", "rose", "mono"], fonts: ["elegant", "serif", "rounded", "condensed"], vid: "sunset",
    bio: "Cabelo, unhas e estética. Agende seu momento de cuidado ✨",
    names: ["Studio de Beleza", "Maquiagem", "Minha Agenda", "Skincare", "Retrato Beauty", "Galeria Beauty"],
    kit: ["faixaGrade", "retratoGrande", "soNomeLista", "recorteCartoes", "capaVideoBanner", "carrossel"],
    primary: { t: "Agendar horário", u: "https://example.com/agenda", bt: "Marcar agora" },
    links: [{ t: "Nossos serviços", l: "SERVIÇOS", s: "Tabela com preços", u: "https://example.com/servicos" }, { t: "Pacote noiva", s: "Prova + dia do casamento", u: "https://example.com/noiva" }, { t: "Ver trabalhos", u: "https://instagram.com/" }],
    gal: ["bel-g1", "bel-g2", "bel-g3", "bel-g4"],
  },
  {
    id: "eventos", name: "🎤 Eventos", swatch: { background: PAL.night.bg, accent: PAL.night.accent, text: PAL.night.text },
    socials: [["instagram", "https://instagram.com/"]],
    pals: ["night", "berry", "ink", "plum"], fonts: ["condensed", "sans", "tech", "serif"], vid: "aurora",
    bio: "A noite que você não vai querer perder. Garanta seu ingresso.",
    names: ["Festa & Line-up", "O Evento", "Programação", "Workshop", "Em Cartaz", "Grande Noite"],
    kit: ["capaVideoBanner", "fotoGrandeStats", "cartaoPilha", "soNomeLista", "telaCheia", "faixaGrade"],
    primary: { t: "Comprar ingresso", u: "https://example.com/ingressos", bt: "Garantir" },
    links: [{ t: "Ver atrações", l: "LINE-UP", s: "Horários e palcos", u: "https://example.com/lineup" }, { t: "Local e regras", u: "https://example.com/local" }, { t: "Seja patrocinador", s: "Planos e cotas", u: "https://example.com/patrocinio" }],
    gal: ["eve-g1", "eve-g2", "eve-g3", "eve-g4"],
    stats: [["2 dias", "de evento"], ["+20", "atrações"], ["3", "palcos"]],
  },
  {
    id: "negocios", name: "💼 Negócios", swatch: { background: PAL.slate.bg, accent: PAL.slate.accent, text: PAL.slate.text },
    socials: [["linkedin", "https://linkedin.com/"], ["instagram", "https://instagram.com/"]],
    pals: ["slate", "ink", "night", "sand"], fonts: ["sans", "condensed", "serif", "mono"], vid: "mono", logo: "/assets/logo-mono.svg",
    bio: "Ajudo empresas a crescer com estratégia e método. Conheça meu trabalho.",
    names: ["Consultoria", "Resultados", "Soluções", "Mentoria", "Autoridade", "Em Números"],
    kit: ["logoGrade", "fotoGrandeStats", "cartaoPilha", "recorteCartoes", "capaBanner", "soNomeLista"],
    primary: { t: "Agendar diagnóstico", u: "https://example.com/diagnostico", bt: "Marcar conversa" },
    links: [{ t: "Como eu trabalho", s: "Etapas e entregáveis", u: "https://example.com/metodo" }, { t: "Cases e resultados", s: "Clientes reais", u: "https://example.com/cases" }, { t: "Pedir proposta", s: "Resposta em 24h", u: "https://example.com/proposta" }],
    gal: ["neg-g1", "neg-g2", "neg-g3", "neg-g4"],
    stats: [["+80", "clientes"], ["5x", "ROI médio"], ["7", "anos"]],
  },
  {
    id: "moda", name: "👗 Moda", swatch: { background: PAL.mono.bg, accent: PAL.mono.accent, text: PAL.mono.text },
    socials: [["instagram", "https://instagram.com/"], ["tiktok", "https://tiktok.com/"]], wa: "(11) 90000-4444",
    pals: ["mono", "sand", "clay", "blush"], fonts: ["elegant", "serif", "condensed", "sans"], vid: "mono",
    bio: "Nova coleção no ar. Peças atemporais, feitas para durar.",
    names: ["Marca de Moda", "Vitrine", "Consultoria de Imagem", "Brechó", "Editorial", "Lookbook"],
    kit: ["telaCheia", "vitrineProdutos", "recorteCartoes", "faixaGrade", "carrossel", "retratoGrande"],
    primary: { t: "Comprar a coleção", u: "https://example.com/colecao", bt: "Ver peças" },
    links: [{ t: "Lookbook", s: "Inspiração de looks", u: "https://example.com/lookbook" }, { t: "Encontre seu tamanho", u: "https://example.com/tamanhos" }, { t: "Comprar no WhatsApp", u: "https://wa.me/5511900004444" }],
    gal: ["mod-g1", "mod-g2", "mod-g3", "mod-g4"],
    products: [
      { label: "NOVO", title: "Peça Statement", description: "O destaque da nova coleção, em tiragem limitada.", price: "R$ 259", seed: "mod-p1", buttonText: "Comprar", url: "https://example.com/peca" },
      { label: "BÁSICO", title: "Essencial do Guarda-roupa", description: "Aquela peça que combina com tudo.", price: "R$ 129", seed: "mod-p2", buttonText: "Ver", url: "https://example.com/essencial" },
    ],
  },
  {
    id: "bemestar", name: "🌿 Bem-estar e Saúde", swatch: { background: PAL.mint.bg, accent: PAL.mint.accent, text: PAL.mint.text },
    socials: [["instagram", "https://instagram.com/"]], wa: "(11) 90000-6666",
    pals: ["mint", "forest", "sand", "cream"], fonts: ["serif", "elegant", "rounded", "sans"], vid: "forest",
    bio: "Cuidar de você importa. Atendimento acolhedor, online e presencial.",
    names: ["Terapia & Psicologia", "Vida Saudável", "Yoga & Meditação", "Spa & Relax", "Autocuidado", "Equilíbrio"],
    kit: ["retratoGrande", "capaBanner", "faixaGrade", "soNomeLista", "recorteVideo", "cartaoPilha"],
    primary: { t: "Agendar sessão", u: "https://example.com/agenda", bt: "Marcar sessão" },
    links: [{ t: "Como funciona o atendimento", s: "Sigiloso e seguro", u: "https://example.com/como" }, { t: "Planos de acompanhamento", u: "https://example.com/planos" }, { t: "Tire suas dúvidas", u: "https://wa.me/5511900006666" }],
    gal: ["bem-g1", "bem-g2", "bem-g3", "bem-g4"],
  },
  {
    id: "entretenimento", name: "🎭 Entretenimento", swatch: { background: PAL.berry.bg, accent: PAL.berry.accent, text: PAL.berry.text },
    socials: [["instagram", "https://instagram.com/"], ["youtube", "https://youtube.com/"], ["spotify", "https://open.spotify.com/"]],
    pals: ["berry", "night", "sun", "plum"], fonts: ["condensed", "tech", "serif", "sans"], vid: "sunset",
    bio: "Shows, próximos projetos e tudo sobre mim em um só lugar.",
    names: ["Artista", "No Palco", "Stand-up", "DJ Set", "Em Turnê", "Nos Trends", "Balada"],
    kit: ["capaVideoBanner", "midiaEmbed", "recorteCartoes", "cartaoPilha", "telaCheia", "fotoGrandeStats", "noiteDark"],
    primary: { t: "Próximos shows", u: "https://example.com/agenda", bt: "Ver datas" },
    links: [{ t: "Assista agora", l: "NOVO", s: "Clipe recém-lançado", u: "https://youtube.com/" }, { t: "Contratação", s: "Festas e eventos", u: "https://example.com/contato" }, { t: "Cortes e vídeos", u: "https://youtube.com/" }],
    gal: ["ent-g1", "ent-g2", "ent-g3", "ent-g4"],
    embed: { kind: "spotify", url: "https://open.spotify.com/" },
  },
  {
    id: "educacao", name: "📚 Educação", swatch: { background: PAL.ocean.bg, accent: PAL.ocean.accent, text: PAL.ocean.text },
    socials: [["instagram", "https://instagram.com/"], ["youtube", "https://youtube.com/"]],
    pals: ["ocean", "slate", "night", "sand"], fonts: ["sans", "serif", "rounded", "mono"], vid: "aurora", logo: "/assets/logo-mono.svg",
    bio: "Aprenda no seu ritmo, com aulas práticas e certificado.",
    names: ["Curso Online", "Materiais", "Minhas Aulas", "Professor Particular", "Mentoria de Estudos", "Aula em Tela"],
    kit: ["logoGrade", "vitrineProdutos", "soNomeLista", "recorteCartoes", "carrossel", "capaVideoBanner"],
    primary: { t: "Matricular agora", u: "https://example.com/matricula", bt: "Quero me inscrever" },
    links: [{ t: "O que você vai aprender", s: "Grade completa", u: "https://example.com/conteudo" }, { t: "Aula gratuita de amostra", l: "GRÁTIS", s: "Veja antes de decidir", u: "https://youtube.com/" }, { t: "Falar comigo", u: "https://wa.me/5511900009999" }],
    gal: ["edu-g1", "edu-g2", "edu-g3", "edu-g4"],
    products: [
      { label: "LANÇAMENTO", title: "Curso Completo", description: "Do zero ao avançado, com certificado e suporte.", price: "R$ 297", seed: "edu-p1", buttonText: "Matricular", url: "https://example.com/curso" },
      { label: "E-BOOK", title: "Guia Prático", description: "Mais de 120 páginas com exercícios e exemplos.", price: "R$ 39", seed: "edu-p2", buttonText: "Comprar", url: "https://example.com/ebook" },
    ],
  },
  {
    id: "musica", name: "🎵 Música", swatch: { background: PAL.plum.bg, accent: PAL.plum.accent, text: PAL.plum.text },
    socials: [["spotify", "https://open.spotify.com/"], ["youtube", "https://youtube.com/"], ["instagram", "https://instagram.com/"]],
    pals: ["plum", "ink", "ocean", "sand"], fonts: ["condensed", "tech", "serif", "mono"], vid: "aurora",
    bio: "Novo single disponível em todas as plataformas 🎧",
    names: ["Músico", "Ouça Agora", "Produtor Musical", "Aulas de Música", "Novo Lançamento", "Em Estúdio"],
    kit: ["capaVideoBanner", "midiaEmbed", "recorteVideo", "cartaoPilha", "telaCheia", "faixaGrade"],
    primary: { t: "Ouvir agora", u: "https://open.spotify.com/", bt: "Dar play" },
    links: [{ t: "Clipe no YouTube", s: "Assista em primeira mão", u: "https://youtube.com/" }, { t: "Shows e turnê", s: "Próximas datas", u: "https://example.com/shows" }, { t: "Contratação", u: "https://example.com/contato" }],
    gal: ["mus-g1", "mus-g2", "mus-g3", "mus-g4"],
    embed: { kind: "spotify", url: "https://open.spotify.com/" },
  },
  {
    id: "tecnologia", name: "🎮 Tecnologia e jogos", swatch: { background: PAL.ocean.bg, accent: PAL.ocean.accent, text: PAL.ocean.text },
    socials: [["instagram", "https://instagram.com/"], ["youtube", "https://youtube.com/"], ["linkedin", "https://linkedin.com/"]],
    pals: ["ocean", "night", "slate", "mono"], fonts: ["tech", "mono", "sans", "condensed"], vid: "mono", logo: "/assets/logo-mono.svg",
    bio: "Live todo dia, projetos e tudo o que eu construo. Entra pra tribo 🎮",
    names: ["Streamer / Gamer", "Em Live", "Dev / Portfólio", "Startup / App", "Setup Pro", "Em Números"],
    kit: ["capaVideoBanner", "fotoGrandeStats", "cartaoPilha", "logoGrade", "telaCheia", "recorteCartoes"],
    primary: { t: "Assistir ao vivo", u: "https://twitch.tv/", bt: "Entrar na live" },
    links: [{ t: "Canal no YouTube", s: "Melhores momentos", u: "https://youtube.com/" }, { t: "Servidor no Discord", l: "COMUNIDADE", s: "Entra pro grupo", u: "https://discord.com/" }, { t: "Meu GitHub", u: "https://github.com/" }],
    gal: ["tec-g1", "tec-g2", "tec-g3", "tec-g4"],
    stats: [["+50mil", "seguidores"], ["4.8★", "avaliação"], ["24/7", "online"]],
  },
  {
    id: "viagens", name: "🌴 Viagens e atividades", swatch: { background: PAL.forest.bg, accent: PAL.forest.accent, text: PAL.forest.text },
    socials: [["instagram", "https://instagram.com/"], ["youtube", "https://youtube.com/"]], wa: "(11) 91000-3333",
    pals: ["forest", "ocean", "sand", "lime"], fonts: ["rounded", "serif", "condensed", "elegant"], vid: "forest",
    bio: "Roteiros montados pra você só se preocupar em aproveitar ✈️",
    names: ["Agência de Viagens", "Guia de Turismo", "Experiências", "Aventura", "Destino em Tela", "Roteiros"],
    kit: ["telaCheia", "faixaGrade", "recorteCartoes", "capaBanner", "carrossel", "retratoGrande"],
    primary: { t: "Ver pacotes", u: "https://example.com/pacotes", bt: "Explorar destinos" },
    links: [{ t: "Montar roteiro sob medida", s: "Do seu jeito", u: "https://wa.me/5511910003333" }, { t: "Ofertas da semana", l: "OFERTAS", u: "https://example.com/ofertas" }, { t: "Avaliações", s: "O que dizem os viajantes", u: "https://example.com/avaliacoes" }],
    gal: ["via-g1", "via-g2", "via-g3", "via-g4"],
  },
  {
    id: "comunidade", name: "🤝 Comunidade", swatch: { background: PAL.sand.bg, accent: PAL.sand.accent, text: PAL.sand.text },
    socials: [["instagram", "https://instagram.com/"], ["telegram", "https://t.me/"]],
    pals: ["sand", "mint", "night", "plum"], fonts: ["rounded", "serif", "sans", "elegant"], vid: "aurora", logo: "/assets/logo-mono.svg",
    bio: "Um lugar pra trocar, aprender e crescer junto. Faça parte 🤝",
    names: ["Comunidade", "Projeto Social", "Faça Parte", "Clube de Assinatura", "Nosso Grupo", "Em Rede"],
    kit: ["faixaGrade", "recorteCartoes", "cartaoPilha", "capaBanner", "soNomeLista", "logoGrade"],
    primary: { t: "Entrar na comunidade", u: "https://example.com/entrar", bt: "Quero entrar" },
    links: [{ t: "Grupo no WhatsApp", l: "GRUPO", s: "Conversas do dia a dia", u: "https://chat.whatsapp.com/" }, { t: "Canal no Telegram", s: "Avisos e conteúdos", u: "https://t.me/" }, { t: "Como ajudar", u: "https://example.com/ajudar" }],
    gal: ["cmn-g1", "cmn-g2", "cmn-g3", "cmn-g4"],
  },
];

function toTemplate(c: Cat, k: number): PageTemplate {
  const mid = `${c.id}-${k}`;
  const piece = RECIPES[c.kit[k]](c, mid);
  const palKey = piece.pal ?? c.pals[k % c.pals.length];
  const p: Pal = PAL[palKey];
  const font = c.fonts[k % c.fonts.length];
  const photoSeed = mid;
  const photo = pic(photoSeed, 800, 1000);
  return {
    id: mid,
    name: c.names[k],
    category: c.id,
    plan: "basic",
    tab: "essencial",
    description: c.bio,
    swatch: { background: p.bg, accent: p.accent, text: p.text },
    build: (name) => {
      const profile: Partial<PageDoc["profile"]> = { bio: c.bio, floatingWhatsapp: c.wa ?? "", logo: piece.logo ?? "" };
      if (piece.layout === "hero") profile.avatarUrl = photo;
      else if (piece.layout === "poster" || piece.layout === "cover" || piece.layout === "fullscreen" || piece.layout === "portrait" || piece.layout === "capacheia") {
        profile.coverUrl = photo;
        profile.avatarUrl = pic(`${photoSeed}-a`, 240, 240);
      } else profile.avatarUrl = pic(photoSeed, 240, 240);
      if (piece.video) profile.coverVideo = `/assets/cover-${piece.video}.mp4`;
      return page(name, {
        profile,
        socials: c.socials.map(([platform, url]) => ({ platform, url })),
        theme: {
          layout: piece.layout,
          font,
          background: p.bg,
          background2: p.bg,
          backgroundType: "solid",
          text: p.text,
          buttonBackground: p.btn,
          buttonText: p.btnText,
          buttonShape: piece.shape ?? "pill",
          buttonStyle: piece.style ?? "fill",
          buttonShadow: false,
          avatarShape: "circle",
          socialStyle: "icons",
          accent: p.accent,
          headingFont: "same",
          premium: "",
        },
        blocks: piece.blocks,
      });
    },
  };
}

export const ESSENTIAL_TEMPLATES: PageTemplate[] = CATS.flatMap((c) => c.kit.map((_, k) => toTemplate(c, k)));

export const ESSENTIAL_COLLECTIONS: TemplateCollection[] = CATS.map((c) => ({
  id: c.id,
  tab: "essencial",
  name: c.name,
  description: `Modelos de ${c.name.replace(/^[^\p{L}]+/u, "")}.`,
  swatch: c.swatch,
  templateIds: c.kit.map((_, k) => `${c.id}-${k}`),
}));
