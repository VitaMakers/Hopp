import { link, photo, product, slide, WHATS, type SiteTemplate } from "./helpers";

export const neonTemplate: SiteTemplate = {
  design: "neon",
  id: "site-neon",
  name: "Neon",
  category: "Negócios",
  description: "Agência de IA e automação em preto com verde neon: capa com forma luminosa, cartão de parceiros, serviços numerados, setores e cases.",
  theme: { background: "#0a0c0a", text: "#ffffff", accent: "#52f224" },
  bio: "Ajudamos empresas a desenhar, construir e implementar soluções de IA e automação que poupam tempo, reduzem custos e geram crescimento.",
  socials: [
    { platform: "whatsapp", url: WHATS },
    { platform: "instagram", url: "https://www.instagram.com/" },
    { platform: "linkedin", url: "https://www.linkedin.com/" },
  ],
  premium: {
    tagline: "Agência de IA & Automação",
    heroPill: "Agência de IA para negócios modernos",
    heading: "Crie, automatize\ne escale com IA\nAgência de IA & Automação",
    promoButton: "Consultoria grátis",
    promoUrl: WHATS,
    siteLabel: "",
    heroSlides: slide(photo("1550751827-4bd374c3f58b")),
    heroPosX: 50,
    heroPosY: 50,
    // Partner card.
    benefits: ["Orbita", "_fluxo", "Nuvem", "Pulso"],
    promoBadge: "",
    promoDiscount: "",
    featureLabel: "",
    featureTitle: "Confiada por\ntimes que pensam à frente",
    promoNote: "De fluxos com IA à automação de ponta a ponta, para operar melhor e produzir mais.",
    contactLabel: "Ver cases",
    featureUrl: WHATS,
    featureImageUrl: photo("1581094794329-c8112a89af12", 600),
    // About + video card.
    sectionTitle: "Sobre nós",
    aboutTitle: "Estamos construindo uma cultura de IA e automação para negócios modernos e ajudando times que querem não só adotar IA, mas entender como usá-la para automatizar o trabalho, decidir melhor e crescer mais rápido.",
    about: "Acreditamos que o verdadeiro impacto da IA e da automação aparece quando as pessoas entendem seu papel e a integram com confiança aos processos do negócio.",
    aboutImageUrl: photo("1507003211169-0a1dd7228f2d"),
    quote: "Conheça a Nexa Labs · 00:56",
    credential: "Rafael Moura · Head de IA & Automação",
    // Services: title + tabs, then the numbered card.
    navTitle: "O que implementamos\npara automatizar\nnegócios",
    navLinks: [
      { label: "Estratégia de IA", url: WHATS },
      { label: "Automação de fluxos", url: WHATS },
      { label: "IA sob medida", url: WHATS },
    ],
    linksTitle: "Estratégia de IA & Automação",
    linksLabel: "Primeira etapa",
    // Industries.
    hoursTitle: "Setores em que implementamos\nsoluções de IA & Automação",
    hoursNote: "Automatizamos fluxos e integramos IA às operações de diferentes setores.",
    hours: [
      { label: "Operações", time: "& Indústria", highlight: true, closed: false },
      { label: "Finanças", time: "& Bancos", highlight: false, closed: false },
      { label: "Saúde", time: "& Ciências", highlight: false, closed: false },
      { label: "Varejo", time: "& E-commerce", highlight: false, closed: false },
      { label: "Logística", time: "& Supply Chain", highlight: false, closed: false },
    ],
    // Works.
    catalogLabel: "Nossos cases",
    catalogTitle: "Trabalhos que\nnos orgulham",
    // Contact card.
    ctaTitle: "Fale com nosso\nespecialista em\nIA & Automação",
    ctaText: "Marina Duarte\nConsultora líder — IA & Automação",
    ctaButton: "Agendar consultoria",
    partOrder: ["premium:hero", "premium:feature", "premium:stats", "premium:text", "premium:nav", "premium:links", "premium:hours", "premium:catalog", "premium:promo"],
  },
  blocks: () => [
    link({ title: "Auditoria de processos e roteiro de automação" }),
    link({
      title: "Integração de IA e automação de fluxos",
      label: "Descrição",
      subtitle: "Identificamos oportunidades, integramos as ferramentas certas de IA e automatizamos fluxos para melhorar o desempenho e eliminar tarefas manuais.",
      buttonText: "Consultoria grátis",
    }),
    link({ title: "Capacitação e treinamento do time em IA" }),
    product({ title: "FlexOps", label: "Ano: 2025 · Operações", description: "Fluxos com IA e otimização de processos", imageUrl: photo("1518770660439-4636190af475", 500) }),
    product({ title: "SaúdeAI", label: "Ano: 2025 · Saúde", description: "IA para jornada do paciente e operações", imageUrl: photo("1677442136019-21780ecad995", 500) }),
    product({ title: "AutoVarejo", label: "Ano: 2024 · Varejo", description: "Automação de pedidos e atendimento", imageUrl: photo("1620712943543-bcc4688e7485", 500) }),
  ],
};
