# Linkbio (nome provisório)

Página de link na bio no estilo do Hopp: cada pessoa monta uma página com
blocos (links, vídeos, música, perguntas frequentes, contagem regressiva,
captação de contatos), escolhe o visual e acompanha visitas e cliques.

A análise do produto de referência está em `analises/hopp/` no repositório
VitaMakers/Test-rea.

## Tecnologia

- Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS 4
- Supabase: Postgres, login e regras de acesso por linha (RLS)
- Stripe Connect para pagamentos, atrás de `src/lib/payments`
- dnd-kit para arrastar blocos, Zod para validar a página

## Como funciona

- **A página é um documento JSON** (`src/lib/page/schema.ts`): perfil,
  redes sociais, lista de blocos tipados, tema e SEO. O editor salva um
  rascunho a cada alteração. **Publicar** copia o rascunho para a versão
  pública e guarda uma revisão.
- **Página pública**: `/<endereço>`, montada no servidor (abre rápido e o
  Google lê). O mesmo componente (`PageView`) faz a prévia no editor.
- **Links curtos**: `/l/<código>` registra o clique e redireciona.
- **Estatísticas**: visitas, cliques por bloco, por rede social e por link
  curto. Os eventos chegam por `/api/track`.
- **Contatos**: o bloco "Captar contatos" envia para `/api/subscribe`.
  A lista pode ser exportada em CSV.
- **Pagamentos**: em Configurações, o criador conecta uma conta Stripe
  Express. A venda pelos blocos ainda não foi feita.

## Rodar localmente

1. Crie um projeto no [Supabase](https://supabase.com) e rode
   `supabase/migrations/0001_init.sql` no SQL Editor.
2. Em Authentication → URL Configuration, adicione
   `http://localhost:3000/auth/callback` às URLs de redirecionamento.
3. Copie `.env.example` para `.env.local` e preencha.
4. `npm install` e `npm run dev`.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção |
| `npm test` | testes (Vitest) |
| `npm run typecheck` | checagem de tipos |
| `npm run lint` | ESLint |

## Próximos passos

- Upload de foto e capa (Supabase Storage); hoje são links de imagem.
- Vendas pelos blocos (produto digital, conteúdo pago) com Stripe Checkout e webhook.
- Conteúdo trancado (inscrição, pagamento, código).
- Mais blocos: produto, agenda, contato (vCard), mapa.
- Domínio próprio, plano Pro e limite de uso por plano.
- Limite de requisições em `/api/track` e `/api/subscribe`.
