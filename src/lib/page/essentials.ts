import { nanoid } from "nanoid";
import { page, type PageTemplate, type TemplateCollection } from "./templates";
import type { Block, PageDoc, SocialPlatform, Theme } from "./schema";

// The "Modelos Essenciais" gallery: original starter pages grouped by the same
// categories the market expects (loja, criadores, esporte...). They are built
// on the normal theme + block system, so every text, colour, image, link and
// the cover (photo or video) is 100% editable. The photos are reliable
// placeholders (picsum.photos) and the video covers are the bundled gradient
// loops in /public/assets — all meant to be swapped for the person's own.

const bid = () => nanoid(10);
// A reliable placeholder photo, deterministic by seed. Swapped by the person.
const pic = (seed: string, w = 800, h = 1000) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

type LinkBlock = Extract<Block, { type: "link" }>;
type SubscribeBlock = Extract<Block, { type: "subscribe" }>;
type ImageBlock = Extract<Block, { type: "image" }>;

function lk(title: string, url: string, extra: Partial<LinkBlock> = {}): Block {
  return { id: bid(), enabled: true, type: "link", title, url, imageUrl: "", highlight: false, display: "button", label: "", subtitle: "", buttonText: "", accent: "", ...extra };
}
function hd(text: string, style: Extract<Block, { type: "heading" }>["style"] = "section"): Block {
  return { id: bid(), enabled: true, type: "heading", text, style };
}
function sub(title: string, buttonText: string, extra: Partial<SubscribeBlock> = {}): Block {
  return { id: bid(), enabled: true, type: "subscribe", title, buttonText, collectPhone: false, thankYouMessage: "Prontinho! Recebi seus dados e já já falo com você.", ...extra };
}
function img(seed: string, extra: Partial<ImageBlock> = {}): Block {
  return { id: bid(), enabled: true, type: "image", imageUrl: pic(seed, 900, 600), alt: "", url: "", ...extra };
}
function prod(p: { label?: string; title: string; description: string; price?: string; seed: string; buttonText: string; url: string }): Block {
  return { id: bid(), enabled: true, type: "product", label: p.label ?? "", price: p.price ?? "", title: p.title, description: p.description, imageUrl: pic(p.seed, 900, 700), buttonText: p.buttonText, url: p.url };
}
function stats(items: [string, string][]): Block {
  return { id: bid(), enabled: true, type: "stats", items: items.map(([value, label]) => ({ value, label })) };
}
type Pal = { bg: string; text: string; btn: string; btnText: string; accent: string; bgType?: Theme["backgroundType"]; bg2?: string };
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
} satisfies Record<string, Pal>;

type Video = "aurora" | "sunset" | "forest" | "mono";
type ESpec = {
  id: string;
  name: string;
  cat: string;
  layout: Theme["layout"];
  font: Theme["font"];
  pal: keyof typeof PAL;
  bio: string;
  shape?: Theme["buttonShape"];
  style?: Theme["buttonStyle"];
  avatarShape?: Theme["avatarShape"];
  // A video cover loop; the model then gets a photo poster behind it.
  video?: Video;
  // Override the auto photo seed (default: the model id).
  photo?: string;
  avatar?: string;
  wa?: string;
  socials?: [SocialPlatform, string][];
  blocks: Block[];
};

function build(spec: ESpec): PageTemplate {
  const p: Pal = PAL[spec.pal];
  const swatch = { background: p.bg, accent: p.accent, text: p.text };
  return {
    id: spec.id,
    name: spec.name,
    category: spec.cat,
    plan: "basic",
    tab: "essencial",
    description: spec.bio,
    swatch,
    build: (name) => {
      const photoSeed = spec.photo ?? spec.id;
      const photo = pic(photoSeed, 800, 1000);
      const profile: Partial<PageDoc["profile"]> = { bio: spec.bio, floatingWhatsapp: spec.wa ?? "" };
      if (spec.layout === "hero") profile.avatarUrl = photo;
      else if (spec.layout === "poster" || spec.layout === "cover") {
        profile.coverUrl = photo;
        profile.avatarUrl = pic(spec.avatar ?? `${photoSeed}-a`, 240, 240);
      } else profile.avatarUrl = pic(spec.avatar ?? photoSeed, 240, 240);
      if (spec.video) profile.coverVideo = `/assets/cover-${spec.video}.mp4`;
      return page(name, {
        profile,
        socials: (spec.socials ?? []).map(([platform, url]) => ({ platform, url })),
        theme: {
          layout: spec.layout,
          font: spec.font,
          background: p.bg,
          background2: p.bg2 ?? p.bg,
          backgroundType: p.bgType ?? "solid",
          text: p.text,
          buttonBackground: p.btn,
          buttonText: p.btnText,
          buttonShape: spec.shape ?? "pill",
          buttonStyle: spec.style ?? "fill",
          buttonShadow: false,
          avatarShape: spec.avatarShape ?? "circle",
          socialStyle: "icons",
          accent: p.accent,
          headingFont: "same",
          premium: "",
        },
        blocks: spec.blocks,
      });
    },
  };
}

// The 17 categories, in gallery order.
const CATS: { id: string; name: string; swatch: { background: string; accent: string; text: string } }[] = [
  { id: "loja", name: "🛍️ Loja", swatch: { background: PAL.clay.bg, accent: PAL.clay.accent, text: PAL.clay.text } },
  { id: "criadores", name: "💫 Criadores de conteúdo", swatch: { background: PAL.ink.bg, accent: PAL.ink.accent, text: PAL.ink.text } },
  { id: "esporte", name: "🏋️ Esporte e Fitness", swatch: { background: PAL.lime.bg, accent: PAL.lime.accent, text: PAL.lime.text } },
  { id: "criativo", name: "🎨 Criativo", swatch: { background: PAL.plum.bg, accent: PAL.plum.accent, text: PAL.plum.text } },
  { id: "comida", name: "🍕 Comida e bebida", swatch: { background: PAL.sun.bg, accent: PAL.sun.accent, text: PAL.sun.text } },
  { id: "imobiliaria", name: "🏠 Imobiliária", swatch: { background: PAL.slate.bg, accent: PAL.slate.accent, text: PAL.slate.text } },
  { id: "beleza", name: "💄 Beleza", swatch: { background: PAL.blush.bg, accent: PAL.blush.accent, text: PAL.blush.text } },
  { id: "eventos", name: "🎤 Eventos", swatch: { background: PAL.night.bg, accent: PAL.night.accent, text: PAL.night.text } },
  { id: "negocios", name: "💼 Negócios", swatch: { background: PAL.slate.bg, accent: PAL.slate.accent, text: PAL.slate.text } },
  { id: "moda", name: "👗 Moda", swatch: { background: PAL.mono.bg, accent: PAL.mono.accent, text: PAL.mono.text } },
  { id: "bemestar", name: "🌿 Bem-estar e Saúde", swatch: { background: PAL.mint.bg, accent: PAL.mint.accent, text: PAL.mint.text } },
  { id: "entretenimento", name: "🎭 Entretenimento", swatch: { background: PAL.berry.bg, accent: PAL.berry.accent, text: PAL.berry.text } },
  { id: "educacao", name: "📚 Educação", swatch: { background: PAL.ocean.bg, accent: PAL.ocean.accent, text: PAL.ocean.text } },
  { id: "musica", name: "🎵 Música", swatch: { background: PAL.plum.bg, accent: PAL.plum.accent, text: PAL.plum.text } },
  { id: "tecnologia", name: "🎮 Tecnologia e jogos", swatch: { background: PAL.ocean.bg, accent: PAL.ocean.accent, text: PAL.ocean.text } },
  { id: "viagens", name: "🌴 Viagens e atividades", swatch: { background: PAL.forest.bg, accent: PAL.forest.accent, text: PAL.forest.text } },
  { id: "comunidade", name: "🤝 Comunidade", swatch: { background: PAL.sand.bg, accent: PAL.sand.accent, text: PAL.sand.text } },
];

const ESSENTIALS: ESpec[] = [
  // ---------------- 🛍️ Loja ----------------
  {
    id: "loja-vitrine", name: "Vitrine da Loja", cat: "loja", layout: "cover", font: "rounded", pal: "clay", shape: "rounded",
    bio: "Novidades da semana, fretes e condições especiais. Escolha por onde começar 👇",
    wa: "(11) 99999-0000",
    socials: [["instagram", "https://instagram.com/"], ["whatsapp", "+5511999990000"]],
    blocks: [
      lk("Ver catálogo completo", "https://example.com/catalogo", { display: "banner", label: "CATÁLOGO", buttonText: "Explorar", imageUrl: pic("loja-vitrine-b1", 1000, 700) }),
      lk("Promoções da semana", "https://example.com/ofertas", { display: "card", label: "OFERTAS", subtitle: "Até 40% off em itens selecionados" }),
      lk("Comprar pelo WhatsApp", "https://wa.me/5511999990000", { display: "button", buttonText: "Chamar no Zap" }),
      sub("Entre na lista VIP e receba os lançamentos primeiro", "Quero novidades", { collectPhone: true }),
    ],
  },
  {
    id: "loja-express", name: "Pedido Express", cat: "loja", layout: "classic", font: "sans", pal: "mint", shape: "pill",
    bio: "Peça em segundos. Entrega no mesmo dia para toda a cidade 🛵",
    wa: "(11) 98888-0000",
    blocks: [
      lk("Fazer meu pedido", "https://wa.me/5511988880000", { highlight: true, buttonText: "Pedir agora" }),
      lk("Cardápio de produtos", "https://example.com/produtos", { display: "card", label: "PRODUTOS", subtitle: "Tudo o que temos, com fotos e preços" }),
      stats([["2h", "entrega média"], ["4.9", "avaliação"], ["+3mil", "pedidos"]]),
      lk("Formas de pagamento", "https://example.com/pagamento", { display: "button" }),
    ],
  },
  {
    id: "loja-drop", name: "Drop Novo", cat: "loja", layout: "poster", font: "condensed", pal: "ink", video: "mono", shape: "square", style: "outline",
    bio: "Coleção nova no ar. Peças limitadas — quando acabar, acabou.",
    socials: [["instagram", "https://instagram.com/"], ["tiktok", "https://tiktok.com/"]],
    blocks: [
      hd("A COLEÇÃO", "divider"),
      lk("Comprar o drop", "https://example.com/drop", { display: "banner", label: "LIMITADO", buttonText: "Garantir o meu", imageUrl: pic("loja-drop-b1", 1000, 700) }),
      lk("Ver lookbook", "https://example.com/lookbook", { display: "card", subtitle: "Todas as peças em detalhe" }),
      sub("Avise-me no próximo drop", "Entrar na lista"),
    ],
  },
  {
    id: "loja-catalogo", name: "Catálogo Visual", cat: "loja", layout: "name", font: "serif", pal: "cream", shape: "rounded", style: "soft",
    bio: "Produtos artesanais feitos à mão, em pequenos lotes.",
    blocks: [
      prod({ label: "DESTAQUE", title: "Kit Presente", description: "Nossa combinação mais pedida, embalada para presentear.", price: "R$ 149", seed: "loja-catalogo-p1", buttonText: "Comprar", url: "https://example.com/kit" }),
      prod({ title: "Edição Especial", description: "Produção limitada, com acabamento exclusivo.", price: "R$ 89", seed: "loja-catalogo-p2", buttonText: "Ver produto", url: "https://example.com/especial" }),
      lk("Falar com a loja", "https://wa.me/5511999990000", { display: "button", buttonText: "Tirar dúvidas" }),
    ],
  },

  // ---------------- 💫 Criadores de conteúdo ----------------
  {
    id: "criador-hub", name: "Hub do Criador", cat: "criadores", layout: "hero", font: "condensed", pal: "ink", video: "aurora",
    bio: "Criador de conteúdo · bastidores, colabs e tudo o que rola por aqui.",
    socials: [["instagram", "https://instagram.com/"], ["youtube", "https://youtube.com/"], ["tiktok", "https://tiktok.com/"]],
    blocks: [
      lk("Meu canal no YouTube", "https://youtube.com/", { display: "banner", label: "VÍDEOS", buttonText: "Assistir", imageUrl: pic("criador-hub-b1", 1000, 700) }),
      lk("Último vídeo", "https://youtube.com/", { display: "card", label: "NOVO", subtitle: "Sai todo sábado" }),
      lk("Para marcas: mídia kit", "https://example.com/midiakit", { display: "card", label: "COLABS", subtitle: "Parcerias e publis" }),
      sub("Newsletter dos bastidores", "Quero receber"),
    ],
  },
  {
    id: "criador-links", name: "Todos os Links", cat: "criadores", layout: "classic", font: "rounded", pal: "plum", shape: "pill",
    bio: "Tudo o que eu citei nos stories tá aqui embaixo 💜",
    socials: [["instagram", "https://instagram.com/"], ["tiktok", "https://tiktok.com/"], ["spotify", "https://open.spotify.com/"]],
    blocks: [
      lk("Produto que amei", "https://example.com/produto", { highlight: true, buttonText: "Ver" }),
      lk("Cupom de desconto", "https://example.com/cupom", { display: "card", label: "CUPOM", subtitle: "Use MEUNOME10" }),
      lk("Meu TikTok", "https://tiktok.com/", { display: "button" }),
      lk("Meu Spotify", "https://open.spotify.com/", { display: "button" }),
    ],
  },
  {
    id: "criador-creator", name: "Creator Pro", cat: "criadores", layout: "poster", font: "sans", pal: "night", video: "night" as Video,
    bio: "Transformo ideias em conteúdo que conecta. Veja meu trabalho.",
    socials: [["instagram", "https://instagram.com/"], ["linkedin", "https://linkedin.com/"]],
    blocks: [
      stats([["120k", "seguidores"], ["8M", "views/mês"], ["+40", "marcas"]]),
      lk("Portfólio de conteúdo", "https://example.com/portfolio", { display: "banner", label: "PORTFÓLIO", buttonText: "Ver cases", imageUrl: pic("criador-creator-b1", 1000, 700) }),
      lk("Trabalhe comigo", "https://example.com/contato", { display: "card", subtitle: "Orçamentos e parcerias" }),
    ],
  },
  {
    id: "criador-podcast", name: "Meu Podcast", cat: "criadores", layout: "cover", font: "mono", pal: "mono", shape: "square", style: "outline",
    bio: "Conversas sem roteiro, toda terça. Ouça onde você quiser.",
    socials: [["spotify", "https://open.spotify.com/"], ["youtube", "https://youtube.com/"]],
    blocks: [
      lk("Ouvir no Spotify", "https://open.spotify.com/", { display: "banner", label: "EPISÓDIO NOVO", buttonText: "Dar play", imageUrl: pic("criador-podcast-b1", 1000, 700) }),
      lk("Assistir no YouTube", "https://youtube.com/", { display: "card", subtitle: "Com vídeo e cortes" }),
      sub("Receba cada episódio por e-mail", "Inscrever"),
    ],
  },

  // ---------------- 🏋️ Esporte e Fitness ----------------
  {
    id: "fit-treino", name: "Treino & Resultado", cat: "esporte", layout: "hero", font: "condensed", pal: "lime", video: "forest", shape: "square",
    bio: "Personal trainer · planos online e presenciais. Bora evoluir 💪",
    wa: "(11) 97777-0000",
    socials: [["instagram", "https://instagram.com/"]],
    blocks: [
      lk("Montar meu treino", "https://wa.me/5511977770000", { display: "banner", label: "COMECE HOJE", buttonText: "Falar comigo", imageUrl: pic("fit-treino-b1", 1000, 700) }),
      stats([["+500", "alunos"], ["10", "anos"], ["100%", "online"]]),
      lk("Planos e valores", "https://example.com/planos", { display: "card", subtitle: "Mensal, trimestral e anual" }),
      sub("Baixe o guia grátis de treino", "Quero o guia", { collectPhone: true }),
    ],
  },
  {
    id: "fit-box", name: "Cross & Box", cat: "esporte", layout: "poster", font: "tech", pal: "ink", video: "mono", style: "outline",
    bio: "Sua box de treino funcional. Primeira aula experimental é por nossa conta.",
    wa: "(11) 96666-0000",
    blocks: [
      lk("Agendar aula grátis", "https://wa.me/5511966660000", { highlight: true, buttonText: "Quero experimentar" }),
      lk("Horários das turmas", "https://example.com/horarios", { display: "card", label: "GRADE", subtitle: "Manhã, tarde e noite" }),
      lk("Onde treinamos", "https://maps.google.com/", { display: "button", buttonText: "Ver no mapa" }),
    ],
  },
  {
    id: "fit-nutri", name: "Nutri Esportiva", cat: "esporte", layout: "classic", font: "sans", pal: "mint", shape: "pill",
    bio: "Nutricionista esportiva. Comida de verdade para performar e viver bem.",
    socials: [["instagram", "https://instagram.com/"]],
    blocks: [
      lk("Agendar consulta", "https://example.com/agenda", { highlight: true, buttonText: "Marcar horário" }),
      lk("Como funciona o acompanhamento", "https://example.com/como", { display: "card", subtitle: "Online e presencial" }),
      lk("Receitas gratuitas", "https://example.com/receitas", { display: "button" }),
    ],
  },
  {
    id: "fit-run", name: "Assessoria de Corrida", cat: "esporte", layout: "name", font: "condensed", pal: "slate", shape: "square", style: "soft",
    bio: "Do primeiro quilômetro à sua primeira maratona.",
    blocks: [
      hd("PROGRAMAS", "divider"),
      lk("Iniciantes", "https://example.com/iniciantes", { display: "card", label: "5KM", subtitle: "Comece do zero, sem lesões" }),
      lk("Performance", "https://example.com/performance", { display: "card", label: "21/42KM", subtitle: "Planilha e acompanhamento" }),
      lk("Falar com o treinador", "https://example.com/contato", { display: "button" }),
    ],
  },

  // ---------------- 🎨 Criativo ----------------
  {
    id: "criativo-portfolio", name: "Portfólio Criativo", cat: "criativo", layout: "poster", font: "elegant", pal: "plum", video: "aurora",
    bio: "Direção de arte & design. Seleção de projetos recentes.",
    socials: [["instagram", "https://instagram.com/"], ["linkedin", "https://linkedin.com/"]],
    blocks: [
      img("criativo-portfolio-g1"),
      lk("Ver portfólio completo", "https://example.com/portfolio", { display: "banner", label: "TRABALHOS", buttonText: "Explorar", imageUrl: pic("criativo-portfolio-b1", 1000, 700) }),
      lk("Orçamento de projeto", "https://example.com/orcamento", { display: "card", subtitle: "Conte sua ideia" }),
    ],
  },
  {
    id: "criativo-foto", name: "Fotografia", cat: "criativo", layout: "hero", font: "serif", pal: "mono", shape: "square", style: "outline",
    bio: "Fotógrafo · retratos, casamentos e ensaios autorais.",
    socials: [["instagram", "https://instagram.com/"]],
    blocks: [
      lk("Galeria de ensaios", "https://example.com/galeria", { display: "banner", label: "GALERIA", buttonText: "Ver fotos", imageUrl: pic("criativo-foto-b1", 1000, 700) }),
      lk("Reservar uma data", "https://example.com/reserva", { display: "card", subtitle: "Consulte disponibilidade" }),
      lk("Tabela de pacotes", "https://example.com/pacotes", { display: "button" }),
    ],
  },
  {
    id: "criativo-studio", name: "Estúdio de Design", cat: "criativo", layout: "classic", font: "sans", pal: "ink", shape: "rounded",
    bio: "Estúdio de branding. Marcas que as pessoas lembram.",
    socials: [["instagram", "https://instagram.com/"], ["linkedin", "https://linkedin.com/"]],
    blocks: [
      lk("Nossos cases", "https://example.com/cases", { highlight: true, buttonText: "Ver projetos" }),
      lk("Serviços", "https://example.com/servicos", { display: "card", subtitle: "Identidade, web e social" }),
      sub("Receba um case por semana", "Assinar"),
    ],
  },
  {
    id: "criativo-ilustra", name: "Ilustração", cat: "criativo", layout: "cover", font: "rounded", pal: "rose", shape: "pill", style: "soft",
    bio: "Ilustradora. Encomendas abertas para projetos e presentes.",
    socials: [["instagram", "https://instagram.com/"]],
    blocks: [
      lk("Encomendar ilustração", "https://example.com/encomenda", { display: "banner", label: "ENCOMENDAS", buttonText: "Quero uma", imageUrl: pic("criativo-ilustra-b1", 1000, 700) }),
      lk("Loja de prints", "https://example.com/prints", { display: "card", subtitle: "Pôsteres e cartões" }),
      lk("Portfólio no Behance", "https://behance.net/", { display: "button" }),
    ],
  },

  // ---------------- 🍕 Comida e bebida ----------------
  {
    id: "comida-cardapio", name: "Cardápio Digital", cat: "comida", layout: "cover", font: "serif", pal: "sun", shape: "rounded",
    bio: "Sabor de verdade, feito na hora. Confira o cardápio e peça 🍔",
    wa: "(11) 95555-0000",
    socials: [["instagram", "https://instagram.com/"]],
    blocks: [
      lk("Ver cardápio", "https://example.com/cardapio", { display: "banner", label: "CARDÁPIO", buttonText: "Abrir", imageUrl: pic("comida-cardapio-b1", 1000, 700) }),
      lk("Pedir pelo WhatsApp", "https://wa.me/5511955550000", { highlight: true, buttonText: "Fazer pedido" }),
      lk("Peça no iFood", "https://ifood.com.br/", { display: "card", subtitle: "Entrega rápida" }),
      lk("Onde estamos", "https://maps.google.com/", { display: "button", buttonText: "Ver endereço" }),
    ],
  },
  {
    id: "comida-cafe", name: "Cafeteria", cat: "comida", layout: "hero", font: "elegant", pal: "cream", shape: "rounded", style: "soft",
    bio: "Café especial, pães e doces artesanais. Venha tomar um 🤎",
    socials: [["instagram", "https://instagram.com/"]],
    blocks: [
      lk("Nosso menu", "https://example.com/menu", { display: "card", label: "MENU", subtitle: "Cafés, bebidas e quitutes" }),
      lk("Reservar mesa", "https://wa.me/5511955550000", { display: "button", buttonText: "Reservar" }),
      lk("Horário e localização", "https://maps.google.com/", { display: "button" }),
    ],
  },
  {
    id: "comida-foodtruck", name: "Food Truck", cat: "comida", layout: "poster", font: "condensed", pal: "ink", video: "sunset", shape: "square",
    bio: "A gente leva o sabor até você. Veja onde estaremos hoje.",
    wa: "(11) 95555-0000",
    blocks: [
      lk("Onde estamos hoje", "https://instagram.com/", { display: "banner", label: "AO VIVO", buttonText: "Ver agenda", imageUrl: pic("comida-foodtruck-b1", 1000, 700) }),
      lk("Chamar para evento", "https://wa.me/5511955550000", { display: "card", subtitle: "Festas e corporativo" }),
      lk("Ver o menu", "https://example.com/menu", { display: "button" }),
    ],
  },
  {
    id: "comida-doces", name: "Confeitaria", cat: "comida", layout: "classic", font: "rounded", pal: "blush", shape: "pill", style: "soft",
    bio: "Bolos e doces por encomenda para adoçar o seu dia 🧁",
    wa: "(11) 94444-0000",
    socials: [["instagram", "https://instagram.com/"]],
    blocks: [
      lk("Fazer encomenda", "https://wa.me/5511944440000", { highlight: true, buttonText: "Encomendar" }),
      prod({ label: "MAIS PEDIDO", title: "Bolo Vulcão", description: "Recheio que escorre, massa fofinha. Serve 15 fatias.", price: "R$ 120", seed: "comida-doces-p1", buttonText: "Quero esse", url: "https://wa.me/5511944440000" }),
      lk("Tabela de preços", "https://example.com/precos", { display: "button" }),
    ],
  },

  // ---------------- 🏠 Imobiliária ----------------
  {
    id: "imob-corretor", name: "Corretor de Imóveis", cat: "imobiliaria", layout: "classic", font: "sans", pal: "slate", shape: "rounded",
    bio: "Corretor credenciado. Encontro o imóvel certo para o seu momento.",
    wa: "(11) 93333-0000",
    socials: [["instagram", "https://instagram.com/"], ["linkedin", "https://linkedin.com/"]],
    blocks: [
      lk("Imóveis à venda", "https://example.com/venda", { display: "banner", label: "VENDA", buttonText: "Ver ofertas", imageUrl: pic("imob-corretor-b1", 1000, 700) }),
      lk("Imóveis para alugar", "https://example.com/aluguel", { display: "card", label: "ALUGUEL", subtitle: "Atualizado toda semana" }),
      lk("Quero vender meu imóvel", "https://wa.me/5511933330000", { display: "card", subtitle: "Avaliação gratuita" }),
      lk("Falar agora", "https://wa.me/5511933330000", { display: "button", buttonText: "Chamar no WhatsApp" }),
    ],
  },
  {
    id: "imob-lancamento", name: "Lançamento", cat: "imobiliaria", layout: "poster", font: "elegant", pal: "ink", video: "night" as Video,
    bio: "Novo empreendimento na melhor região. Unidades limitadas.",
    wa: "(11) 93333-0000",
    blocks: [
      lk("Conhecer o empreendimento", "https://example.com/lancamento", { display: "banner", label: "LANÇAMENTO", buttonText: "Ver plantas", imageUrl: pic("imob-lancamento-b1", 1000, 700) }),
      stats([["2 e 3", "dormitórios"], ["48–72", "m²"], ["Lazer", "completo"]]),
      lk("Agendar visita", "https://wa.me/5511933330000", { display: "card", subtitle: "Decorado aberto" }),
    ],
  },
  {
    id: "imob-locacao", name: "Locação Rápida", cat: "imobiliaria", layout: "cover", font: "sans", pal: "mint", shape: "rounded",
    bio: "Aluguel sem fiador e com aprovação rápida. Veja as opções.",
    wa: "(11) 92222-0000",
    blocks: [
      lk("Ver imóveis disponíveis", "https://example.com/disponiveis", { highlight: true, buttonText: "Buscar imóvel" }),
      lk("Simular aluguel", "https://example.com/simular", { display: "card", subtitle: "Sem compromisso" }),
      lk("Falar com a equipe", "https://wa.me/5511922220000", { display: "button" }),
    ],
  },
  {
    id: "imob-temporada", name: "Aluguel de Temporada", cat: "imobiliaria", layout: "hero", font: "serif", pal: "ocean", shape: "pill", style: "soft",
    bio: "Casas e apês para suas férias. Reserve direto, sem taxas extras.",
    blocks: [
      lk("Ver acomodações", "https://example.com/acomodacoes", { display: "banner", label: "DISPONÍVEL", buttonText: "Reservar", imageUrl: pic("imob-temporada-b1", 1000, 700) }),
      lk("Consultar datas", "https://wa.me/5511922220000", { display: "card", subtitle: "Resposta no mesmo dia" }),
      lk("Avaliações de hóspedes", "https://example.com/avaliacoes", { display: "button" }),
    ],
  },

  // ---------------- 💄 Beleza ----------------
  {
    id: "beleza-studio", name: "Studio de Beleza", cat: "beleza", layout: "hero", font: "elegant", pal: "blush", shape: "pill", style: "soft",
    bio: "Cabelo, unhas e estética. Agende seu momento de cuidado ✨",
    wa: "(11) 91111-0000",
    socials: [["instagram", "https://instagram.com/"]],
    blocks: [
      lk("Agendar horário", "https://example.com/agenda", { highlight: true, buttonText: "Marcar agora" }),
      lk("Nossos serviços", "https://example.com/servicos", { display: "card", label: "SERVIÇOS", subtitle: "Tabela com preços" }),
      lk("Ver trabalhos", "https://instagram.com/", { display: "button", buttonText: "Portfólio no Insta" }),
    ],
  },
  {
    id: "beleza-makeup", name: "Maquiagem", cat: "beleza", layout: "poster", font: "elegant", pal: "berry", video: "sunset",
    bio: "Maquiadora profissional. Noivas, eventos e ensaios.",
    socials: [["instagram", "https://instagram.com/"], ["tiktok", "https://tiktok.com/"]],
    blocks: [
      lk("Reservar data", "https://wa.me/5511911110000", { display: "banner", label: "AGENDA", buttonText: "Consultar", imageUrl: pic("beleza-makeup-b1", 1000, 700) }),
      lk("Pacote noiva", "https://example.com/noiva", { display: "card", subtitle: "Prova + dia do casamento" }),
      lk("Antes e depois", "https://instagram.com/", { display: "button" }),
    ],
  },
  {
    id: "beleza-barber", name: "Barbearia", cat: "beleza", layout: "cover", font: "condensed", pal: "mono", shape: "square", style: "outline",
    bio: "Corte, barba e aquele trato. Agende e não pegue fila.",
    wa: "(11) 90000-1111",
    socials: [["instagram", "https://instagram.com/"]],
    blocks: [
      lk("Agendar corte", "https://example.com/agenda", { display: "banner", label: "AGENDA", buttonText: "Marcar", imageUrl: pic("beleza-barber-b1", 1000, 700) }),
      lk("Tabela de serviços", "https://example.com/servicos", { display: "card", subtitle: "Corte, barba, combo" }),
      lk("Como chegar", "https://maps.google.com/", { display: "button" }),
    ],
  },
  {
    id: "beleza-skin", name: "Skincare & Estética", cat: "beleza", layout: "classic", font: "serif", pal: "rose", shape: "rounded", style: "soft",
    bio: "Protocolos faciais e corporais com avaliação personalizada.",
    wa: "(11) 90000-2222",
    blocks: [
      lk("Agendar avaliação", "https://wa.me/5511900002222", { highlight: true, buttonText: "Quero avaliar" }),
      lk("Tratamentos", "https://example.com/tratamentos", { display: "card", subtitle: "Limpeza, peeling e mais" }),
      sub("Dicas de cuidados toda semana", "Receber dicas"),
    ],
  },

  // ---------------- 🎤 Eventos ----------------
  {
    id: "evento-festa", name: "Festa & Line-up", cat: "eventos", layout: "poster", font: "condensed", pal: "night", video: "aurora", shape: "square",
    bio: "A noite que você não vai querer perder. Garanta seu ingresso.",
    socials: [["instagram", "https://instagram.com/"]],
    blocks: [
      lk("Comprar ingresso", "https://example.com/ingressos", { display: "banner", label: "INGRESSOS", buttonText: "Garantir", imageUrl: pic("evento-festa-b1", 1000, 700) }),
      hd("LINE-UP", "divider"),
      lk("Ver atrações", "https://example.com/lineup", { display: "card", subtitle: "Horários e palcos" }),
      lk("Local e regras", "https://example.com/local", { display: "button" }),
    ],
  },
  {
    id: "evento-congresso", name: "Congresso", cat: "eventos", layout: "classic", font: "sans", pal: "slate", shape: "rounded",
    bio: "Dois dias de palestras, networking e conteúdo de ponta.",
    socials: [["linkedin", "https://linkedin.com/"], ["instagram", "https://instagram.com/"]],
    blocks: [
      lk("Inscrições abertas", "https://example.com/inscricao", { highlight: true, buttonText: "Inscrever-se" }),
      lk("Programação", "https://example.com/programacao", { display: "card", subtitle: "Palestrantes e horários" }),
      lk("Seja patrocinador", "https://example.com/patrocinio", { display: "card", subtitle: "Planos e cotas" }),
    ],
  },
  {
    id: "evento-casamento", name: "Casamento", cat: "eventos", layout: "hero", font: "elegant", pal: "cream", shape: "pill", style: "soft",
    bio: "João & Maria · 12 de abril. Tudo o que você precisa saber 💍",
    blocks: [
      lk("Confirmar presença", "https://example.com/rsvp", { highlight: true, buttonText: "Confirmar (RSVP)" }),
      lk("Lista de presentes", "https://example.com/presentes", { display: "card", subtitle: "Ajude a realizar nosso sonho" }),
      lk("Local e horário", "https://maps.google.com/", { display: "button", buttonText: "Ver no mapa" }),
    ],
  },
  {
    id: "evento-workshop", name: "Workshop", cat: "eventos", layout: "cover", font: "rounded", pal: "sun", shape: "rounded",
    bio: "Encontro prático e presencial. Vagas limitadas por turma.",
    blocks: [
      lk("Garantir minha vaga", "https://example.com/vaga", { display: "banner", label: "PRESENCIAL", buttonText: "Inscrever", imageUrl: pic("evento-workshop-b1", 1000, 700) }),
      stats([["20", "vagas"], ["4h", "de prática"], ["1", "certificado"]]),
      lk("O que você vai aprender", "https://example.com/conteudo", { display: "card" }),
    ],
  },

  // ---------------- 💼 Negócios ----------------
  {
    id: "negocio-consultoria", name: "Consultoria", cat: "negocios", layout: "classic", font: "sans", pal: "slate", shape: "rounded",
    bio: "Ajudo empresas a crescer com estratégia e método. Vamos conversar?",
    socials: [["linkedin", "https://linkedin.com/"], ["instagram", "https://instagram.com/"]],
    blocks: [
      lk("Agendar diagnóstico", "https://example.com/diagnostico", { highlight: true, buttonText: "Marcar conversa" }),
      lk("Como eu trabalho", "https://example.com/metodo", { display: "card", subtitle: "Etapas e entregáveis" }),
      lk("Cases e resultados", "https://example.com/cases", { display: "card", subtitle: "Clientes reais" }),
      sub("Insights de gestão no seu e-mail", "Assinar newsletter"),
    ],
  },
  {
    id: "negocio-agencia", name: "Agência", cat: "negocios", layout: "poster", font: "condensed", pal: "ink", video: "mono", style: "outline",
    bio: "Marketing que gera resultado, não só likes. Conheça a agência.",
    socials: [["instagram", "https://instagram.com/"], ["linkedin", "https://linkedin.com/"]],
    blocks: [
      lk("Nossos serviços", "https://example.com/servicos", { display: "banner", label: "SERVIÇOS", buttonText: "Ver tudo", imageUrl: pic("negocio-agencia-b1", 1000, 700) }),
      stats([["+80", "clientes"], ["5x", "ROI médio"], ["7", "anos"]]),
      lk("Pedir proposta", "https://example.com/proposta", { display: "card", subtitle: "Resposta em 24h" }),
    ],
  },
  {
    id: "negocio-b2b", name: "Soluções B2B", cat: "negocios", layout: "name", font: "sans", pal: "night", shape: "square",
    bio: "Tecnologia e serviços para a sua empresa escalar com segurança.",
    socials: [["linkedin", "https://linkedin.com/"]],
    blocks: [
      hd("O QUE OFERECEMOS", "divider"),
      lk("Nossas soluções", "https://example.com/solucoes", { display: "card", subtitle: "Feitas para o seu setor" }),
      lk("Fale com vendas", "https://example.com/vendas", { display: "card", subtitle: "Demonstração gratuita" }),
      lk("Baixar apresentação", "https://example.com/deck", { display: "button" }),
    ],
  },
  {
    id: "negocio-coach", name: "Mentoria Executiva", cat: "negocios", layout: "hero", font: "serif", pal: "sand", shape: "pill", style: "soft",
    bio: "Mentor de líderes e empreendedores. Clareza para decidir e crescer.",
    socials: [["linkedin", "https://linkedin.com/"], ["instagram", "https://instagram.com/"]],
    blocks: [
      lk("Aplicar para a mentoria", "https://example.com/aplicacao", { highlight: true, buttonText: "Quero aplicar" }),
      lk("Para quem é", "https://example.com/paraquem", { display: "card", subtitle: "Veja se faz sentido" }),
      lk("Depoimentos", "https://example.com/depoimentos", { display: "button" }),
    ],
  },

  // ---------------- 👗 Moda ----------------
  {
    id: "moda-brand", name: "Marca de Moda", cat: "moda", layout: "poster", font: "elegant", pal: "mono", video: "mono", shape: "square", style: "outline",
    bio: "Nova coleção no ar. Peças atemporais, feitas para durar.",
    socials: [["instagram", "https://instagram.com/"], ["tiktok", "https://tiktok.com/"]],
    blocks: [
      lk("Comprar a coleção", "https://example.com/colecao", { display: "banner", label: "NOVA COLEÇÃO", buttonText: "Ver peças", imageUrl: pic("moda-brand-b1", 1000, 700) }),
      lk("Lookbook", "https://example.com/lookbook", { display: "card", subtitle: "Inspiração de looks" }),
      lk("Encontre seu tamanho", "https://example.com/tamanhos", { display: "button" }),
    ],
  },
  {
    id: "moda-consultora", name: "Consultoria de Imagem", cat: "moda", layout: "hero", font: "serif", pal: "sand", shape: "pill", style: "soft",
    bio: "Consultora de estilo. Vista quem você é, com confiança.",
    socials: [["instagram", "https://instagram.com/"], ["pinterest", "https://pinterest.com/"]],
    blocks: [
      lk("Agendar consultoria", "https://example.com/consultoria", { highlight: true, buttonText: "Quero marcar" }),
      lk("Serviços de estilo", "https://example.com/servicos", { display: "card", subtitle: "Guarda-roupa, compras, cores" }),
      sub("Dicas de estilo toda semana", "Receber"),
    ],
  },
  {
    id: "moda-brecho", name: "Brechó", cat: "moda", layout: "cover", font: "rounded", pal: "clay", shape: "rounded",
    bio: "Moda circular com peças únicas e preços honestos ♻️",
    wa: "(11) 90000-3333",
    socials: [["instagram", "https://instagram.com/"]],
    blocks: [
      lk("Ver peças novas", "https://instagram.com/", { display: "banner", label: "NOVIDADES", buttonText: "Garimpar", imageUrl: pic("moda-brecho-b1", 1000, 700) }),
      lk("Comprar pelo WhatsApp", "https://wa.me/5511900003333", { highlight: true, buttonText: "Chamar" }),
      lk("Quero vender peças", "https://example.com/vender", { display: "card", subtitle: "Como funciona" }),
    ],
  },
  {
    id: "moda-acessorios", name: "Acessórios", cat: "moda", layout: "classic", font: "sans", pal: "blush", shape: "pill",
    bio: "Semijoias e acessórios que completam qualquer look.",
    wa: "(11) 90000-4444",
    socials: [["instagram", "https://instagram.com/"]],
    blocks: [
      prod({ label: "QUERIDINHO", title: "Colar Essencial", description: "Banho de ouro 18k, antialérgico. Vai com tudo.", price: "R$ 79", seed: "moda-acessorios-p1", buttonText: "Comprar", url: "https://example.com/colar" }),
      lk("Ver catálogo", "https://example.com/catalogo", { display: "card", subtitle: "Coleção completa" }),
      lk("Comprar no WhatsApp", "https://wa.me/5511900004444", { display: "button", buttonText: "Falar com a loja" }),
    ],
  },

  // ---------------- 🌿 Bem-estar e Saúde ----------------
  {
    id: "bem-terapia", name: "Terapia & Psicologia", cat: "bemestar", layout: "classic", font: "serif", pal: "mint", shape: "rounded", style: "soft",
    bio: "Psicóloga · atendimento online e acolhedor. Cuidar de você importa.",
    socials: [["instagram", "https://instagram.com/"]],
    blocks: [
      lk("Agendar sessão", "https://example.com/agenda", { highlight: true, buttonText: "Marcar sessão" }),
      lk("Como funciona a terapia online", "https://example.com/online", { display: "card", subtitle: "Sigiloso e seguro" }),
      lk("Tire suas dúvidas", "https://wa.me/5511900005555", { display: "button" }),
    ],
  },
  {
    id: "bem-yoga", name: "Yoga & Meditação", cat: "bemestar", layout: "hero", font: "elegant", pal: "forest", shape: "pill", style: "soft",
    bio: "Respire. Aulas de yoga e meditação para o seu dia render mais.",
    socials: [["instagram", "https://instagram.com/"], ["youtube", "https://youtube.com/"]],
    blocks: [
      lk("Aula experimental grátis", "https://example.com/experimental", { highlight: true, buttonText: "Experimentar" }),
      lk("Horários das aulas", "https://example.com/horarios", { display: "card", subtitle: "Online e presencial" }),
      lk("Meditações no YouTube", "https://youtube.com/", { display: "button" }),
    ],
  },
  {
    id: "bem-nutri", name: "Vida Saudável", cat: "bemestar", layout: "cover", font: "rounded", pal: "lime", shape: "rounded",
    bio: "Nutricionista. Reeducação alimentar sem sofrimento, do seu jeito.",
    wa: "(11) 90000-6666",
    blocks: [
      lk("Agendar consulta", "https://wa.me/5511900006666", { display: "banner", label: "CONSULTAS", buttonText: "Agendar", imageUrl: pic("bem-nutri-b1", 1000, 700) }),
      lk("Planos de acompanhamento", "https://example.com/planos", { display: "card", subtitle: "Mensal e trimestral" }),
      sub("E-book de receitas leves grátis", "Baixar e-book", { collectPhone: true }),
    ],
  },
  {
    id: "bem-spa", name: "Spa & Relax", cat: "bemestar", layout: "poster", font: "elegant", pal: "sand", video: "forest",
    bio: "Massagens e terapias para relaxar corpo e mente.",
    wa: "(11) 90000-7777",
    blocks: [
      lk("Reservar horário", "https://wa.me/5511900007777", { display: "banner", label: "RESERVAS", buttonText: "Reservar", imageUrl: pic("bem-spa-b1", 1000, 700) }),
      lk("Nossos tratamentos", "https://example.com/tratamentos", { display: "card", subtitle: "Massagens, day spa e mais" }),
      lk("Vale-presente", "https://example.com/presente", { display: "button" }),
    ],
  },

  // ---------------- 🎭 Entretenimento ----------------
  {
    id: "ent-artista", name: "Artista", cat: "entretenimento", layout: "poster", font: "condensed", pal: "berry", video: "sunset", shape: "square",
    bio: "Shows, próximos projetos e tudo sobre mim em um só lugar.",
    socials: [["instagram", "https://instagram.com/"], ["youtube", "https://youtube.com/"], ["tiktok", "https://tiktok.com/"]],
    blocks: [
      lk("Próximos shows", "https://example.com/agenda", { display: "banner", label: "AGENDA", buttonText: "Ver datas", imageUrl: pic("ent-artista-b1", 1000, 700) }),
      lk("Assista agora", "https://youtube.com/", { display: "card", label: "NOVO", subtitle: "Clipe recém-lançado" }),
      lk("Contato e contratação", "https://example.com/contato", { display: "button" }),
    ],
  },
  {
    id: "ent-humor", name: "Comédia Stand-up", cat: "entretenimento", layout: "hero", font: "condensed", pal: "sun", shape: "square",
    bio: "Comediante. Vem rir comigo — ingressos e tour aqui embaixo 🎤",
    socials: [["instagram", "https://instagram.com/"], ["youtube", "https://youtube.com/"]],
    blocks: [
      lk("Comprar ingressos", "https://example.com/ingressos", { highlight: true, buttonText: "Garantir" }),
      lk("Cidades da turnê", "https://example.com/tour", { display: "card", subtitle: "Veja se vou aí" }),
      lk("Cortes e vídeos", "https://youtube.com/", { display: "button" }),
    ],
  },
  {
    id: "ent-dj", name: "DJ & Produtor", cat: "entretenimento", layout: "cover", font: "tech", pal: "night", video: "aurora", style: "outline",
    bio: "Sets, releases e contratação para a sua festa.",
    socials: [["spotify", "https://open.spotify.com/"], ["instagram", "https://instagram.com/"]],
    blocks: [
      lk("Ouvir último set", "https://open.spotify.com/", { display: "banner", label: "NOVO SET", buttonText: "Dar play", imageUrl: pic("ent-dj-b1", 1000, 700) }),
      lk("Contratar para evento", "https://wa.me/5511900008888", { display: "card", subtitle: "Festas e casamentos" }),
      lk("Agenda de shows", "https://example.com/agenda", { display: "button" }),
    ],
  },
  {
    id: "ent-teatro", name: "Peça de Teatro", cat: "entretenimento", layout: "classic", font: "serif", pal: "plum", shape: "rounded", style: "soft",
    bio: "Em cartaz! Confira sessões, elenco e garanta seu lugar.",
    socials: [["instagram", "https://instagram.com/"]],
    blocks: [
      lk("Comprar ingresso", "https://example.com/ingressos", { highlight: true, buttonText: "Ver sessões" }),
      lk("Sobre o espetáculo", "https://example.com/sobre", { display: "card", subtitle: "Sinopse e elenco" }),
      lk("Teatro e como chegar", "https://maps.google.com/", { display: "button" }),
    ],
  },

  // ---------------- 📚 Educação ----------------
  {
    id: "edu-curso", name: "Curso Online", cat: "educacao", layout: "classic", font: "sans", pal: "ocean", shape: "rounded",
    bio: "Aprenda no seu ritmo, com aulas práticas e certificado.",
    socials: [["instagram", "https://instagram.com/"], ["youtube", "https://youtube.com/"]],
    blocks: [
      lk("Matricular agora", "https://example.com/matricula", { highlight: true, buttonText: "Quero me inscrever" }),
      lk("O que você vai aprender", "https://example.com/conteudo", { display: "card", subtitle: "Grade completa" }),
      lk("Aula gratuita de amostra", "https://youtube.com/", { display: "card", label: "GRÁTIS", subtitle: "Veja antes de decidir" }),
      sub("Receba materiais de estudo grátis", "Quero receber", { collectPhone: false }),
    ],
  },
  {
    id: "edu-professor", name: "Professor Particular", cat: "educacao", layout: "name", font: "serif", pal: "slate", shape: "rounded", style: "soft",
    bio: "Aulas particulares online. Da dúvida ao domínio, no seu tempo.",
    blocks: [
      hd("COMO POSSO AJUDAR", "divider"),
      lk("Agendar aula", "https://example.com/agenda", { display: "card", subtitle: "Primeira aula com desconto" }),
      lk("Matérias e níveis", "https://example.com/materias", { display: "card", subtitle: "Fundamental ao vestibular" }),
      lk("Falar comigo", "https://wa.me/5511900009999", { display: "button" }),
    ],
  },
  {
    id: "edu-idiomas", name: "Escola de Idiomas", cat: "educacao", layout: "cover", font: "rounded", pal: "sun", shape: "pill",
    bio: "Fluência de verdade, conversando desde a primeira aula 🌎",
    socials: [["instagram", "https://instagram.com/"]],
    blocks: [
      lk("Teste de nível grátis", "https://example.com/teste", { display: "banner", label: "GRÁTIS", buttonText: "Fazer teste", imageUrl: pic("edu-idiomas-b1", 1000, 700) }),
      lk("Turmas e horários", "https://example.com/turmas", { display: "card", subtitle: "Online e presencial" }),
      lk("Falar com a escola", "https://wa.me/5511910000000", { display: "button" }),
    ],
  },
  {
    id: "edu-ebook", name: "E-book & Materiais", cat: "educacao", layout: "hero", font: "sans", pal: "night", shape: "square",
    bio: "Materiais que descomplicam o aprendizado. Baixe agora.",
    blocks: [
      prod({ label: "LANÇAMENTO", title: "Guia Completo", description: "Mais de 120 páginas, com exercícios e exemplos práticos.", price: "R$ 39", seed: "edu-ebook-p1", buttonText: "Comprar e baixar", url: "https://example.com/ebook" }),
      lk("Amostra gratuita", "https://example.com/amostra", { display: "card", subtitle: "Leia o primeiro capítulo" }),
      sub("Avise-me dos próximos materiais", "Entrar na lista"),
    ],
  },

  // ---------------- 🎵 Música ----------------
  {
    id: "mus-artista", name: "Músico", cat: "musica", layout: "poster", font: "condensed", pal: "plum", video: "aurora", shape: "square",
    bio: "Novo single disponível em todas as plataformas 🎧",
    socials: [["spotify", "https://open.spotify.com/"], ["youtube", "https://youtube.com/"], ["instagram", "https://instagram.com/"]],
    blocks: [
      lk("Ouvir agora", "https://open.spotify.com/", { display: "banner", label: "NOVO SINGLE", buttonText: "Dar play", imageUrl: pic("mus-artista-b1", 1000, 700) }),
      lk("Clipe no YouTube", "https://youtube.com/", { display: "card", subtitle: "Assista em primeira mão" }),
      lk("Shows e turnê", "https://example.com/shows", { display: "card", subtitle: "Próximas datas" }),
    ],
  },
  {
    id: "mus-banda", name: "Banda", cat: "musica", layout: "hero", font: "condensed", pal: "ink", shape: "square", style: "outline",
    bio: "Som que não cabe em rótulo. Ouça, siga e venha ao show.",
    socials: [["spotify", "https://open.spotify.com/"], ["instagram", "https://instagram.com/"], ["youtube", "https://youtube.com/"]],
    blocks: [
      lk("Nosso Spotify", "https://open.spotify.com/", { highlight: true, buttonText: "Ouvir" }),
      lk("Agenda de shows", "https://example.com/agenda", { display: "card", subtitle: "Onde tocamos" }),
      lk("Contratação", "https://example.com/contato", { display: "button" }),
    ],
  },
  {
    id: "mus-produtor", name: "Produtor Musical", cat: "musica", layout: "cover", font: "tech", pal: "ocean", video: "night" as Video, style: "outline",
    bio: "Mixagem, master e produção. Transforme sua ideia em faixa.",
    socials: [["instagram", "https://instagram.com/"], ["spotify", "https://open.spotify.com/"]],
    blocks: [
      lk("Ouvir trabalhos", "https://open.spotify.com/", { display: "banner", label: "PORTFÓLIO", buttonText: "Ouvir", imageUrl: pic("mus-produtor-b1", 1000, 700) }),
      lk("Orçar produção", "https://wa.me/5511910001111", { display: "card", subtitle: "Conte sobre seu projeto" }),
      lk("Tabela de serviços", "https://example.com/servicos", { display: "button" }),
    ],
  },
  {
    id: "mus-professor", name: "Aulas de Música", cat: "musica", layout: "classic", font: "serif", pal: "sand", shape: "rounded", style: "soft",
    bio: "Professor de violão e teoria. Toque sua primeira música já na estreia.",
    blocks: [
      lk("Agendar aula experimental", "https://example.com/experimental", { highlight: true, buttonText: "Quero experimentar" }),
      lk("Planos de aula", "https://example.com/planos", { display: "card", subtitle: "Online e presencial" }),
      lk("Vídeos no YouTube", "https://youtube.com/", { display: "button" }),
    ],
  },

  // ---------------- 🎮 Tecnologia e jogos ----------------
  {
    id: "tec-streamer", name: "Streamer / Gamer", cat: "tecnologia", layout: "poster", font: "tech", pal: "ocean", video: "night" as Video, shape: "square", style: "outline",
    bio: "Live todo dia. Entra pra tribo e não perde nenhuma gameplay 🎮",
    socials: [["instagram", "https://instagram.com/"], ["youtube", "https://youtube.com/"], ["tiktok", "https://tiktok.com/"]],
    blocks: [
      lk("Assistir ao vivo", "https://twitch.tv/", { display: "banner", label: "AO VIVO", buttonText: "Entrar na live", imageUrl: pic("tec-streamer-b1", 1000, 700) }),
      lk("Canal no YouTube", "https://youtube.com/", { display: "card", subtitle: "Melhores momentos" }),
      lk("Servidor no Discord", "https://discord.com/", { display: "card", label: "COMUNIDADE", subtitle: "Entra pro nosso grupo" }),
    ],
  },
  {
    id: "tec-dev", name: "Dev / Portfólio", cat: "tecnologia", layout: "name", font: "mono", pal: "slate", shape: "square", style: "outline",
    bio: "Desenvolvedor full-stack. Projetos, código e contato.",
    socials: [["linkedin", "https://linkedin.com/"]],
    blocks: [
      hd("PROJETOS", "divider"),
      lk("Meu GitHub", "https://github.com/", { display: "card", subtitle: "Código aberto e projetos" }),
      lk("Portfólio", "https://example.com/portfolio", { display: "card", subtitle: "Cases com resultado" }),
      lk("Baixar currículo", "https://example.com/cv", { display: "button" }),
    ],
  },
  {
    id: "tec-startup", name: "Startup / App", cat: "tecnologia", layout: "hero", font: "sans", pal: "night", shape: "rounded",
    bio: "O app que resolve o seu problema. Baixe e teste grátis.",
    socials: [["instagram", "https://instagram.com/"], ["linkedin", "https://linkedin.com/"]],
    blocks: [
      lk("Baixar na App Store", "https://apps.apple.com/", { highlight: true, buttonText: "Baixar para iPhone" }),
      lk("Baixar no Google Play", "https://play.google.com/", { display: "button", buttonText: "Baixar para Android" }),
      stats([["+50mil", "downloads"], ["4.8★", "avaliação"], ["grátis", "para testar"]]),
      lk("Conhecer os planos", "https://example.com/planos", { display: "card" }),
    ],
  },
  {
    id: "tec-assistencia", name: "Assistência Técnica", cat: "tecnologia", layout: "cover", font: "sans", pal: "mono", shape: "rounded",
    bio: "Conserto de celulares e computadores com garantia. Orçamento na hora.",
    wa: "(11) 91000-2222",
    blocks: [
      lk("Pedir orçamento", "https://wa.me/5511910002222", { display: "banner", label: "ORÇAMENTO", buttonText: "Falar agora", imageUrl: pic("tec-assistencia-b1", 1000, 700) }),
      lk("Serviços que fazemos", "https://example.com/servicos", { display: "card", subtitle: "Telas, baterias, formatação" }),
      lk("Onde estamos", "https://maps.google.com/", { display: "button" }),
    ],
  },

  // ---------------- 🌴 Viagens e atividades ----------------
  {
    id: "via-agencia", name: "Agência de Viagens", cat: "viagens", layout: "poster", font: "rounded", pal: "ocean", video: "forest",
    bio: "Roteiros montados pra você só se preocupar em aproveitar ✈️",
    socials: [["instagram", "https://instagram.com/"]],
    blocks: [
      lk("Ver pacotes", "https://example.com/pacotes", { display: "banner", label: "PACOTES", buttonText: "Explorar destinos", imageUrl: pic("via-agencia-b1", 1000, 700) }),
      lk("Montar roteiro sob medida", "https://wa.me/5511910003333", { display: "card", subtitle: "Do seu jeito" }),
      lk("Ofertas da semana", "https://example.com/ofertas", { display: "card", label: "OFERTAS" }),
    ],
  },
  {
    id: "via-guia", name: "Guia de Turismo", cat: "viagens", layout: "hero", font: "serif", pal: "forest", shape: "pill", style: "soft",
    bio: "Passeios e experiências locais com quem conhece de verdade.",
    socials: [["instagram", "https://instagram.com/"]],
    blocks: [
      lk("Reservar passeio", "https://example.com/passeios", { highlight: true, buttonText: "Reservar" }),
      lk("Experiências disponíveis", "https://example.com/experiencias", { display: "card", subtitle: "Trilhas, city tour e mais" }),
      lk("Avaliações", "https://example.com/avaliacoes", { display: "button" }),
    ],
  },
  {
    id: "via-pousada", name: "Pousada", cat: "viagens", layout: "cover", font: "elegant", pal: "sand", shape: "rounded", style: "soft",
    bio: "Seu refúgio pertinho da natureza. Reserve sua estadia.",
    wa: "(11) 91000-4444",
    blocks: [
      lk("Reservar direto", "https://wa.me/5511910004444", { display: "banner", label: "RESERVAS", buttonText: "Consultar datas", imageUrl: pic("via-pousada-b1", 1000, 700) }),
      lk("Ver acomodações", "https://example.com/quartos", { display: "card", subtitle: "Fotos e preços" }),
      lk("Como chegar", "https://maps.google.com/", { display: "button" }),
    ],
  },
  {
    id: "via-aventura", name: "Turismo de Aventura", cat: "viagens", layout: "poster", font: "condensed", pal: "lime", video: "forest", shape: "square",
    bio: "Trilhas, rapel e adrenalina com toda a segurança. Bora?",
    socials: [["instagram", "https://instagram.com/"], ["youtube", "https://youtube.com/"]],
    blocks: [
      lk("Ver atividades", "https://example.com/atividades", { display: "banner", label: "AVENTURA", buttonText: "Escolher", imageUrl: pic("via-aventura-b1", 1000, 700) }),
      lk("Agendar pelo WhatsApp", "https://wa.me/5511910005555", { display: "card", subtitle: "Grupos e individual" }),
      lk("Equipamentos inclusos", "https://example.com/equipamentos", { display: "button" }),
    ],
  },

  // ---------------- 🤝 Comunidade ----------------
  {
    id: "com-grupo", name: "Comunidade", cat: "comunidade", layout: "classic", font: "rounded", pal: "sand", shape: "pill",
    bio: "Um lugar pra trocar, aprender e crescer junto. Faça parte 🤝",
    socials: [["instagram", "https://instagram.com/"], ["telegram", "https://t.me/"]],
    blocks: [
      lk("Entrar na comunidade", "https://example.com/entrar", { highlight: true, buttonText: "Quero entrar" }),
      lk("Grupo no WhatsApp", "https://chat.whatsapp.com/", { display: "card", label: "GRUPO", subtitle: "Conversas do dia a dia" }),
      lk("Canal no Telegram", "https://t.me/", { display: "card", subtitle: "Avisos e conteúdos" }),
      sub("Receba os encontros por e-mail", "Receber agenda"),
    ],
  },
  {
    id: "com-ong", name: "ONG / Projeto Social", cat: "comunidade", layout: "hero", font: "serif", pal: "mint", shape: "rounded", style: "soft",
    bio: "Transformamos vidas com a sua ajuda. Conheça e apoie o projeto.",
    socials: [["instagram", "https://instagram.com/"]],
    blocks: [
      lk("Fazer uma doação", "https://example.com/doar", { highlight: true, buttonText: "Doar agora" }),
      lk("Seja voluntário", "https://example.com/voluntario", { display: "card", subtitle: "Doe seu tempo" }),
      lk("Nosso impacto", "https://example.com/impacto", { display: "card", subtitle: "Resultados e transparência" }),
    ],
  },
  {
    id: "com-igreja", name: "Igreja / Ministério", cat: "comunidade", layout: "cover", font: "serif", pal: "night", shape: "rounded", style: "soft",
    bio: "Todos são bem-vindos. Veja horários, cultos e como participar.",
    socials: [["instagram", "https://instagram.com/"], ["youtube", "https://youtube.com/"]],
    blocks: [
      lk("Cultos ao vivo", "https://youtube.com/", { display: "banner", label: "AO VIVO", buttonText: "Assistir", imageUrl: pic("com-igreja-b1", 1000, 700) }),
      lk("Horários e endereço", "https://maps.google.com/", { display: "card", subtitle: "Presencial e online" }),
      lk("Pedidos de oração", "https://example.com/oracao", { display: "button" }),
    ],
  },
  {
    id: "com-clube", name: "Clube de Assinatura", cat: "comunidade", layout: "name", font: "sans", pal: "plum", shape: "pill",
    bio: "Benefícios, conteúdos exclusivos e uma galera que fala a sua língua.",
    blocks: [
      hd("SEJA MEMBRO", "divider"),
      lk("Assinar o clube", "https://example.com/assinar", { display: "card", label: "MEMBROS", subtitle: "Vantagens todo mês" }),
      lk("O que você recebe", "https://example.com/beneficios", { display: "card", subtitle: "Lista completa" }),
      sub("Prévia grátis no seu e-mail", "Quero a prévia"),
    ],
  },
];

export const ESSENTIAL_TEMPLATES: PageTemplate[] = ESSENTIALS.map(build);

export const ESSENTIAL_COLLECTIONS: TemplateCollection[] = CATS.map((c) => ({
  id: c.id,
  tab: "essencial",
  name: c.name,
  description: `Modelos de ${c.name.replace(/^[^\p{L}]+/u, "")}.`,
  swatch: c.swatch,
  templateIds: ESSENTIALS.filter((m) => m.cat === c.id).map((m) => m.id),
}));
