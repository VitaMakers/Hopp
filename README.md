# Linkbio (nome provisório)

Página de link na bio no estilo do Hopp: cada pessoa monta uma página com
blocos (links, WhatsApp, produtos, imagens, mapa, salvar contato, vídeos,
música, perguntas frequentes, contagem regressiva, captação de contatos),
escolhe o visual (layouts, temas, degradê ou imagem de fundo, ícones das
redes) e acompanha visitas e cliques.

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

1. Crie um projeto no [Supabase](https://supabase.com) e rode, em ordem,
   os arquivos de `supabase/migrations/` no SQL Editor.
2. Em Authentication → URL Configuration, adicione
   `http://localhost:3000/auth/callback` às URLs de redirecionamento.
3. Copie `.env.example` para `.env.local` e preencha. A
   `SUPABASE_SERVICE_ROLE_KEY` é a chave **secret** (`sb_secret_...`) ou a
   `service_role` (começa com `eyJ`), em Project Settings → API Keys. Sem
   ela a página pública, os links curtos, as estatísticas e a captação não
   funcionam. A `STRIPE_SECRET_KEY` começa com `sk_test_` ou `sk_live_`.
4. Confirmação de e-mail: o envio padrão do Supabase manda poucos e-mails
   por hora. Para testar, desligue "Confirm email" em Authentication →
   Sign In / Providers → Email. Em produção, configure um SMTP próprio em
   Authentication → Emails → SMTP Settings.
5. `npm install` e `npm run dev`.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção |
| `npm test` | testes (Vitest) |
| `npm run typecheck` | checagem de tipos |
| `npm run lint` | ESLint |
| `npm run e2e` | teste de ponta a ponta no navegador (com o app rodando em `localhost:3000`); capturas em `e2e/shots/` |

## Próximos passos

- Upload de foto e capa (Supabase Storage); hoje são links de imagem.
- Vendas pelos blocos (produto digital, conteúdo pago) com Stripe Checkout e webhook.
- Conteúdo trancado (inscrição, pagamento, código).
- Mais blocos: produto, agenda, contato (vCard), mapa.
- Domínio próprio, plano Pro e limite de uso por plano.
- Limite de requisições em `/api/track` e `/api/subscribe`.
